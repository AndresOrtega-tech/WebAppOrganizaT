"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import HomeSidebar from "@/components/Home/HomeSidebar";
import { User } from "@/services/auth.service";
import { Tag, tagsService } from "@/services/tags.service";
import { apiClient } from "@/services/api.client";

export default function ChatPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem("sidebar_open");
    if (stored !== null) return stored === "true";
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsClient(true);
    window.localStorage.setItem("sidebar_open", String(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) return;

    try {
      const parsed = JSON.parse(userData) as User;
      queueMicrotask(() => setUser(parsed));
    } catch (e) {
      console.error("Error parsing user data", e);
    }
  }, []);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const data = await tagsService.getTags();
        setTags(data);
      } catch (error) {
        console.error("Error loading tags:", error);
      }
    };

    loadTags();
  }, []);

  const handleLogout = () => {
    apiClient.logout();
    router.push("/login");
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors" />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors overflow-hidden">
      <div className="flex min-h-screen">
        <HomeSidebar
          tags={tags}
          user={user}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 relative min-h-screen">
          <div className="h-screen flex flex-col">
            <div className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/90 dark:bg-black/90 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  title={isSidebarOpen ? "Ocultar menú" : "Mostrar menú"}
                >
                  {isSidebarOpen ? (
                    <PanelLeftClose className="w-5 h-5" />
                  ) : (
                    <PanelLeftOpen className="w-5 h-5" />
                  )}
                </button>

                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-500" />
                    Asistente IA
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Proximamente
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 p-4 md:p-8">
              <div className="h-full max-w-5xl mx-auto">
                <div className="h-full rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex items-center justify-center">
                  <div className="text-center px-6">
                    <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">
                      Proximamente
                    </h2>
                    <p className="mt-3 text-sm md:text-base text-gray-600 dark:text-gray-400">
                      Estamos preparando el asistente de IA para ti.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
