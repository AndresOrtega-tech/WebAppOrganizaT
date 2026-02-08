import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { text, type = 'task' } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_Key;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const NOTE_LIMIT = 800;
    const TASK_LIMIT = 500;
    const limit = type === 'note' ? NOTE_LIMIT : TASK_LIMIT;

    let attempts = 0;
    const maxAttempts = 3;
    let reformulatedText = '';

    while (attempts < maxAttempts) {
      let prompt = '';
      const retryInstruction = attempts > 0 ? ` PREVIOUS ATTEMPT WAS TOO LONG. MUST BE UNDER ${limit} CHARACTERS.` : '';
      
      if (type === 'note') {
        prompt = `Reformulate the following note content to be more explanatory and detailed. Expand on key points if necessary to improve clarity. Keep the language in Spanish. Ensure the response is STRICTLY under ${limit} characters.${retryInstruction} Just provide the reformulated text, nothing else:\n\n${text}`;
      } else {
        prompt = `Reformulate the following task description to be more clear, concise, and explanatory. Keep the language in Spanish. Reduce character count if possible while maintaining meaning. Ensure the response is STRICTLY under ${limit} characters.${retryInstruction} Just provide the reformulated text, nothing else:\n\n${text}`;
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      reformulatedText = response.text || '';
      
      if (reformulatedText.length <= limit) {
        break;
      }
      
      attempts++;
    }

    if (!reformulatedText) {
      return NextResponse.json(
        { error: 'Invalid response format from Gemini' },
        { status: 502 }
      );
    }
    
    // If after max attempts it's still too long, truncate it (fallback)
    if (reformulatedText.length > limit) {
      reformulatedText = reformulatedText.substring(0, limit);
    }

    return NextResponse.json({ reformulatedText });
  } catch (error) {
    console.error('Error in reformulate API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
