import { useState } from "react";

export function useAiReformulation(
  text: string,
  onReformulated: (newText: string) => void,
  type: "task" | "note" | "event" = "task",
) {
  const [isReformulating, setIsReformulating] = useState(false);

  const handleReformulate = async () => {
    if (!text.trim()) return;

    try {
      setIsReformulating(true);
      const response = await fetch("/api/ai/reformulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, type }),
      });

      if (!response.ok) {
        throw new Error("Failed to reformulate");
      }

      if (!response.body) throw new Error("No response body for stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        if (chunk) {
          fullText += chunk;
          onReformulated(fullText);
        }
      }
    } catch (error) {
      console.error("Error reformulating text:", error);
      alert("Error al reformular el texto");
    } finally {
      setIsReformulating(false);
    }
  };

  return { isReformulating, handleReformulate };
}
