import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json(
                { error: 'Text is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: 'Gemini API key not configured' },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        const LIMIT = 300;

        let attempts = 0;
        const maxAttempts = 3;
        let summaryText = '';

        while (attempts < maxAttempts) {
            const retryInstruction = attempts > 0 ? ` PREVIOUS ATTEMPT WAS TOO LONG. MUST BE UNDER ${LIMIT} CHARACTERS.` : '';

            const prompt = `Haz un resumen conciso de la siguiente nota. Mantenlo en español. Asegúrate de que la respuesta tenga ESTRICTAMENTE menos de ${LIMIT} caracteres.${retryInstruction} Solo devuelve el resumen, nada más:\n\n${text}`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            summaryText = response.text || '';

            if (summaryText.length <= LIMIT) {
                break;
            }

            attempts++;
        }

        if (!summaryText) {
            return NextResponse.json(
                { error: 'Invalid response format from Gemini' },
                { status: 502 }
            );
        }

        // Fallback if still too long
        if (summaryText.length > LIMIT) {
            summaryText = summaryText.substring(0, LIMIT);
        }

        return NextResponse.json({ summary: summaryText });
    } catch (error) {
        console.error('Error in summarize API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
