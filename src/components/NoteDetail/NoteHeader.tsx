import Link from 'next/link';
import { ArrowLeft, Pencil, Tag, Trash2 } from 'lucide-react';
import { isFeatureEnabled } from '@/config/features';
import ThemeToggle from '@/components/ThemeToggle';

interface NoteHeaderProps {
  backHref: string;
  onDelete?: () => void;
  onEdit: () => void;
  onManageTags?: () => void;
}

export default function NoteHeader({ backHref, onDelete, onEdit, onManageTags }: NoteHeaderProps) {
  return (
    <nav className="bg-white dark:bg-gray-900 px-6 py-4 shadow-sm sticky top-0 z-10 border-b border-transparent dark:border-gray-800 transition-colors">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <Link href={backHref} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="ml-4 text-xl font-bold text-gray-900 dark:text-white truncate">Detalle de Nota</h1>
        </div>
        <div className="flex gap-2 items-center">
          <ThemeToggle />
          {/* Future: ENABLE_NOTE_TAGS */}
          {onManageTags && (
            <button
              onClick={onManageTags}
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
              title="Gestionar etiquetas"
            >
              <Tag className="w-5 h-5" />
            </button>
          )}
          
          {isFeatureEnabled('ENABLE_NOTE_DELETION') && onDelete && (
            <button
              onClick={onDelete}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
              title="Eliminar nota"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}

          {isFeatureEnabled('ENABLE_NOTE_EDITING') && (
            <button
              onClick={onEdit}
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
              title="Editar nota"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
