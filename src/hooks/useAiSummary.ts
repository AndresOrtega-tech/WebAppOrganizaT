import { useState, useCallback } from 'react';
import { notesService } from '@/services/notes.service';

export function useAiSummary(
    noteId: string,
    text: string,
    onSummaryGenerated: () => void
) {
    const [isSummarizing, setIsSummarizing] = useState(false);

    const handleSummarize = useCallback(async () => {
        if (!text.trim()) {
            alert('La nota está vacía. Añade contenido para poder resumirla.');
            return;
        }

        try {
            setIsSummarizing(true);

            // 1. Generate summary from text
            const response = await fetch('/api/ai/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Summarize API error:', JSON.stringify(errorData, null, 2));
                throw new Error(errorData.error || 'Failed to summarize');
            }

            const data = await response.json();

            if (data.summary) {
                // 2. Save it to the database
                await notesService.updateNoteSummary(noteId, data.summary);

                // 3. Trigger callback (usually reloadNote)
                onSummaryGenerated();
            }
        } catch (error) {
            console.error('Error generalizing summary:', error);
            alert('Error al generar el resumen de la nota');
        } finally {
            setIsSummarizing(false);
        }
    }, [noteId, text, onSummaryGenerated]);

    return { isSummarizing, handleSummarize };
}
