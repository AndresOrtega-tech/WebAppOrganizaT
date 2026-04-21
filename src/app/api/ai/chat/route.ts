import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_USE_DEV_API === "true"
    ? (process.env.NEXT_PUBLIC_DEV_BACKEND_URL ??
      "https://api-organiza-tb-git-development-andresortegatechs-projects.vercel.app/api")
    : (process.env.NEXT_PUBLIC_BACKEND_URL ??
      "https://api-organiza-tb.vercel.app/api");

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

interface ExtractedEventData {
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  is_all_day: boolean;
}

interface ExtractedNoteData {
  title: string;
  content: string;
}

interface ExtractedTaskUpdateData {
  title: string | null;
  description: string | null;
  priority: "baja" | "media" | "alta" | null;
  due_date: string | null;
  is_completed: boolean | null;
}

interface ExtractedEventUpdateData {
  title: string | null;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_all_day: boolean | null;
}

interface ExtractedNoteUpdateData {
  title: string | null;
  content: string | null;
  is_archived: boolean | null;
}

interface ExtractedTagData {
  name: string;
  color: string | null;
}

interface ExtractedTagUpdateData {
  name: string | null;
  color: string | null;
}

interface ExtractedTagAssignmentData {
  tag_name: string | null;
  target_name: string | null;
}

interface ExtractedLinkData {
  primary_name: string | null;
  secondary_name: string | null;
}

type SupportedEntity = "task" | "event" | "note" | "tag";
type RelatableEntity = Exclude<SupportedEntity, "tag">;
type SupportedAction =
  | "list"
  | "get"
  | "create"
  | "complete"
  | "update"
  | "delete"
  | "related"
  | "assign_tag"
  | "remove_tag"
  | "link"
  | "unlink";

const DEFAULT_TAG_COLOR = "#6366F1";
const ENTITY_API_PATHS: Record<SupportedEntity, string> = {
  task: "/tasks",
  event: "/events",
  note: "/notes",
  tag: "/tags",
};

const ENTITY_LABELS: Record<SupportedEntity, string> = {
  task: "tarea",
  event: "evento",
  note: "nota",
  tag: "etiqueta",
};

const DEFAULT_SYSTEM_PROMPT = `Eres el asistente de OrganizaT, una aplicación de productividad personal.
Ayudas al usuario a gestionar tareas, eventos, notas, etiquetas y relaciones entre ellas de forma eficiente.

IMPORTANTE:
- Nunca inventes tareas, notas, eventos ni etiquetas. Toda la información real proviene del sistema.
- Responde siempre en español, de forma amigable, clara y concisa.
- Usá formato markdown con negritas, viñetas y emojis de estado para listar información.
- No repitas información obvia. Ve al punto.
- Podés listar, crear, consultar, actualizar y eliminar tareas, eventos, notas y etiquetas.
- También podés agregar o quitar etiquetas y vincular o desvincular tareas, eventos y notas.`;

const EXTRACT_TASK_PROMPT = `Eres un extractor de datos de tareas. El usuario quiere crear una tarea.
Extrae del texto del usuario los siguientes campos en formato JSON estricto:

- "title": string — el título o nombre de la tarea (obligatorio)
- "description": string | null — descripción adicional si la hay
- "priority": "baja" | "media" | "alta" — prioridad (si no se menciona, usa "media")
- "due_date": string | null — fecha límite en formato ISO 8601 (YYYY-MM-DDTHH:mm:ssZ). Si el usuario dice "7 de abril" y estamos en 2026, pon "2026-04-07T23:59:00Z". Si no se menciona fecha, pon null.

REGLAS:
- Responde SOLO con el JSON, sin texto adicional, sin bloques de código, sin explicación.
- El año actual es 2026 a menos que el usuario indique otro.
- Si el usuario dice "mañana", "pasado mañana", "el lunes", etc., calcula la fecha relativa a hoy.
- Si no puedes extraer un título claro, usa el texto completo como título.

Ejemplo de respuesta:
{"title":"Hacer el cluster de back y front para devops","description":null,"priority":"alta","due_date":"2026-04-07T23:59:00Z"}`;

const EXTRACT_EVENT_PROMPT = `Eres un extractor de datos de eventos. El usuario quiere crear un evento.
Extrae del texto del usuario los siguientes campos en formato JSON estricto:

- "title": string — el título del evento (obligatorio)
- "description": string | null — descripción si la hay
- "start_time": string — fecha y hora de inicio en ISO 8601 (YYYY-MM-DDTHH:mm:ssZ). Si no hay hora, usá 09:00.
- "end_time": string — fecha y hora de fin en ISO 8601. Si no se indica duración, asumí 1 hora después del inicio.
- "location": string | null — lugar si se menciona
- "is_all_day": boolean — true solo si el usuario dice explícitamente "todo el día"

REGLAS:
- Responde SOLO con el JSON, sin texto adicional, sin bloques de código, sin explicación.
- El año actual es 2026 a menos que el usuario indique otro.
- Si el usuario dice "mañana", "el lunes", etc., calculá la fecha relativa a hoy.

Ejemplo de respuesta:
{"title":"Reunión con el equipo","description":"Revisión semanal","start_time":"2026-04-20T10:00:00Z","end_time":"2026-04-20T11:00:00Z","location":"Sala de juntas","is_all_day":false}`;

const EXTRACT_NOTE_PROMPT = `Eres un extractor de datos de notas. El usuario quiere crear una nota.
Extrae del texto del usuario los siguientes campos en formato JSON estricto:

- "title": string — el título de la nota (obligatorio, máximo 80 chars)
- "content": string — el contenido. Si el usuario da detalles úsalos; si solo da un título, el content puede ser igual al title.

REGLAS:
- Responde SOLO con el JSON, sin texto adicional, sin bloques de código, sin explicación.

Ejemplo de respuesta:
{"title":"Ideas para el rediseño del dashboard","content":"Cambiar layout a grid, mejorar colores, agregar gráficas de progreso."}`;

const UPDATE_TASK_PROMPT = `Eres un extractor de cambios de tareas. El usuario quiere actualizar una tarea.
Devuelve SOLO un JSON estricto con estos campos:

- "title": string | null
- "description": string | null
- "priority": "baja" | "media" | "alta" | null
- "due_date": string | null
- "is_completed": boolean | null

REGLAS:
- Solo incluye un valor distinto de null si el usuario lo pidió explícitamente.
- Si no mencionó una fecha, usa null en "due_date".
- Si pide completar o reabrir la tarea, usa "is_completed".
- No inventes valores ni uses el texto completo como título.
- Responde SOLO con JSON.`;

const UPDATE_EVENT_PROMPT = `Eres un extractor de cambios de eventos. El usuario quiere actualizar un evento.
Devuelve SOLO un JSON estricto con estos campos:

- "title": string | null
- "description": string | null
- "start_time": string | null
- "end_time": string | null
- "location": string | null
- "is_all_day": boolean | null

REGLAS:
- Solo incluye un valor distinto de null si el usuario lo mencionó explícitamente.
- Convierte fechas y horas a ISO 8601 cuando estén presentes.
- Si pide "todo el día", usa true en "is_all_day".
- Responde SOLO con JSON.`;

const UPDATE_NOTE_PROMPT = `Eres un extractor de cambios de notas. El usuario quiere actualizar una nota.
Devuelve SOLO un JSON estricto con estos campos:

- "title": string | null
- "content": string | null
- "is_archived": boolean | null

REGLAS:
- Solo incluye un valor distinto de null si el usuario lo pidió explícitamente.
- Si el usuario pide archivar, usa true en "is_archived". Si pide desarchivar, usa false.
- Responde SOLO con JSON.`;

const EXTRACT_TAG_PROMPT = `Eres un extractor de datos de etiquetas. El usuario quiere crear una etiqueta.
Extrae del texto del usuario estos campos en JSON estricto:

- "name": string — nombre de la etiqueta (obligatorio)
- "color": string | null — color si el usuario lo menciona. Puede ser hexadecimal o un nombre simple.

REGLAS:
- Responde SOLO con JSON.
- Si no menciona color, usa null.
- No inventes nombres adicionales.`;

const UPDATE_TAG_PROMPT = `Eres un extractor de cambios de etiquetas. El usuario quiere actualizar una etiqueta.
Devuelve SOLO un JSON estricto con estos campos:

- "name": string | null
- "color": string | null

REGLAS:
- Solo incluye valores distintos de null si el usuario los pidió explícitamente.
- Responde SOLO con JSON.`;

// ─── Intent classification (AI-first) ───────────────────────────────────────

interface IntentResult {
  entity: SupportedEntity | null;
  action: SupportedAction | null;
  secondary_entity: SupportedEntity | null;
}

type ChatToolName =
  | "list_tasks"
  | "get_task"
  | "create_task"
  | "complete_task"
  | "update_task"
  | "delete_task"
  | "get_task_related"
  | "assign_tag_to_task"
  | "remove_tag_from_task"
  | "link_task_note"
  | "unlink_task_note"
  | "link_task_event"
  | "unlink_task_event"
  | "list_events"
  | "get_event"
  | "create_event"
  | "update_event"
  | "delete_event"
  | "get_event_related"
  | "assign_tag_to_event"
  | "remove_tag_from_event"
  | "link_event_task"
  | "unlink_event_task"
  | "link_event_note"
  | "unlink_event_note"
  | "list_notes"
  | "get_note"
  | "create_note"
  | "update_note"
  | "delete_note"
  | "get_note_related"
  | "assign_tag_to_note"
  | "remove_tag_from_note"
  | "link_note_task"
  | "unlink_note_task"
  | "link_note_event"
  | "unlink_note_event"
  | "list_tags"
  | "get_tag"
  | "create_tag"
  | "update_tag"
  | "delete_tag";

interface ToolSelection {
  tool: ChatToolName | null;
  primary_query: string | null;
  secondary_query: string | null;
}

const TOOL_SELECTION_PROMPT = `Sos el router de tools del chat de OrganizaT.
Analizá el mensaje del usuario y decidí exactamente qué tool concreta debe ejecutarse.
Respondé SOLO con JSON estricto con estos campos:
- "tool": string | null
- "primary_query": string | null
- "secondary_query": string | null

Tools disponibles:
- list_tasks, get_task, create_task, complete_task, update_task, delete_task, get_task_related
- assign_tag_to_task, remove_tag_from_task, link_task_note, unlink_task_note, link_task_event, unlink_task_event
- list_events, get_event, create_event, update_event, delete_event, get_event_related
- assign_tag_to_event, remove_tag_from_event, link_event_task, unlink_event_task, link_event_note, unlink_event_note
- list_notes, get_note, create_note, update_note, delete_note, get_note_related
- assign_tag_to_note, remove_tag_from_note, link_note_task, unlink_note_task, link_note_event, unlink_note_event
- list_tags, get_tag, create_tag, update_tag, delete_tag

Reglas:
- Si el usuario no está pidiendo una acción real sobre datos, respondé {"tool":null,"primary_query":null,"secondary_query":null}.
- primary_query debe contener el nombre o descripción breve del recurso principal cuando haga falta identificar uno puntual.
- secondary_query debe contener el nombre o descripción breve del recurso secundario cuando haga falta una segunda entidad, como etiquetas o vínculos.
- Para create_* podés dejar primary_query y secondary_query en null.
- Para link/unlink elegí la tool cuyo recurso principal sea el foco del pedido del usuario.
- Respondé SOLO con JSON, sin explicación, sin bloques de código.

Ejemplos:
"muéstrame mis tareas" → {"tool":"list_tasks","primary_query":null,"secondary_query":null}
"crea una tarea para mañana" → {"tool":"create_task","primary_query":null,"secondary_query":null}
"detalle del evento demo" → {"tool":"get_event","primary_query":"demo","secondary_query":null}
"marca la tarea del informe como completada" → {"tool":"complete_task","primary_query":"informe","secondary_query":null}
"borra la nota ideas home" → {"tool":"delete_note","primary_query":"ideas home","secondary_query":null}
"cambia la prioridad de la tarea X a alta" → {"tool":"update_task","primary_query":"tarea X","secondary_query":null}
"crea una etiqueta urgente roja" → {"tool":"create_tag","primary_query":null,"secondary_query":null}
"asigná la etiqueta urgente a la tarea landing" → {"tool":"assign_tag_to_task","primary_query":"landing","secondary_query":"urgente"}
"quitale la etiqueta personal al evento demo" → {"tool":"remove_tag_from_event","primary_query":"demo","secondary_query":"personal"}
"vinculá la nota ideas con la tarea landing" → {"tool":"link_note_task","primary_query":"ideas","secondary_query":"landing"}
"desvinculá el evento demo de la tarea landing" → {"tool":"unlink_event_task","primary_query":"demo","secondary_query":"landing"}
"mostrame las relaciones de la nota retrospectiva" → {"tool":"get_note_related","primary_query":"retrospectiva","secondary_query":null}
"hola cómo estás" → {"tool":null,"primary_query":null,"secondary_query":null}`;

function extractJsonObject<T>(raw: string): T | null {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

function toolSelectionToIntent(selection: ToolSelection): IntentResult {
  switch (selection.tool) {
    case "list_tasks":
      return { entity: "task", action: "list", secondary_entity: null };
    case "get_task":
      return { entity: "task", action: "get", secondary_entity: null };
    case "create_task":
      return { entity: "task", action: "create", secondary_entity: null };
    case "complete_task":
      return { entity: "task", action: "complete", secondary_entity: null };
    case "update_task":
      return { entity: "task", action: "update", secondary_entity: null };
    case "delete_task":
      return { entity: "task", action: "delete", secondary_entity: null };
    case "get_task_related":
      return { entity: "task", action: "related", secondary_entity: null };
    case "assign_tag_to_task":
      return { entity: "task", action: "assign_tag", secondary_entity: "tag" };
    case "remove_tag_from_task":
      return { entity: "task", action: "remove_tag", secondary_entity: "tag" };
    case "link_task_note":
      return { entity: "task", action: "link", secondary_entity: "note" };
    case "unlink_task_note":
      return { entity: "task", action: "unlink", secondary_entity: "note" };
    case "link_task_event":
      return { entity: "task", action: "link", secondary_entity: "event" };
    case "unlink_task_event":
      return { entity: "task", action: "unlink", secondary_entity: "event" };
    case "list_events":
      return { entity: "event", action: "list", secondary_entity: null };
    case "get_event":
      return { entity: "event", action: "get", secondary_entity: null };
    case "create_event":
      return { entity: "event", action: "create", secondary_entity: null };
    case "update_event":
      return { entity: "event", action: "update", secondary_entity: null };
    case "delete_event":
      return { entity: "event", action: "delete", secondary_entity: null };
    case "get_event_related":
      return { entity: "event", action: "related", secondary_entity: null };
    case "assign_tag_to_event":
      return { entity: "event", action: "assign_tag", secondary_entity: "tag" };
    case "remove_tag_from_event":
      return { entity: "event", action: "remove_tag", secondary_entity: "tag" };
    case "link_event_task":
      return { entity: "event", action: "link", secondary_entity: "task" };
    case "unlink_event_task":
      return { entity: "event", action: "unlink", secondary_entity: "task" };
    case "link_event_note":
      return { entity: "event", action: "link", secondary_entity: "note" };
    case "unlink_event_note":
      return { entity: "event", action: "unlink", secondary_entity: "note" };
    case "list_notes":
      return { entity: "note", action: "list", secondary_entity: null };
    case "get_note":
      return { entity: "note", action: "get", secondary_entity: null };
    case "create_note":
      return { entity: "note", action: "create", secondary_entity: null };
    case "update_note":
      return { entity: "note", action: "update", secondary_entity: null };
    case "delete_note":
      return { entity: "note", action: "delete", secondary_entity: null };
    case "get_note_related":
      return { entity: "note", action: "related", secondary_entity: null };
    case "assign_tag_to_note":
      return { entity: "note", action: "assign_tag", secondary_entity: "tag" };
    case "remove_tag_from_note":
      return { entity: "note", action: "remove_tag", secondary_entity: "tag" };
    case "link_note_task":
      return { entity: "note", action: "link", secondary_entity: "task" };
    case "unlink_note_task":
      return { entity: "note", action: "unlink", secondary_entity: "task" };
    case "link_note_event":
      return { entity: "note", action: "link", secondary_entity: "event" };
    case "unlink_note_event":
      return { entity: "note", action: "unlink", secondary_entity: "event" };
    case "list_tags":
      return { entity: "tag", action: "list", secondary_entity: null };
    case "get_tag":
      return { entity: "tag", action: "get", secondary_entity: null };
    case "create_tag":
      return { entity: "tag", action: "create", secondary_entity: null };
    case "update_tag":
      return { entity: "tag", action: "update", secondary_entity: null };
    case "delete_tag":
      return { entity: "tag", action: "delete", secondary_entity: null };
    default:
      return { entity: null, action: null, secondary_entity: null };
  }
}

async function selectToolWithAI(
  ai: GoogleGenAI,
  userText: string,
): Promise<ToolSelection> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userText,
      config: { systemInstruction: TOOL_SELECTION_PROMPT },
    });
    const raw = (response.text ?? "").trim();
    const parsed = extractJsonObject<Partial<ToolSelection>>(raw);
    return {
      tool: parsed?.tool ?? null,
      primary_query: parsed?.primary_query ?? null,
      secondary_query: parsed?.secondary_query ?? null,
    };
  } catch {
    return { tool: null, primary_query: null, secondary_query: null };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractUserJwt(req: NextRequest): string | undefined {
  const raw =
    req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const token = raw.replace(/^bearer\s+/i, "").trim();
  return token || undefined;
}

// ─── Backend fetch helper ─────────────────────────────────────────────────────

async function backendFetch<T = unknown>(
  path: string,
  jwt: string | undefined,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string> | undefined) ?? {}),
  };
  if (jwt) headers.Authorization = `bearer ${jwt}`;

  const res = await fetch(`${BACKEND_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Backend ${options.method ?? "GET"} ${path} failed (${res.status}): ${text}`,
    );
  }

  const text = await res.text().catch(() => "");
  if (!text) return undefined as unknown as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
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
          model: "gemini-2.5-flash",
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

// ─── AI data extractors ───────────────────────────────────────────────────────

async function extractWithAI<T>(
  ai: GoogleGenAI,
  userText: string,
  systemPrompt: string,
): Promise<T | null> {
  const today = new Date().toISOString().split("T")[0];
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Fecha de hoy: ${today}\n\nTexto del usuario:\n${userText}`,
    config: { systemInstruction: systemPrompt },
  });
  return extractJsonObject<T>((response.text ?? "").trim());
}

async function resolveEntityIdWithAI(
  ai: GoogleGenAI,
  userText: string,
  entity: SupportedEntity,
  items: Array<Record<string, unknown>>,
): Promise<string | null> {
  if (items.length === 0) return null;

  const nameField = entity === "tag" ? "name" : "title";
  const label = ENTITY_LABELS[entity];
  const itemList = items
    .map((item) => `ID: ${item.id} | ${label}: "${String(item[nameField] ?? "")}"`)
    .join("\n");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `El usuario dijo: "${userText}"\n\nLista de ${label}s:\n${itemList}`,
    config: {
      systemInstruction: `Identificá qué ${label} del listado menciona el usuario. Respondé SOLO con el ID como JSON: {"item_id": "uuid-aqui"}. Si no podés identificar ninguna con certeza, respondé {"item_id": null}.`,
    },
  });
  const parsed = extractJsonObject<{ item_id: string | null }>(
    (response.text ?? "").trim(),
  );
  return parsed?.item_id ?? null;
}

async function extractTagAssignmentWithAI(
  ai: GoogleGenAI,
  userText: string,
  targetEntity: RelatableEntity,
): Promise<ExtractedTagAssignmentData | null> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userText,
    config: {
      systemInstruction: `Extrae del texto el nombre de la etiqueta y el nombre de la ${ENTITY_LABELS[targetEntity]} objetivo. Respondé SOLO con JSON estricto: {"tag_name": string | null, "target_name": string | null}. Si alguno no está claro, devolvelo como null.`,
    },
  });

  return extractJsonObject<ExtractedTagAssignmentData>(
    (response.text ?? "").trim(),
  );
}

async function extractLinkDataWithAI(
  ai: GoogleGenAI,
  userText: string,
  primaryEntity: RelatableEntity,
  secondaryEntity: RelatableEntity,
): Promise<ExtractedLinkData | null> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userText,
    config: {
      systemInstruction: `Extrae del texto el nombre de la ${ENTITY_LABELS[primaryEntity]} principal y el nombre de la ${ENTITY_LABELS[secondaryEntity]} secundaria. Respondé SOLO con JSON estricto: {"primary_name": string | null, "secondary_name": string | null}. Si alguno no está claro, devolvelo como null.`,
    },
  });

  return extractJsonObject<ExtractedLinkData>((response.text ?? "").trim());
}

async function listEntities(
  entity: SupportedEntity,
  jwt: string | undefined,
): Promise<Array<Record<string, unknown>>> {
  const path =
    entity === "task"
      ? `${ENTITY_API_PATHS.task}/?limit=50`
      : `${ENTITY_API_PATHS[entity]}/`;

  return extractItems(await backendFetch<unknown>(path, jwt));
}

async function getEntityDetail(
  entity: SupportedEntity,
  id: string,
  jwt: string | undefined,
): Promise<Record<string, unknown> | null> {
  if (entity === "tag") {
    const tags = await listEntities("tag", jwt);
    return tags.find((tag) => String(tag.id) === id) ?? null;
  }

  return backendFetch<Record<string, unknown>>(`${ENTITY_API_PATHS[entity]}/${id}`, jwt);
}

async function getRelatedData(
  entity: RelatableEntity,
  id: string,
  jwt: string | undefined,
): Promise<Record<string, unknown>> {
  return backendFetch<Record<string, unknown>>(
    `${ENTITY_API_PATHS[entity]}/${id}/related`,
    jwt,
  );
}

function getEntityTitle(
  entity: SupportedEntity,
  item: Record<string, unknown> | null | undefined,
): string {
  if (!item) return entity === "tag" ? "Sin nombre" : "Sin título";
  const key = entity === "tag" ? "name" : "title";
  return String(item[key] ?? (entity === "tag" ? "Sin nombre" : "Sin título"));
}

function truncateText(text: string, maxLength = 220): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}…`;
}

function formatDate(value: unknown): string {
  if (!value) return "Sin fecha";
  return new Date(String(value)).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: unknown): string {
  if (!value) return "Sin fecha";
  return new Date(String(value)).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relationRequest(
  primaryEntity: RelatableEntity,
  primaryId: string,
  secondaryEntity: RelatableEntity,
  secondaryId: string,
): { path: string; body: Record<string, string> } | null {
  if (
    (primaryEntity === "task" && secondaryEntity === "note") ||
    (primaryEntity === "note" && secondaryEntity === "task")
  ) {
    return {
      path: "/relations/task-note",
      body: {
        task_id: primaryEntity === "task" ? primaryId : secondaryId,
        note_id: primaryEntity === "note" ? primaryId : secondaryId,
      },
    };
  }

  if (
    (primaryEntity === "task" && secondaryEntity === "event") ||
    (primaryEntity === "event" && secondaryEntity === "task")
  ) {
    return {
      path: "/relations/task-event",
      body: {
        task_id: primaryEntity === "task" ? primaryId : secondaryId,
        event_id: primaryEntity === "event" ? primaryId : secondaryId,
      },
    };
  }

  if (
    (primaryEntity === "note" && secondaryEntity === "event") ||
    (primaryEntity === "event" && secondaryEntity === "note")
  ) {
    return {
      path: "/relations/note-event",
      body: {
        note_id: primaryEntity === "note" ? primaryId : secondaryId,
        event_id: primaryEntity === "event" ? primaryId : secondaryId,
      },
    };
  }

  return null;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function extractItems(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>;
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as Array<Record<string, unknown>>;
    if (Array.isArray(r.items)) return r.items as Array<Record<string, unknown>>;
    if (Array.isArray(r.tasks))
      return r.tasks as Array<Record<string, unknown>>;
    if (Array.isArray(r.events))
      return r.events as Array<Record<string, unknown>>;
    if (Array.isArray(r.notes))
      return r.notes as Array<Record<string, unknown>>;
    if (Array.isArray(r.tags)) return r.tags as Array<Record<string, unknown>>;
  }
  return [];
}

function markdownListFromTasks(tasks: Array<Record<string, unknown>>): string {
  if (tasks.length === 0) return "No tenés tareas por el momento.";

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
        ? ` · ${(task.tags as Array<Record<string, unknown>>)
            .map((t) => `#${t.name}`)
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

function markdownListFromEvents(
  events: Array<Record<string, unknown>>,
): string {
  if (events.length === 0) return "No tenés eventos próximos.";

  const lines: string[] = [`## Tus eventos (${events.length})`, ""];

  events.forEach((ev) => {
    const title = String(ev.title ?? "Sin título");
    const start = ev.start_time
      ? new Date(String(ev.start_time)).toLocaleDateString("es-MX", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Sin fecha";
    const location = ev.location ? ` · 📍 ${String(ev.location)}` : "";
    lines.push(`- 📅 **${title}**`, `  🕐 ${start}${location}`, "");
  });

  return lines.join("\n");
}

function markdownListFromNotes(notes: Array<Record<string, unknown>>): string {
  if (notes.length === 0) return "No tenés notas todavía.";

  const lines: string[] = [`## Tus notas (${notes.length})`, ""];

  notes.forEach((note) => {
    const title = String(note.title ?? "Sin título");
    const updated = note.updated_at
      ? new Date(String(note.updated_at)).toLocaleDateString("es-MX", {
          day: "2-digit",
          month: "short",
        })
      : "";
    lines.push(
      `- 📝 **${title}**${updated ? ` · actualizada ${updated}` : ""}`,
      "",
    );
  });

  return lines.join("\n");
}

function markdownListFromTags(tags: Array<Record<string, unknown>>): string {
  if (tags.length === 0) return "No tenés etiquetas todavía.";

  const lines: string[] = [`## Tus etiquetas (${tags.length})`, ""];

  tags.forEach((tag) => {
    const name = String(tag.name ?? "Sin nombre");
    const color = String(tag.color ?? DEFAULT_TAG_COLOR);
    lines.push(`- 🏷️ **${name}** · ${color}`, "");
  });

  return lines.join("\n");
}

function markdownDetailFromEntity(
  entity: SupportedEntity,
  item: Record<string, unknown>,
): string {
  if (entity === "task") {
    const title = getEntityTitle("task", item);
    const description = item.description
      ? `\n- **Descripción:** ${String(item.description)}`
      : "";
    const priority = String(item.priority ?? "media");
    const status = item.is_completed ? "✅ Completada" : "⏳ Pendiente";
    const tags = Array.isArray(item.tags)
      ? (item.tags as Array<Record<string, unknown>>)
          .map((tag) => `#${String(tag.name ?? "")}`)
          .filter(Boolean)
          .join(" ")
      : "";

    return `## Tarea\n\n- **Título:** ${title}${description}\n- **Estado:** ${status}\n- **Prioridad:** ${priority}\n- **Fecha límite:** ${formatDate(item.due_date)}${tags ? `\n- **Etiquetas:** ${tags}` : ""}`;
  }

  if (entity === "event") {
    const title = getEntityTitle("event", item);
    const description = item.description
      ? `\n- **Descripción:** ${String(item.description)}`
      : "";
    const location = item.location
      ? `\n- **Lugar:** 📍 ${String(item.location)}`
      : "";
    const allDay = item.is_all_day ? "\n- **Modalidad:** Todo el día" : "";

    return `## Evento\n\n- **Título:** ${title}${description}\n- **Inicio:** 🕐 ${formatDateTime(item.start_time)}\n- **Fin:** 🕓 ${formatDateTime(item.end_time)}${location}${allDay}`;
  }

  if (entity === "note") {
    const title = getEntityTitle("note", item);
    const content = item.content ? truncateText(String(item.content), 280) : "Sin contenido";
    const archived = item.is_archived ? "Sí" : "No";

    return `## Nota\n\n- **Título:** ${title}\n- **Archivada:** ${archived}\n- **Contenido:** ${content}`;
  }

  return `## Etiqueta\n\n- **Nombre:** ${getEntityTitle("tag", item)}\n- **Color:** ${String(item.color ?? DEFAULT_TAG_COLOR)}`;
}

function markdownRelatedData(
  entity: RelatableEntity,
  itemTitle: string,
  related: Record<string, unknown>,
): string {
  const lines: string[] = [
    `## Relaciones de ${ENTITY_LABELS[entity]} **${itemTitle}**`,
    "",
  ];

  const tags = extractItems({ tags: related.tags });
  const tasks = extractItems({ tasks: related.tasks });
  const events = extractItems({ events: related.events });
  const notes = extractItems({ notes: related.notes });

  if (tags.length > 0) {
    lines.push(
      `- 🏷️ **Etiquetas:** ${tags
        .map((tag) => `#${getEntityTitle("tag", tag)}`)
        .join(" ")}`,
    );
  }

  if (tasks.length > 0) {
    lines.push(
      `- ✅ **Tareas:** ${tasks
        .map((task) => getEntityTitle("task", task))
        .join(", ")}`,
    );
  }

  if (events.length > 0) {
    lines.push(
      `- 📅 **Eventos:** ${events
        .map((event) => getEntityTitle("event", event))
        .join(", ")}`,
    );
  }

  if (notes.length > 0) {
    lines.push(
      `- 📝 **Notas:** ${notes
        .map((note) => getEntityTitle("note", note))
        .join(", ")}`,
    );
  }

  if (lines.length === 2) {
    lines.push("No tiene relaciones vinculadas todavía.");
  }

  return lines.join("\n");
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

    // ── "/" shortcut commands ────────────────────────────────────────────────
    const SLASH_COMMANDS: Record<
      string,
      { entity: SupportedEntity; action: SupportedAction }
    > = {
      "/": { entity: "task", action: "list" },
      "/tareas": { entity: "task", action: "list" },
      "/eventos": { entity: "event", action: "list" },
      "/notas": { entity: "note", action: "list" },
      "/tags": { entity: "tag", action: "list" },
    };

    if (latestText in SLASH_COMMANDS) {
      const cmd = SLASH_COMMANDS[latestText];
      try {
        if (cmd.entity === "task") {
          const data = await backendFetch<unknown>(
            "/tasks/?tab=pending&limit=20",
            userJwt,
          );
          return plainResponse(markdownListFromTasks(extractItems(data)));
        }
        if (cmd.entity === "event") {
          return plainResponse(
            markdownListFromEvents(await listEntities("event", userJwt)),
          );
        }
        if (cmd.entity === "note") {
          return plainResponse(
            markdownListFromNotes(await listEntities("note", userJwt)),
          );
        }
        if (cmd.entity === "tag") {
          return plainResponse(
            markdownListFromTags(await listEntities("tag", userJwt)),
          );
        }
      } catch (err) {
        console.error(`[chat] slash command ${latestText} failed:`, err);
        return plainResponse(
          "⚠️ No pude obtener la información en este momento. Intentá de nuevo.",
        );
      }
    }

    // ── AI-first intent classification ──────────────────────────────────────
    const toolSelection = latestText
      ? await selectToolWithAI(ai, latestText)
      : { tool: null, primary_query: null, secondary_query: null };
    const intent = toolSelectionToIntent(toolSelection);
    const primaryQuery = toolSelection.primary_query?.trim() || latestText;
    const secondaryQuery = toolSelection.secondary_query?.trim() || latestText;

    const taskIntent = intent.entity === "task" ? intent.action : null;
    const eventIntent = intent.entity === "event" ? intent.action : null;
    const noteIntent = intent.entity === "note" ? intent.action : null;
    const tagIntent = intent.entity === "tag" ? intent.action : null;

    // ── TASKS ────────────────────────────────────────────────────────────────

    if (taskIntent === "list") {
      try {
        const data = await backendFetch<unknown>(
          "/tasks/?tab=pending&limit=20",
          userJwt,
        );
        return plainResponse(markdownListFromTasks(extractItems(data)));
      } catch (err) {
        console.error("[chat] list_tasks failed:", err);
        return plainResponse(
          "⚠️ No pude obtener tus tareas en este momento. Intentá de nuevo.",
        );
      }
    }

    if (taskIntent === "create") {
      try {
        const taskData = await extractWithAI<ExtractedTaskData>(
          ai,
          latestText,
          EXTRACT_TASK_PROMPT,
        );
        if (!taskData?.title) {
          return plainResponse("¿Cuál es el título de la tarea que querés crear?");
        }

        const created = await backendFetch<Record<string, unknown>>(
          "/tasks/",
          userJwt,
          {
            method: "POST",
            body: JSON.stringify({
              title: taskData.title,
              description: taskData.description,
              priority: taskData.priority,
              due_date: taskData.due_date,
              is_completed: false,
              reminders: null,
            }),
          },
        );

        const dueDate = created.due_date
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
        const prioEmoji: Record<string, string> = {
          alta: "🔴",
          media: "🟡",
          baja: "🟢",
        };
        const emoji =
          prioEmoji[String(created.priority ?? taskData.priority)] ?? "⚪";
        const desc = taskData.description
          ? `\n- **Descripción:** ${taskData.description}`
          : "";

        return plainResponse(
          `✅ **Tarea creada exitosamente**\n\n- **Título:** ${String(created.title ?? taskData.title)}${desc}\n- **Prioridad:** ${emoji} ${String(created.priority ?? taskData.priority)}\n- **Fecha límite:** 📅 ${dueDate}\n\n¿Necesitás algo más?`,
        );
      } catch (err) {
        console.error("[chat] create_task failed:", err);
        return plainResponse(
          "⚠️ No pude crear la tarea en este momento. Intentá de nuevo.",
        );
      }
    }

    if (taskIntent === "get") {
      try {
        const tasks = await listEntities("task", userJwt);
        if (tasks.length === 0) {
          return plainResponse("No tenés tareas registradas.");
        }

        const taskId = await resolveEntityIdWithAI(ai, primaryQuery, "task", tasks);
        if (!taskId) {
          return plainResponse(
            `No identifiqué qué tarea querés ver. Estas son tus tareas:\n\n${markdownListFromTasks(tasks)}`,
          );
        }

        const task = await getEntityDetail("task", taskId, userJwt);
        if (!task) {
          return plainResponse("No encontré esa tarea.");
        }

        return plainResponse(markdownDetailFromEntity("task", task));
      } catch (err) {
        console.error("[chat] get_task failed:", err);
        return plainResponse("⚠️ No pude obtener el detalle de la tarea.");
      }
    }

    if (taskIntent === "complete") {
      try {
        const tasks = extractItems(
          await backendFetch<unknown>("/tasks/?tab=pending&limit=50", userJwt),
        );
        if (tasks.length === 0) {
          return plainResponse("No tenés tareas pendientes.");
        }

        const taskId = await resolveEntityIdWithAI(ai, primaryQuery, "task", tasks);
        if (!taskId) {
          return plainResponse(
            `No identifiqué con certeza qué tarea querés completar. Estas son tus pendientes:\n\n${markdownListFromTasks(tasks)}\n\n¿Cuál querés marcar como completada?`,
          );
        }

        const updated = await backendFetch<Record<string, unknown>>(
          `/tasks/${taskId}`,
          userJwt,
          {
            method: "PATCH",
            body: JSON.stringify({ is_completed: true }),
          },
        );

        return plainResponse(
          `✅ Marqué como completada la tarea **"${String(updated.title ?? taskId)}"**.`,
        );
      } catch (err) {
        console.error("[chat] complete_task failed:", err);
        return plainResponse("⚠️ No pude completar la tarea. Intentá de nuevo.");
      }
    }

    if (taskIntent === "update") {
      try {
        const tasks = await listEntities("task", userJwt);
        if (tasks.length === 0) {
          return plainResponse("No tenés tareas para actualizar.");
        }

        const taskId = await resolveEntityIdWithAI(ai, primaryQuery, "task", tasks);
        if (!taskId) {
          return plainResponse(
            `No identifiqué qué tarea querés editar. Estas son tus tareas:\n\n${markdownListFromTasks(tasks)}\n\n¿Cuál querés actualizar y qué querés cambiar?`,
          );
        }

        const updates = await extractWithAI<ExtractedTaskUpdateData>(
          ai,
          latestText,
          UPDATE_TASK_PROMPT,
        );
        const payload: Record<string, unknown> = {};
        if (updates?.title) payload.title = updates.title;
        if (typeof updates?.description === "string") {
          payload.description = updates.description;
        }
        if (updates?.priority) payload.priority = updates.priority;
        if (updates?.due_date) payload.due_date = updates.due_date;
        if (typeof updates?.is_completed === "boolean") {
          payload.is_completed = updates.is_completed;
        }

        if (Object.keys(payload).length === 0) {
          return plainResponse(
            "No encontré cambios concretos para aplicar en esa tarea.",
          );
        }

        const updated = await backendFetch<Record<string, unknown>>(
          `/tasks/${taskId}`,
          userJwt,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );

        return plainResponse(
          `✏️ Actualicé la tarea **"${String(updated.title ?? taskId)}"** con los cambios indicados.`,
        );
      } catch (err) {
        console.error("[chat] update_task failed:", err);
        return plainResponse("⚠️ No pude actualizar la tarea. Intentá de nuevo.");
      }
    }

    if (taskIntent === "delete") {
      try {
        const tasks = await listEntities("task", userJwt);
        if (tasks.length === 0) {
          return plainResponse("No tenés tareas para eliminar.");
        }

        const taskId = await resolveEntityIdWithAI(ai, primaryQuery, "task", tasks);
        if (!taskId) {
          return plainResponse(
            `No identifiqué qué tarea querés eliminar. Estas son tus tareas:\n\n${markdownListFromTasks(tasks)}\n\n¿Cuál querés eliminar?`,
          );
        }

        const task = tasks.find((item) => String(item.id) === taskId);
        await backendFetch(`/tasks/${taskId}`, userJwt, { method: "DELETE" });

        return plainResponse(
          `🗑️ Eliminé la tarea **"${getEntityTitle("task", task)}"**.`,
        );
      } catch (err) {
        console.error("[chat] delete_task failed:", err);
        return plainResponse("⚠️ No pude eliminar la tarea. Intentá de nuevo.");
      }
    }

    if (taskIntent === "related") {
      try {
        const tasks = await listEntities("task", userJwt);
        if (tasks.length === 0) {
          return plainResponse("No tenés tareas registradas.");
        }

        const taskId = await resolveEntityIdWithAI(ai, primaryQuery, "task", tasks);
        if (!taskId) {
          return plainResponse(
            `No identifiqué qué tarea querés inspeccionar. Estas son tus tareas:\n\n${markdownListFromTasks(tasks)}`,
          );
        }

        const task = tasks.find((item) => String(item.id) === taskId);
        const related = await getRelatedData("task", taskId, userJwt);
        return plainResponse(
          markdownRelatedData("task", getEntityTitle("task", task), related),
        );
      } catch (err) {
        console.error("[chat] task_related failed:", err);
        return plainResponse("⚠️ No pude obtener las relaciones de esa tarea.");
      }
    }

    if (taskIntent === "assign_tag" || taskIntent === "remove_tag") {
      try {
        const extracted =
          toolSelection.primary_query && toolSelection.secondary_query
            ? { tag_name: secondaryQuery, target_name: primaryQuery }
            : await extractTagAssignmentWithAI(ai, latestText, "task");
        if (!extracted?.tag_name || !extracted.target_name) {
          return plainResponse(
            `Necesito que me digas qué etiqueta querés ${taskIntent === "assign_tag" ? "agregar" : "quitar"} y a qué tarea.`,
          );
        }

        const [tasks, tags] = await Promise.all([
          listEntities("task", userJwt),
          listEntities("tag", userJwt),
        ]);
        const taskId = await resolveEntityIdWithAI(
          ai,
          extracted.target_name,
          "task",
          tasks,
        );
        const tagId = await resolveEntityIdWithAI(ai, extracted.tag_name, "tag", tags);

        if (!taskId || !tagId) {
          return plainResponse(
            "No pude identificar con certeza la tarea o la etiqueta indicada.",
          );
        }

        const task = tasks.find((item) => String(item.id) === taskId);
        const tag = tags.find((item) => String(item.id) === tagId);

        if (taskIntent === "assign_tag") {
          await backendFetch(`${ENTITY_API_PATHS.task}/${taskId}/tags`, userJwt, {
            method: "POST",
            body: JSON.stringify({ tag_id: tagId }),
          });
          return plainResponse(
            `🏷️ Agregué la etiqueta **"${getEntityTitle("tag", tag)}"** a la tarea **"${getEntityTitle("task", task)}"**.`,
          );
        }

        await backendFetch(
          `${ENTITY_API_PATHS.task}/${taskId}/tags/${tagId}`,
          userJwt,
          { method: "DELETE" },
        );
        return plainResponse(
          `🧹 Quité la etiqueta **"${getEntityTitle("tag", tag)}"** de la tarea **"${getEntityTitle("task", task)}"**.`,
        );
      } catch (err) {
        console.error("[chat] task_tag_operation failed:", err);
        return plainResponse("⚠️ No pude actualizar las etiquetas de esa tarea.");
      }
    }

    if ((taskIntent === "link" || taskIntent === "unlink") && intent.secondary_entity) {
      try {
        if (intent.secondary_entity === "tag") {
          return plainResponse(
            "Las etiquetas se manejan con acciones de agregar o quitar etiqueta, no como vínculos genéricos.",
          );
        }

        const secondaryEntity = intent.secondary_entity as RelatableEntity;
        const extracted =
          toolSelection.primary_query && toolSelection.secondary_query
            ? { primary_name: primaryQuery, secondary_name: secondaryQuery }
            : await extractLinkDataWithAI(
                ai,
                latestText,
                "task",
                secondaryEntity,
              );
        if (!extracted?.primary_name || !extracted.secondary_name) {
          return plainResponse(
            "Necesito el nombre de la tarea y del elemento que querés vincular o desvincular.",
          );
        }

        const [tasks, secondaryItems] = await Promise.all([
          listEntities("task", userJwt),
          listEntities(secondaryEntity, userJwt),
        ]);
        const taskId = await resolveEntityIdWithAI(
          ai,
          extracted.primary_name,
          "task",
          tasks,
        );
        const secondaryId = await resolveEntityIdWithAI(
          ai,
          extracted.secondary_name,
          secondaryEntity,
          secondaryItems,
        );

        if (!taskId || !secondaryId) {
          return plainResponse(
            "No pude identificar con certeza los elementos que querés conectar.",
          );
        }

        const request = relationRequest("task", taskId, secondaryEntity, secondaryId);
        if (!request) {
          return plainResponse("Esa relación no está soportada por el backend.");
        }

        await backendFetch(request.path, userJwt, {
          method: taskIntent === "link" ? "POST" : "DELETE",
          body: JSON.stringify(request.body),
        });

        const task = tasks.find((item) => String(item.id) === taskId);
        const secondary = secondaryItems.find((item) => String(item.id) === secondaryId);
        return plainResponse(
          `${taskIntent === "link" ? "🔗 Vinculé" : "🔓 Desvinculé"} la tarea **"${getEntityTitle("task", task)}"** ${taskIntent === "link" ? "con" : "de"} la ${ENTITY_LABELS[secondaryEntity]} **"${getEntityTitle(secondaryEntity, secondary)}"**.`,
        );
      } catch (err) {
        console.error("[chat] task_link_operation failed:", err);
        return plainResponse("⚠️ No pude actualizar esa relación.");
      }
    }

    // ── EVENTS ───────────────────────────────────────────────────────────────

    if (eventIntent === "list") {
      try {
        return plainResponse(
          markdownListFromEvents(await listEntities("event", userJwt)),
        );
      } catch (err) {
        console.error("[chat] list_events failed:", err);
        return plainResponse("⚠️ No pude obtener tus eventos. Intentá de nuevo.");
      }
    }

    if (eventIntent === "get") {
      try {
        const events = await listEntities("event", userJwt);
        if (events.length === 0) {
          return plainResponse("No tenés eventos registrados.");
        }

        const eventId = await resolveEntityIdWithAI(ai, primaryQuery, "event", events);
        if (!eventId) {
          return plainResponse(
            `No identifiqué qué evento querés ver. Estos son tus eventos:\n\n${markdownListFromEvents(events)}`,
          );
        }

        const event = await getEntityDetail("event", eventId, userJwt);
        if (!event) {
          return plainResponse("No encontré ese evento.");
        }

        return plainResponse(markdownDetailFromEntity("event", event));
      } catch (err) {
        console.error("[chat] get_event failed:", err);
        return plainResponse("⚠️ No pude obtener el detalle del evento.");
      }
    }

    if (eventIntent === "create") {
      try {
        const eventData = await extractWithAI<ExtractedEventData>(
          ai,
          latestText,
          EXTRACT_EVENT_PROMPT,
        );
        if (!eventData?.title) {
          return plainResponse("¿Cuál es el título del evento que querés crear?");
        }

        const created = await backendFetch<Record<string, unknown>>(
          "/events/",
          userJwt,
          {
            method: "POST",
            body: JSON.stringify({
              title: eventData.title,
              description: eventData.description ?? null,
              start_time: eventData.start_time,
              end_time: eventData.end_time,
              location: eventData.location ?? null,
              is_all_day: eventData.is_all_day ?? false,
              reminders: null,
            }),
          },
        );

        return plainResponse(
          `📅 **Evento creado**\n\n- **Título:** ${String(created.title ?? eventData.title)}\n- **Inicio:** 🕐 ${formatDateTime(created.start_time ?? eventData.start_time)}${created.location ? `\n- **Lugar:** 📍 ${String(created.location)}` : eventData.location ? `\n- **Lugar:** 📍 ${eventData.location}` : ""}`,
        );
      } catch (err) {
        console.error("[chat] create_event failed:", err);
        return plainResponse("⚠️ No pude crear el evento. Intentá de nuevo.");
      }
    }

    if (eventIntent === "update") {
      try {
        const events = await listEntities("event", userJwt);
        if (events.length === 0) {
          return plainResponse("No tenés eventos para actualizar.");
        }

        const eventId = await resolveEntityIdWithAI(ai, primaryQuery, "event", events);
        if (!eventId) {
          return plainResponse(
            `No identifiqué qué evento querés editar. Estos son tus eventos:\n\n${markdownListFromEvents(events)}`,
          );
        }

        const updates = await extractWithAI<ExtractedEventUpdateData>(
          ai,
          latestText,
          UPDATE_EVENT_PROMPT,
        );
        const payload: Record<string, unknown> = {};
        if (updates?.title) payload.title = updates.title;
        if (typeof updates?.description === "string") {
          payload.description = updates.description;
        }
        if (updates?.start_time) payload.start_time = updates.start_time;
        if (updates?.end_time) payload.end_time = updates.end_time;
        if (updates?.location) payload.location = updates.location;
        if (typeof updates?.is_all_day === "boolean") {
          payload.is_all_day = updates.is_all_day;
        }

        if (Object.keys(payload).length === 0) {
          return plainResponse(
            "No encontré cambios concretos para aplicar en ese evento.",
          );
        }

        const updated = await backendFetch<Record<string, unknown>>(
          `/events/${eventId}`,
          userJwt,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        return plainResponse(
          `✏️ Actualicé el evento **"${String(updated.title ?? eventId)}"**.`,
        );
      } catch (err) {
        console.error("[chat] update_event failed:", err);
        return plainResponse("⚠️ No pude actualizar el evento. Intentá de nuevo.");
      }
    }

    if (eventIntent === "delete") {
      try {
        const events = await listEntities("event", userJwt);
        if (events.length === 0) {
          return plainResponse("No tenés eventos para eliminar.");
        }

        const eventId = await resolveEntityIdWithAI(ai, primaryQuery, "event", events);
        if (!eventId) {
          return plainResponse(
            `No identifiqué qué evento querés eliminar. Estos son tus eventos:\n\n${markdownListFromEvents(events)}`,
          );
        }

        const event = events.find((item) => String(item.id) === eventId);
        await backendFetch(`/events/${eventId}`, userJwt, { method: "DELETE" });
        return plainResponse(
          `🗑️ Eliminé el evento **"${getEntityTitle("event", event)}"**.`,
        );
      } catch (err) {
        console.error("[chat] delete_event failed:", err);
        return plainResponse("⚠️ No pude eliminar el evento. Intentá de nuevo.");
      }
    }

    if (eventIntent === "related") {
      try {
        const events = await listEntities("event", userJwt);
        if (events.length === 0) {
          return plainResponse("No tenés eventos registrados.");
        }

        const eventId = await resolveEntityIdWithAI(ai, primaryQuery, "event", events);
        if (!eventId) {
          return plainResponse(
            `No identifiqué qué evento querés inspeccionar. Estos son tus eventos:\n\n${markdownListFromEvents(events)}`,
          );
        }

        const event = events.find((item) => String(item.id) === eventId);
        const related = await getRelatedData("event", eventId, userJwt);
        return plainResponse(
          markdownRelatedData("event", getEntityTitle("event", event), related),
        );
      } catch (err) {
        console.error("[chat] event_related failed:", err);
        return plainResponse("⚠️ No pude obtener las relaciones de ese evento.");
      }
    }

    if (eventIntent === "assign_tag" || eventIntent === "remove_tag") {
      try {
        const extracted =
          toolSelection.primary_query && toolSelection.secondary_query
            ? { tag_name: secondaryQuery, target_name: primaryQuery }
            : await extractTagAssignmentWithAI(ai, latestText, "event");
        if (!extracted?.tag_name || !extracted.target_name) {
          return plainResponse(
            `Necesito que me digas qué etiqueta querés ${eventIntent === "assign_tag" ? "agregar" : "quitar"} y a qué evento.`,
          );
        }

        const [events, tags] = await Promise.all([
          listEntities("event", userJwt),
          listEntities("tag", userJwt),
        ]);
        const eventId = await resolveEntityIdWithAI(
          ai,
          extracted.target_name,
          "event",
          events,
        );
        const tagId = await resolveEntityIdWithAI(ai, extracted.tag_name, "tag", tags);

        if (!eventId || !tagId) {
          return plainResponse(
            "No pude identificar con certeza el evento o la etiqueta indicada.",
          );
        }

        const event = events.find((item) => String(item.id) === eventId);
        const tag = tags.find((item) => String(item.id) === tagId);

        if (eventIntent === "assign_tag") {
          await backendFetch(`${ENTITY_API_PATHS.event}/${eventId}/tags`, userJwt, {
            method: "POST",
            body: JSON.stringify({ tag_id: tagId }),
          });
          return plainResponse(
            `🏷️ Agregué la etiqueta **"${getEntityTitle("tag", tag)}"** al evento **"${getEntityTitle("event", event)}"**.`,
          );
        }

        await backendFetch(
          `${ENTITY_API_PATHS.event}/${eventId}/tags/${tagId}`,
          userJwt,
          { method: "DELETE" },
        );
        return plainResponse(
          `🧹 Quité la etiqueta **"${getEntityTitle("tag", tag)}"** del evento **"${getEntityTitle("event", event)}"**.`,
        );
      } catch (err) {
        console.error("[chat] event_tag_operation failed:", err);
        return plainResponse("⚠️ No pude actualizar las etiquetas de ese evento.");
      }
    }

    if ((eventIntent === "link" || eventIntent === "unlink") && intent.secondary_entity) {
      try {
        if (intent.secondary_entity === "tag") {
          return plainResponse(
            "Las etiquetas se manejan con acciones de agregar o quitar etiqueta.",
          );
        }

        const secondaryEntity = intent.secondary_entity as RelatableEntity;
        const extracted =
          toolSelection.primary_query && toolSelection.secondary_query
            ? { primary_name: primaryQuery, secondary_name: secondaryQuery }
            : await extractLinkDataWithAI(
                ai,
                latestText,
                "event",
                secondaryEntity,
              );
        if (!extracted?.primary_name || !extracted.secondary_name) {
          return plainResponse(
            "Necesito el nombre del evento y del elemento que querés vincular o desvincular.",
          );
        }

        const [events, secondaryItems] = await Promise.all([
          listEntities("event", userJwt),
          listEntities(secondaryEntity, userJwt),
        ]);
        const eventId = await resolveEntityIdWithAI(
          ai,
          extracted.primary_name,
          "event",
          events,
        );
        const secondaryId = await resolveEntityIdWithAI(
          ai,
          extracted.secondary_name,
          secondaryEntity,
          secondaryItems,
        );

        if (!eventId || !secondaryId) {
          return plainResponse(
            "No pude identificar con certeza los elementos que querés conectar.",
          );
        }

        const request = relationRequest("event", eventId, secondaryEntity, secondaryId);
        if (!request) {
          return plainResponse("Esa relación no está soportada por el backend.");
        }

        await backendFetch(request.path, userJwt, {
          method: eventIntent === "link" ? "POST" : "DELETE",
          body: JSON.stringify(request.body),
        });

        const event = events.find((item) => String(item.id) === eventId);
        const secondary = secondaryItems.find((item) => String(item.id) === secondaryId);
        return plainResponse(
          `${eventIntent === "link" ? "🔗 Vinculé" : "🔓 Desvinculé"} el evento **"${getEntityTitle("event", event)}"** ${eventIntent === "link" ? "con" : "de"} la ${ENTITY_LABELS[secondaryEntity]} **"${getEntityTitle(secondaryEntity, secondary)}"**.`,
        );
      } catch (err) {
        console.error("[chat] event_link_operation failed:", err);
        return plainResponse("⚠️ No pude actualizar esa relación.");
      }
    }

    // ── NOTES ────────────────────────────────────────────────────────────────

    if (noteIntent === "list") {
      try {
        return plainResponse(
          markdownListFromNotes(await listEntities("note", userJwt)),
        );
      } catch (err) {
        console.error("[chat] list_notes failed:", err);
        return plainResponse("⚠️ No pude obtener tus notas. Intentá de nuevo.");
      }
    }

    if (noteIntent === "get") {
      try {
        const notes = await listEntities("note", userJwt);
        if (notes.length === 0) {
          return plainResponse("No tenés notas registradas.");
        }

        const noteId = await resolveEntityIdWithAI(ai, primaryQuery, "note", notes);
        if (!noteId) {
          return plainResponse(
            `No identifiqué qué nota querés ver. Estas son tus notas:\n\n${markdownListFromNotes(notes)}`,
          );
        }

        const note = await getEntityDetail("note", noteId, userJwt);
        if (!note) {
          return plainResponse("No encontré esa nota.");
        }

        return plainResponse(markdownDetailFromEntity("note", note));
      } catch (err) {
        console.error("[chat] get_note failed:", err);
        return plainResponse("⚠️ No pude obtener el detalle de la nota.");
      }
    }

    if (noteIntent === "create") {
      try {
        const noteData = await extractWithAI<ExtractedNoteData>(
          ai,
          latestText,
          EXTRACT_NOTE_PROMPT,
        );
        if (!noteData?.title) {
          return plainResponse("¿Cuál es el título de la nota que querés crear?");
        }

        const created = await backendFetch<Record<string, unknown>>(
          "/notes/",
          userJwt,
          {
            method: "POST",
            body: JSON.stringify({
              title: noteData.title,
              content: noteData.content || noteData.title,
            }),
          },
        );

        return plainResponse(
          `📝 **Nota creada**\n\n- **Título:** ${String(created.title ?? noteData.title)}`,
        );
      } catch (err) {
        console.error("[chat] create_note failed:", err);
        return plainResponse("⚠️ No pude crear la nota. Intentá de nuevo.");
      }
    }

    if (noteIntent === "update") {
      try {
        const notes = await listEntities("note", userJwt);
        if (notes.length === 0) {
          return plainResponse("No tenés notas para actualizar.");
        }

        const noteId = await resolveEntityIdWithAI(ai, primaryQuery, "note", notes);
        if (!noteId) {
          return plainResponse(
            `No identifiqué qué nota querés editar. Estas son tus notas:\n\n${markdownListFromNotes(notes)}`,
          );
        }

        const updates = await extractWithAI<ExtractedNoteUpdateData>(
          ai,
          latestText,
          UPDATE_NOTE_PROMPT,
        );
        const payload: Record<string, unknown> = {};
        if (updates?.title) payload.title = updates.title;
        if (updates?.content) payload.content = updates.content;
        if (typeof updates?.is_archived === "boolean") {
          payload.is_archived = updates.is_archived;
        }

        if (Object.keys(payload).length === 0) {
          return plainResponse(
            "No encontré cambios concretos para aplicar en esa nota.",
          );
        }

        const updated = await backendFetch<Record<string, unknown>>(
          `/notes/${noteId}`,
          userJwt,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        return plainResponse(
          `✏️ Actualicé la nota **"${String(updated.title ?? noteId)}"**.`,
        );
      } catch (err) {
        console.error("[chat] update_note failed:", err);
        return plainResponse("⚠️ No pude actualizar la nota. Intentá de nuevo.");
      }
    }

    if (noteIntent === "delete") {
      try {
        const notes = await listEntities("note", userJwt);
        if (notes.length === 0) {
          return plainResponse("No tenés notas para eliminar.");
        }

        const noteId = await resolveEntityIdWithAI(ai, primaryQuery, "note", notes);
        if (!noteId) {
          return plainResponse(
            `No identifiqué qué nota querés eliminar. Estas son tus notas:\n\n${markdownListFromNotes(notes)}`,
          );
        }

        const note = notes.find((item) => String(item.id) === noteId);
        await backendFetch(`/notes/${noteId}`, userJwt, { method: "DELETE" });
        return plainResponse(
          `🗑️ Eliminé la nota **"${getEntityTitle("note", note)}"**.`,
        );
      } catch (err) {
        console.error("[chat] delete_note failed:", err);
        return plainResponse("⚠️ No pude eliminar la nota. Intentá de nuevo.");
      }
    }

    if (noteIntent === "related") {
      try {
        const notes = await listEntities("note", userJwt);
        if (notes.length === 0) {
          return plainResponse("No tenés notas registradas.");
        }

        const noteId = await resolveEntityIdWithAI(ai, primaryQuery, "note", notes);
        if (!noteId) {
          return plainResponse(
            `No identifiqué qué nota querés inspeccionar. Estas son tus notas:\n\n${markdownListFromNotes(notes)}`,
          );
        }

        const note = notes.find((item) => String(item.id) === noteId);
        const related = await getRelatedData("note", noteId, userJwt);
        return plainResponse(
          markdownRelatedData("note", getEntityTitle("note", note), related),
        );
      } catch (err) {
        console.error("[chat] note_related failed:", err);
        return plainResponse("⚠️ No pude obtener las relaciones de esa nota.");
      }
    }

    if (noteIntent === "assign_tag" || noteIntent === "remove_tag") {
      try {
        const extracted =
          toolSelection.primary_query && toolSelection.secondary_query
            ? { tag_name: secondaryQuery, target_name: primaryQuery }
            : await extractTagAssignmentWithAI(ai, latestText, "note");
        if (!extracted?.tag_name || !extracted.target_name) {
          return plainResponse(
            `Necesito que me digas qué etiqueta querés ${noteIntent === "assign_tag" ? "agregar" : "quitar"} y a qué nota.`,
          );
        }

        const [notes, tags] = await Promise.all([
          listEntities("note", userJwt),
          listEntities("tag", userJwt),
        ]);
        const noteId = await resolveEntityIdWithAI(
          ai,
          extracted.target_name,
          "note",
          notes,
        );
        const tagId = await resolveEntityIdWithAI(ai, extracted.tag_name, "tag", tags);

        if (!noteId || !tagId) {
          return plainResponse(
            "No pude identificar con certeza la nota o la etiqueta indicada.",
          );
        }

        const note = notes.find((item) => String(item.id) === noteId);
        const tag = tags.find((item) => String(item.id) === tagId);

        if (noteIntent === "assign_tag") {
          await backendFetch(`${ENTITY_API_PATHS.note}/${noteId}/tags`, userJwt, {
            method: "POST",
            body: JSON.stringify({ tag_id: tagId }),
          });
          return plainResponse(
            `🏷️ Agregué la etiqueta **"${getEntityTitle("tag", tag)}"** a la nota **"${getEntityTitle("note", note)}"**.`,
          );
        }

        await backendFetch(
          `${ENTITY_API_PATHS.note}/${noteId}/tags/${tagId}`,
          userJwt,
          { method: "DELETE" },
        );
        return plainResponse(
          `🧹 Quité la etiqueta **"${getEntityTitle("tag", tag)}"** de la nota **"${getEntityTitle("note", note)}"**.`,
        );
      } catch (err) {
        console.error("[chat] note_tag_operation failed:", err);
        return plainResponse("⚠️ No pude actualizar las etiquetas de esa nota.");
      }
    }

    if ((noteIntent === "link" || noteIntent === "unlink") && intent.secondary_entity) {
      try {
        if (intent.secondary_entity === "tag") {
          return plainResponse(
            "Las etiquetas se manejan con acciones de agregar o quitar etiqueta.",
          );
        }

        const secondaryEntity = intent.secondary_entity as RelatableEntity;
        const extracted =
          toolSelection.primary_query && toolSelection.secondary_query
            ? { primary_name: primaryQuery, secondary_name: secondaryQuery }
            : await extractLinkDataWithAI(
                ai,
                latestText,
                "note",
                secondaryEntity,
              );
        if (!extracted?.primary_name || !extracted.secondary_name) {
          return plainResponse(
            "Necesito el nombre de la nota y del elemento que querés vincular o desvincular.",
          );
        }

        const [notes, secondaryItems] = await Promise.all([
          listEntities("note", userJwt),
          listEntities(secondaryEntity, userJwt),
        ]);
        const noteId = await resolveEntityIdWithAI(
          ai,
          extracted.primary_name,
          "note",
          notes,
        );
        const secondaryId = await resolveEntityIdWithAI(
          ai,
          extracted.secondary_name,
          secondaryEntity,
          secondaryItems,
        );

        if (!noteId || !secondaryId) {
          return plainResponse(
            "No pude identificar con certeza los elementos que querés conectar.",
          );
        }

        const request = relationRequest("note", noteId, secondaryEntity, secondaryId);
        if (!request) {
          return plainResponse("Esa relación no está soportada por el backend.");
        }

        await backendFetch(request.path, userJwt, {
          method: noteIntent === "link" ? "POST" : "DELETE",
          body: JSON.stringify(request.body),
        });

        const note = notes.find((item) => String(item.id) === noteId);
        const secondary = secondaryItems.find((item) => String(item.id) === secondaryId);
        return plainResponse(
          `${noteIntent === "link" ? "🔗 Vinculé" : "🔓 Desvinculé"} la nota **"${getEntityTitle("note", note)}"** ${noteIntent === "link" ? "con" : "de"} la ${ENTITY_LABELS[secondaryEntity]} **"${getEntityTitle(secondaryEntity, secondary)}"**.`,
        );
      } catch (err) {
        console.error("[chat] note_link_operation failed:", err);
        return plainResponse("⚠️ No pude actualizar esa relación.");
      }
    }

    // ── TAGS ─────────────────────────────────────────────────────────────────

    if (tagIntent === "list") {
      try {
        return plainResponse(markdownListFromTags(await listEntities("tag", userJwt)));
      } catch (err) {
        console.error("[chat] list_tags failed:", err);
        return plainResponse("⚠️ No pude obtener tus etiquetas. Intentá de nuevo.");
      }
    }

    if (tagIntent === "get") {
      try {
        const tags = await listEntities("tag", userJwt);
        if (tags.length === 0) {
          return plainResponse("No tenés etiquetas registradas.");
        }

        const tagId = await resolveEntityIdWithAI(ai, primaryQuery, "tag", tags);
        if (!tagId) {
          return plainResponse(
            `No identifiqué qué etiqueta querés ver. Estas son tus etiquetas:\n\n${markdownListFromTags(tags)}`,
          );
        }

        const tag = tags.find((item) => String(item.id) === tagId);
        return plainResponse(markdownDetailFromEntity("tag", tag ?? {}));
      } catch (err) {
        console.error("[chat] get_tag failed:", err);
        return plainResponse("⚠️ No pude obtener el detalle de la etiqueta.");
      }
    }

    if (tagIntent === "create") {
      try {
        const tagData = await extractWithAI<ExtractedTagData>(
          ai,
          latestText,
          EXTRACT_TAG_PROMPT,
        );
        if (!tagData?.name) {
          return plainResponse("¿Qué nombre querés usar para la etiqueta?");
        }

        const created = await backendFetch<Record<string, unknown>>(
          "/tags/",
          userJwt,
          {
            method: "POST",
            body: JSON.stringify({
              name: tagData.name,
              color: tagData.color ?? DEFAULT_TAG_COLOR,
            }),
          },
        );
        return plainResponse(
          `🏷️ **Etiqueta creada**\n\n- **Nombre:** ${String(created.name ?? tagData.name)}\n- **Color:** ${String(created.color ?? tagData.color ?? DEFAULT_TAG_COLOR)}`,
        );
      } catch (err) {
        console.error("[chat] create_tag failed:", err);
        return plainResponse("⚠️ No pude crear la etiqueta. Intentá de nuevo.");
      }
    }

    if (tagIntent === "update") {
      try {
        const tags = await listEntities("tag", userJwt);
        if (tags.length === 0) {
          return plainResponse("No tenés etiquetas para actualizar.");
        }

        const tagId = await resolveEntityIdWithAI(ai, primaryQuery, "tag", tags);
        if (!tagId) {
          return plainResponse(
            `No identifiqué qué etiqueta querés editar. Estas son tus etiquetas:\n\n${markdownListFromTags(tags)}`,
          );
        }

        const updates = await extractWithAI<ExtractedTagUpdateData>(
          ai,
          latestText,
          UPDATE_TAG_PROMPT,
        );
        const payload: Record<string, unknown> = {};
        if (updates?.name) payload.name = updates.name;
        if (updates?.color) payload.color = updates.color;

        if (Object.keys(payload).length === 0) {
          return plainResponse(
            "No encontré cambios concretos para aplicar en esa etiqueta.",
          );
        }

        const updated = await backendFetch<Record<string, unknown>>(
          `/tags/${tagId}`,
          userJwt,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          },
        );
        return plainResponse(
          `✏️ Actualicé la etiqueta **"${String(updated.name ?? tagId)}"**.`,
        );
      } catch (err) {
        console.error("[chat] update_tag failed:", err);
        return plainResponse("⚠️ No pude actualizar la etiqueta. Intentá de nuevo.");
      }
    }

    if (tagIntent === "delete") {
      try {
        const tags = await listEntities("tag", userJwt);
        if (tags.length === 0) {
          return plainResponse("No tenés etiquetas para eliminar.");
        }

        const tagId = await resolveEntityIdWithAI(ai, primaryQuery, "tag", tags);
        if (!tagId) {
          return plainResponse(
            `No identifiqué qué etiqueta querés eliminar. Estas son tus etiquetas:\n\n${markdownListFromTags(tags)}`,
          );
        }

        const tag = tags.find((item) => String(item.id) === tagId);
        await backendFetch(`/tags/${tagId}`, userJwt, { method: "DELETE" });
        return plainResponse(
          `🗑️ Eliminé la etiqueta **"${getEntityTitle("tag", tag)}"**.`,
        );
      } catch (err) {
        console.error("[chat] delete_tag failed:", err);
        return plainResponse("⚠️ No pude eliminar la etiqueta. Intentá de nuevo.");
      }
    }

    // ── Default: Gemini conversacional ───────────────────────────────────────
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

