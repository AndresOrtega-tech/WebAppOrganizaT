import React from 'react';
import Link from 'next/link';
import { StickyNote, CheckSquare, X, CalendarDays } from 'lucide-react';
import { Task } from '@/services/task.service';
import { Note } from '@/services/notes.service';
import { Event } from '@/services/events.service';

type LinkedItem = {
  id: string;
  title: string;
  description?: string | null;
  content?: string;
};

interface LinkedItemsListProps {
  items: (Task | Note | Event | LinkedItem)[];
  type: 'task' | 'note' | 'event';
  onLinkNew: () => void;
  onUnlink: (id: string) => void;
  originType?: 'task' | 'note' | 'event';
  originId?: string;
}

export default function LinkedItemsList({ items, type, onLinkNew, onUnlink, originType, originId }: LinkedItemsListProps) {
  const isTask = type === 'task';
  const isEvent = type === 'event';
  const title = isTask ? 'Tareas Vinculadas' : isEvent ? 'Eventos Vinculados' : 'Notas Vinculadas';
  const Icon = isTask ? CheckSquare : isEvent ? CalendarDays : StickyNote;
  const canAddOrigin = Boolean(originType && originId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </h3>
        <button
          onClick={onLinkNew}
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          + Vincular
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {items.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
            No hay {isTask ? 'tareas' : isEvent ? 'eventos' : 'notas'} vinculadas
          </div>
        ) : (
          items.map((item) => {
            const pathname = isTask ? `/tasks/${item.id}` : isEvent ? `/events/${item.id}` : `/notes/${item.id}`;
            const href = canAddOrigin
              ? { pathname, query: { from: originType, fromId: originId } }
              : pathname;
            return (
            <div key={item.id} className="relative group">
              <Link
                href={href}
                className={`
                  block p-3 rounded-lg shadow-sm transition-transform hover:-translate-y-0.5 pr-10
                  ${isTask 
                    ? 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700' 
                    : isEvent
                      ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800'
                      : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800'
                  }
                `}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${isTask ? 'text-green-500' : isEvent ? 'text-purple-500' : 'text-yellow-500'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {item.title}
                    </p>
                    {'description' in item && item.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    )}
                    {'content' in item && item.content && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                        {item.content}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUnlink(item.id);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/50 dark:bg-black/20 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-black/40 transition-colors opacity-0 group-hover:opacity-100"
                title="Desvincular"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
          })
        )}
      </div>
    </div>
  );
}
