import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  CheckSquare,
  StickyNote,
  Calendar,
  CalendarDays,
  Tag as TagIcon,
  LogOut,
  X,
  Trash,
  Bot,
} from "lucide-react";
import { Tag } from "@/services/tags.service";
import { User } from "@/services/auth.service";

import ThemeToggle from "@/components/ThemeToggle";
import { taskService } from "@/services/task.service";
import { notesService } from "@/services/notes.service";
import { eventsService } from "@/services/events.service";
import { tagsService } from "@/services/tags.service";
import ConfirmationModal from "@/components/ConfirmationModal";

interface HomeSidebarProps {
  tags: Tag[];
  user: User | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function HomeSidebar({
  tags,
  user,
  onLogout,
  isOpen,
  onClose,
}: HomeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [localTags, setLocalTags] = useState<Tag[]>(tags);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingTag, setIsDeletingTag] = useState(false);

  useEffect(() => {
    setLocalTags(tags);
  }, [tags]);

  const prefetchRouteAndData = (href: string) => {
    try {
      router.prefetch(href);
      const today = new Date();
      const todayLocal = today.toLocaleDateString("sv");
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const monthStartLocal = monthStart.toLocaleDateString("sv");
      const monthEndLocal = monthEnd.toLocaleDateString("sv");

      if (href === "/home") {
        // Warm home tasks using backend view=home rules
        void taskService.getTasks({
          view: "home",
        });
        void notesService.getNotes();
        void eventsService.getEvents({ start_date: todayLocal });
      } else if (href === "/tasks") {
        void taskService.getTasks({
          view: "tasks",
        });
      } else if (href === "/notes") {
        void notesService.getNotes();
      } else if (href === "/calendar") {
        void taskService.getTasks();
        void eventsService.getEvents({
          start_date: monthStartLocal,
          end_date: monthEndLocal,
        });
      } else if (href === "/events") {
        void eventsService.getEvents({ start_date: todayLocal });
      }
    } catch {
      // best-effort prefetch; ignore errors
    }
  };

  const navItems = [
    { name: "Inicio", href: "/home", icon: Home, enabled: true },
    { name: "Tareas", href: "/tasks", icon: CheckSquare, enabled: true },
    { name: "Notas", href: "/notes", icon: StickyNote, enabled: true },
    { name: "Calendario", href: "/calendar", icon: Calendar, enabled: true },
    { name: "Eventos", href: "/events", icon: CalendarDays, enabled: true },
    { name: "Asistente IA", href: "/chat", icon: Bot, enabled: true },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-30 h-screen
          bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
          flex flex-col overflow-hidden
          ${isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-0 md:translate-x-0"}
        `}
      >
        {/* Logo & Close Button */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold">
              O
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              organizaT
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="px-4 space-y-1">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Menú
          </p>
          {navItems
            .filter((item) => item.enabled)
            .map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  onMouseEnter={() => prefetchRouteAndData(item.href)}
                  onFocus={() => prefetchRouteAndData(item.href)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400"}`}
                  />
                  {item.name}
                </Link>
              );
            })}
        </nav>

        {/* Tags */}
        <div className="px-4 mt-8 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-4 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Etiquetas
            </p>
          </div>
          <div className="space-y-1">
            {localTags.slice(0, 5).map((tag) => (
              <div
                key={tag.id}
                className="group relative flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-default"
              >
                <TagIcon className="w-4 h-4" style={{ color: tag.color }} />
                <span className="truncate">{tag.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setTagToDelete(tag);
                    setIsDeleteModalOpen(true);
                  }}
                  className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500"
                  title="Eliminar etiqueta"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            ))}
            {localTags.length > 5 && (
              <Link
                href="/tasks"
                className="block px-4 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Ver todas ({localTags.length})
              </Link>
            )}
          </div>
        </div>

        {/* Theme Toggle & User */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Tema
            </span>
            <ThemeToggle />
          </div>

          {user && (
            <div className="flex items-center gap-3 px-2">
              <Link
                href="/profile"
                className="flex items-center gap-3 flex-1 min-w-0 p-1.5 -m-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                  {user.avatar
                    ? user.avatar.substring(0, 2).toUpperCase()
                    : user.full_name.charAt(0)}
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {user.full_name}
                </p>
              </Link>
              <button
                onClick={onLogout}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (isDeletingTag) return;
          setIsDeleteModalOpen(false);
          setTagToDelete(null);
        }}
        onConfirm={async () => {
          if (!tagToDelete) return;
          setIsDeletingTag(true);
          try {
            await tagsService.deleteTag(tagToDelete.id);
            setLocalTags(prev => prev.filter(t => t.id !== tagToDelete.id));
            setIsDeleteModalOpen(false);
            setTagToDelete(null);
          } catch (err) {
            console.error('Error deleting tag', err);
            alert('Error al eliminar la etiqueta');
          } finally {
            setIsDeletingTag(false);
          }
        }}
        title="Eliminar etiqueta"
        message={`¿Seguro que deseas eliminar la etiqueta "${tagToDelete?.name ?? ''}"?`}
        confirmText={isDeletingTag ? 'Eliminando...' : 'Eliminar'}
        isLoading={isDeletingTag}
      />
    </>
  );
}
