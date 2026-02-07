import { useState } from 'react';

export function useAiReformulation(
  text: string,
  onReformulated: (newText: string) => void,
  type: 'task' | 'note' = 'task'
) {
  const [isReformulating, setIsReformulating] = useState(false);

  const handleReformulate = async () => {
    if (!text.trim()) return;

    try {
      setIsReformulating(true);
      const response = await fetch('/api/ai/reformulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, type }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Reformulate API error:', JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error || 'Failed to reformulate');
      }

      const data = await response.json();
      if (data.reformulatedText) {
        onReformulated(data.reformulatedText);
      }
    } catch (error) {
      console.error('Error reformulating text:', error);
      alert('Error al reformular el texto');
    } finally {
      setIsReformulating(false);
    }
  };

  return { isReformulating, handleReformulate };
}
