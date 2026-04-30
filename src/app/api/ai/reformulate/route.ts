import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const dynamic = "force-dynamic";
export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { text, type = "task" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const NOTE_LIMIT = 800;
    const TASK_LIMIT = 500;
    const EVENT_LIMIT = 500;

    let limit = TASK_LIMIT;
    if (type === "note") limit = NOTE_LIMIT;
    else if (type === "event") limit = EVENT_LIMIT;

    let prompt = "";

    if (type === "note") {
      prompt = `Reformulate the following note content to be more explanatory and detailed. Expand on key points if necessary to improve clarity. Keep the language in Spanish. Ensure the response is STRICTLY under ${limit} characters. Just provide the reformulated text, nothing else:\n\n${text}`;
    } else if (type === "event") {
      prompt = `Reformulate the following event description to be clear, concise, and informative. Keep the language in Spanish. Ensure the response is STRICTLY under ${limit} characters. Just provide the reformulated text, nothing else:\n\n${text}`;
    } else {
      prompt = `Reformulate the following task description to be more clear, concise, and explanatory. Keep the language in Spanish. Reduce character count if possible while maintaining meaning. Ensure the response is STRICTLY under ${limit} characters. Just provide the reformulated text, nothing else:\n\n${text}`;
    }

    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
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

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Error in reformulate API:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
