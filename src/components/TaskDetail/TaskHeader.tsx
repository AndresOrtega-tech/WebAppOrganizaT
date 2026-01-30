import Link from 'next/link';
import { ArrowLeft, Trash, Pencil } from 'lucide-react';
import { isFeatureEnabled } from '@/config/features';

interface TaskHeaderProps {
  onBack: () => void; // Aunque usemos Link, a veces es bueno tener un handler genérico
  onDelete: () => void;
  onEdit: () => void;
}

export default function TaskHeader({ onDelete, onEdit }: TaskHeaderProps) {
  return (
    <nav className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <Link href="/home" className="p-2 -ml-2 text-gray-600 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="ml-4 text-xl font-bold text-gray-900 truncate">Detalle de Tarea</h1>
        </div>
        <div className="flex gap-2">
          {isFeatureEnabled('ENABLE_TASK_DELETION') && (
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Eliminar tarea"
            >
              <Trash className="w-5 h-5" />
            </button>
          )}
          {isFeatureEnabled('ENABLE_TASK_EDITING') && (
            <button
              onClick={onEdit}
              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
              title="Editar tarea"
            >
              <Pencil className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
