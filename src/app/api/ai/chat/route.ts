import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { tasksMcpService } from "@/services/mcp/tasks-mcp.service";

export const dynamic = "force-dynamic";
export const runtime = "edge";

type ChatRole = "user" | "model";

interface ChatMessage {
  role: ChatRole;
  text: string;
}

interface ExtractedTaskData {
  title: string;
  description: string | null;
  priority: "baja" | "media" | "alta";
  due_date: string | null;
}

const DEFAULT_SYSTEM_PROMPT = `Eres el asistente de OrganizaT, una aplicación de productividad personal.
Ayudas al usuario a gestionar su vida de forma eficiente.

IMPORTANTE:
- Nunca inventes tareas, notas ni eventos. Toda la información real proviene de las herramientas del sistema.
- Si el usuario pregunta por sus tareas, SIEMPRE usa los datos reales devueltos por el sistema, no los imagines.
- Si no tienes acceso a los datos en este momento, díselo claramente.
- Responde siempre en español, de forma amigable, clara y concisa.
- Si devuelves listas de tareas, usa formato markdown con negritas, viñetas y emojis de estado.
- No repitas información obvia. Ve al punto.
- Si el usuario te pide crear, completar, actualizar o eliminar tareas, TÚ PUEDES HACERLO mediante las herramientas del sistema. No digas que no puedes.`;

const EXTRACT_TASK_PROMPT = `Eres un extractor de datos de tareas. El usuario quiere crear una tarea.
Extrae del texto del usuario los siguientes campos en formato JSON estricto:

- "title": string — el título o nombre de la tarea (obligatorio)
- "description": string | null — descripción adicional si la hay
- "priority": "baja" | "media" | "alta" — prioridad (si no se menciona, usa "media")
- "due_date": string | null — fecha límite en formato ISO 8601 (YYYY-MM-DDTHH:mm:ssZ). Si el usuario dice "7 de abril" y estamos en 2025, pon "2025-04-07T23:59:00Z". Si no se menciona fecha, pon null.

REGLAS:
- Responde SOLO con el JSON, sin texto adicional, sin bloques de código, sin explicación.
- El año actual es 2025 a menos que el usuario indique otro.
- Si el usuario dice "mañana", "pasado mañana", "el lunes", etc., calcula la fecha relativa a hoy.
- Si no puedes extraer un título claro, usa el texto completo como título.

Ejemplo de respuesta:
{"title":"Hacer el cluster de back y front para devops","description":null,"priority":"alta","due_date":"2025-04-07T23:59:00Z"}`;

// ─── Intent detection ────────────────────────────────────────────────────────

function getTaskIntent(
  text: string,
): "list" | "create" | "complete" | "update" | "delete" | null {
  const t = text.toLowerCase();

  // LIST
  if (
    /\b(lista|muéstrame|muestrame|mostrar|ver|cuáles son|cuales son|qué tareas|que tareas|mis tareas|tareas pendientes|tareas de hoy|dame mis tareas|tengo tareas)\b/.test(
      t,
    )
  )
    return "list";

  // CREATE — very broad to catch natural language
  if (
    /\b(crea(r|me|rme)?|nueva|agrega(r|me|rme)?|añade|añadir|añádeme|hazme|haz(me)?)\b.{0,30}\btarea\b/.test(
      t,
    ) ||
    /\btarea\b.{0,30}\b(nueva|crear|agregar|añadir)\b/.test(t) ||
    /\b(crea(r|me)?|agrega(r|me)?|añade|haz(me)?)\s+(una\s+)?tarea\b/.test(t) ||
    /\btarea.{0,10}(sobre|para|de|llamada|que)\b/.test(t)
  )
    return "create";

  // COMPLETE
  if (
    /\b(completa(r|me|rme)?|marca(r|me)?|terminé|terminar|finaliza(r)?|marcar como (hecho|completad[ao]))\b.{0,40}\btarea\b/.test(
      t,
    ) ||
    /\btarea\b.{0,40}\b(completa(r|da)?|terminad[ao]|hech[ao])\b/.test(t)
  )
    return "complete";

  // UPDATE
  if (
    /\b(actualiza(r|me)?|edita(r|me)?|modifica(r|me)?|cambia(r|me)?|renombra(r|me)?)\b.{0,30}\btarea\b/.test(
      t,
    )
  )
    return "update";

  // DELETE
  if (/\b(elimina(r|me)?|borra(r|me)?|quita(r|me)?)\b.{0,30}\btarea\b/.test(t))
    return "delete";

  return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractUserJwt(req: NextRequest): string | undefined {
  const raw =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = raw.replace(/^bearer\s+/i, "").trim();
  return token || undefined;
}

function extractLatestUserText(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user") return messages[i].text.trim();
  }
  return "";
}

function plainResponse(text: string): Response {
  return new Response(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

function streamResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

function streamGemini(
  ai: GoogleGenAI,
  messages: ChatMessage[],
  systemInstruction: string,
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model: "gemini-3.1-flash-live-preview",
          contents: messages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          })),
          config: { systemInstruction },
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            controller.enqueue(new TextEncoder().encode(chunk.text));
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

// ─── Use Gemini to extract structured task data ──────────────────────────────

async function extractTaskDataWithAI(
  ai: GoogleGenAI,
  userText: string,
): Promise<ExtractedTaskData> {
  const today = new Date().toISOString().split("T")[0];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Fecha de hoy: ${today}\n\nTexto del usuario:\n${userText}`,
    config: {
      systemInstruction: EXTRACT_TASK_PROMPT,
    },
  });

  const raw = (response.text || "").trim();

  // Try to parse JSON from the response (handle possible markdown wrapping)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      title: userText.substring(0, 100),
      description: null,
      priority: "media",
      due_date: null,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    const priority = String(parsed.priority ?? "media").toLowerCase();
    const validPriorities = ["baja", "media", "alta"];

    return {
      title: String(parsed.title || userText.substring(0, 100)),
      description: parsed.description ? String(parsed.description) : null,
      priority: validPriorities.includes(priority)
        ? (priority as "baja" | "media" | "alta")
        : "media",
      due_date: parsed.due_date ? String(parsed.due_date) : null,
    };
  } catch {
    return {
      title: userText.substring(0, 100),
      description: null,
      priority: "media",
      due_date: null,
    };
  }
}

// ─── Task data formatters ────────────────────────────────────────────────────

function markdownListFromTasks(tasks: Array<Record<string, unknown>>): string {
  if (tasks.length === 0) {
    return "No tienes tareas por el momento.";
  }

  const priorityEmoji: Record<string, string> = {
    alta: "🔴",
    media: "🟡",
    baja: "🟢",
  };

  const lines: string[] = [`## Tus tareas (${tasks.length})`, ""];

  tasks.forEach((task) => {
    const title = String(task.title ?? "Sin título");
    const priority = String(task.priority ?? "media");
    const prioEmoji = priorityEmoji[priority] ?? "⚪";
    const dueDate = task.due_date
      ? new Date(String(task.due_date)).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Sin fecha";
    const status = task.is_completed ? "✅" : "⏳";
    const tagList =
      Array.isArray(task.tags) && task.tags.length > 0
        ? ` · ${task.tags
            .map((t: Record<string, unknown>) => `#${t.name}`)
            .join(" ")}`
        : "";

    lines.push(
      `- ${status} **${title}**`,
      `  ${prioEmoji} Prioridad: **${priority}** · 📅 ${dueDate}${tagList}`,
      "",
    );
  });

  return lines.join("\n");
}

function extractTasksFromMcpResult(
  result: unknown,
): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;

  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as Array<Record<string, unknown>>;
    if (Array.isArray(r.tasks))
      return r.tasks as Array<Record<string, unknown>>;
  }

  return [];
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const activeSystemPrompt = systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const latestText = extractLatestUserText(messages as ChatMessage[]);
    const userJwt = extractUserJwt(req);
    const intent = latestText ? getTaskIntent(latestText) : null;

    // ── Task: LIST ───────────────────────────────────────────────────────────
    if (intent === "list") {
      try {
        const result = await tasksMcpService.listTasks("tasks", {
          limit: 20,
          jwt: userJwt,
        });

        const tasks = extractTasksFromMcpResult(result);
        return plainResponse(markdownListFromTasks(tasks));
      } catch (err) {
        console.error("[MCP] list_tasks failed:", err);
        return plainResponse(
          "⚠️ No pude conectarme al servicio de tareas en este momento. Intenta de nuevo en unos segundos.",
        );
      }
    }

    // ── Task: CREATE ─────────────────────────────────────────────────────────
    if (intent === "create") {
      try {
        // Use Gemini to extract structured data from natural language
        const taskData = await extractTaskDataWithAI(ai, latestText);

        if (!taskData.title) {
          return plainResponse(
            "¿Cuál es el título de la tarea que quieres crear?",
          );
        }

        const created = (await tasksMcpService.createTask(
          taskData.title,
          taskData.description ?? undefined,
          taskData.priority,
          taskData.due_date,
          null,
          userJwt,
        )) as Record<string, unknown>;

        const createdTitle = String(created?.title ?? taskData.title);
        const createdPriority = String(created?.priority ?? taskData.priority);
        const createdDate = created?.due_date
          ? new Date(String(created.due_date)).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : taskData.due_date
            ? new Date(taskData.due_date).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Sin fecha";
        const createdDesc = taskData.description
          ? `\n- **Descripción:** ${taskData.description}`
          : "";

        const priorityEmoji: Record<string, string> = {
          alta: "🔴",
          media: "🟡",
          baja: "🟢",
        };
        const prioEmoji = priorityEmoji[createdPriority] ?? "⚪";

        return plainResponse(
          `✅ **Tarea creada exitosamente**\n\n- **Título:** ${createdTitle}${createdDesc}\n- **Prioridad:** ${prioEmoji} ${createdPriority}\n- **Fecha límite:** 📅 ${createdDate}\n\n¿Necesitas algo más?`,
        );
      } catch (err) {
        console.error("[MCP] create_task failed:", err);
        return plainResponse(
          "⚠️ No pude crear la tarea en este momento. Intenta de nuevo en unos segundos.",
        );
      }
    }

    // ── Task: COMPLETE ───────────────────────────────────────────────────────
    if (intent === "complete") {
      // First fetch tasks so Gemini can reference real ones
      let taskListContext = "";
      try {
        const result = await tasksMcpService.listTasks("tasks", {
          limit: 20,
          jwt: userJwt,
        });
        const tasks = extractTasksFromMcpResult(result);
        if (tasks.length > 0) {
          taskListContext = `\n\nTAREAS REALES DEL USUARIO (usa estos IDs y nombres exactos):\n${tasks
            .map(
              (t) =>
                `- ID: ${t.id} | Título: "${t.title}" | Estado: ${t.is_completed ? "completada" : "pendiente"}`,
            )
            .join("\n")}`;
        }
      } catch {
        // continue without context
      }

      const guidedPrompt = `${activeSystemPrompt}

CONTEXTO ACTUAL: El usuario quiere completar una tarea.
${taskListContext}

Si puedes identificar claramente qué tarea quiere completar basándote en su mensaje y la lista de tareas reales, dile que la vas a marcar como completada y muestra el nombre.
Si no estás seguro de cuál tarea se refiere, muéstrale la lista de tareas pendientes y pídele que especifique cuál.
NO inventes tareas. Solo usa las de la lista real.`;

      return streamResponse(
        streamGemini(ai, messages as ChatMessage[], guidedPrompt),
      );
    }

    // ── Task: UPDATE ─────────────────────────────────────────────────────────
    if (intent === "update") {
      let taskListContext = "";
      try {
        const result = await tasksMcpService.listTasks("tasks", {
          limit: 20,
          jwt: userJwt,
        });
        const tasks = extractTasksFromMcpResult(result);
        if (tasks.length > 0) {
          taskListContext = `\n\nTAREAS REALES DEL USUARIO:\n${tasks
            .map(
              (t) =>
                `- ID: ${t.id} | Título: "${t.title}" | Prioridad: ${t.priority} | Fecha: ${t.due_date || "sin fecha"}`,
            )
            .join("\n")}`;
        }
      } catch {
        // continue without context
      }

      const guidedPrompt = `${activeSystemPrompt}

CONTEXTO ACTUAL: El usuario quiere actualizar/editar una tarea.
${taskListContext}

Si puedes identificar qué tarea quiere modificar y qué cambios quiere hacer, confirma los cambios.
Si no estás seguro, muéstrale las tareas y pregunta cuál quiere editar y qué quiere cambiar.
NO inventes tareas. Solo usa las de la lista real.`;

      return streamResponse(
        streamGemini(ai, messages as ChatMessage[], guidedPrompt),
      );
    }

    // ── Task: DELETE ─────────────────────────────────────────────────────────
    if (intent === "delete") {
      let taskListContext = "";
      try {
        const result = await tasksMcpService.listTasks("tasks", {
          limit: 20,
          jwt: userJwt,
        });
        const tasks = extractTasksFromMcpResult(result);
        if (tasks.length > 0) {
          taskListContext = `\n\nTAREAS REALES DEL USUARIO:\n${tasks
            .map((t) => `- ID: ${t.id} | Título: "${t.title}"`)
            .join("\n")}`;
        }
      } catch {
        // continue without context
      }

      const guidedPrompt = `${activeSystemPrompt}

CONTEXTO ACTUAL: El usuario quiere eliminar una tarea.
${taskListContext}

Si puedes identificar claramente qué tarea quiere eliminar, pídele confirmación antes de proceder.
Si no estás seguro, muéstrale la lista y pídele que especifique cuál.
NO inventes tareas. Solo usa las de la lista real.`;

      return streamResponse(
        streamGemini(ai, messages as ChatMessage[], guidedPrompt),
      );
    }

    // ── Default: Gemini conversational ───────────────────────────────────────
    return streamResponse(
      streamGemini(ai, messages as ChatMessage[], activeSystemPrompt),
    );
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
