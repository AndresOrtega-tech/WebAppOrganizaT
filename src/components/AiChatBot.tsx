"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  isStreaming?: boolean;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "model",
  text: "¡Hola! Soy tu asistente de OrganizaT. ¿En qué te puedo ayudar hoy? 🗂️",
};

interface AiChatBotProps {
  isOpen?: boolean;
  onClose?: () => void;
  fullPage?: boolean;
  className?: string;
}

export default function AiChatBot({
  isOpen = true,
  onClose,
  fullPage = false,
  className = "",
}: AiChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isResponding) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsResponding(true);

    const aiMessageId = crypto.randomUUID();
    const aiPlaceholder: Message = {
      id: aiMessageId,
      role: "model",
      text: "",
      isStreaming: true,
    };
    setMessages((prev) => [...prev, aiPlaceholder]);

    try {
      const history = [...messages, userMessage]
        .filter((m) => m.id !== "welcome")
        .slice(-20)
        .map((m) => ({ role: m.role, text: m.text }));

      abortControllerRef.current = new AbortController();

      const jwt =
        typeof window !== "undefined"
          ? (localStorage.getItem("access_token") ?? "")
          : "";

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(jwt ? { Authorization: `bearer ${jwt}` } : {}),
        },
        body: JSON.stringify({ messages: history }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          aiText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId
                ? { ...m, text: aiText, isStreaming: true }
                : m,
            ),
          );
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId ? { ...m, text: aiText, isStreaming: false } : m,
        ),
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMessageId
            ? {
                ...m,
                text: "Lo siento, ocurrió un error al procesar tu mensaje. Por favor intenta de nuevo.",
                isStreaming: false,
              }
            : m,
        ),
      );
    } finally {
      setIsResponding(false);
      abortControllerRef.current = null;
    }
  }, [input, isResponding, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  const containerClassName = fullPage
    ? `flex h-full min-h-0 flex-col bg-gray-900 text-white ${className}`
    : `fixed inset-0 z-50 flex flex-col bg-gray-900 shadow-2xl shadow-black/50 border-r border-gray-800 ${className}`;

  return (
    <div className={containerClassName}>
      {!fullPage && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div className="relative z-10 flex flex-1 min-h-0 flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-900/50 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">
                Asistente IA
              </p>
              <p className="text-xs text-gray-500 leading-tight">OrganizaT</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "model" && (
                <div className="w-6 h-6 rounded-full bg-indigo-900/60 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Bot className="w-3 h-3 text-indigo-400" />
                </div>
              )}

              <div
                className={`
                  max-w-[75%] px-3 py-2 text-sm leading-relaxed break-words
                  ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm"
                      : "bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm"
                  }
                `}
              >
                {message.role === "user" ? (
                  <span className="whitespace-pre-wrap">{message.text}</span>
                ) : (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-1 last:mb-0">{children}</p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-white">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="italic text-gray-300">{children}</em>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-0.5 my-1 pl-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-0.5 my-1 pl-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-100">{children}</li>
                      ),
                      code: ({ children, className }) => {
                        const isBlock = className?.includes("language-");
                        return isBlock ? (
                          <code className="block bg-gray-900 rounded-lg px-3 py-2 my-1 text-xs font-mono text-indigo-300 overflow-x-auto whitespace-pre">
                            {children}
                          </code>
                        ) : (
                          <code className="bg-gray-900 rounded px-1 py-0.5 text-xs font-mono text-indigo-300">
                            {children}
                          </code>
                        );
                      },
                      pre: ({ children }) => (
                        <pre className="my-1">{children}</pre>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-indigo-500 pl-3 my-1 text-gray-400 italic">
                          {children}
                        </blockquote>
                      ),
                      h1: ({ children }) => (
                        <h1 className="font-bold text-white text-base mb-1">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="font-bold text-white text-sm mb-1">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="font-semibold text-white text-sm mb-0.5">
                          {children}
                        </h3>
                      ),
                      a: ({ href, children }) => (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 underline hover:text-indigo-300"
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                )}

                {message.isStreaming && message.text !== "" && (
                  <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-indigo-400 rounded-sm animate-pulse align-middle" />
                )}

                {message.isStreaming && message.text === "" && (
                  <span className="text-gray-500 text-xs">Pensando...</span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 px-4 py-3 border-t border-gray-800">
          <div className="flex items-end gap-2 bg-gray-800 rounded-2xl px-3 py-2 border border-gray-700 focus-within:border-indigo-500/60 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escríbeme algo..."
              rows={1}
              disabled={isResponding}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 resize-none outline-none max-h-32 leading-relaxed disabled:opacity-50"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={sendMessage}
              disabled={isResponding || !input.trim()}
              className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 mb-0.5"
              aria-label="Enviar mensaje"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-600 mt-2">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      </div>
    </div>
  );
}
