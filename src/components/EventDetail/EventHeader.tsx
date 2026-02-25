import Link from 'next/link';
import { ArrowLeft, Menu } from 'lucide-react';

interface EventHeaderProps {
    backHref: string;
    onDelete?: () => void;
    onToggleSidebar?: () => void;
}

export default function EventHeader({ backHref, onDelete, onToggleSidebar }: EventHeaderProps) {
    return (
        <header className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                {onToggleSidebar && (
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Abrir menú"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}
                <Link
                    href={backHref}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Volver"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Detalle de Evento
                </span>
            </div>

            <div className="flex gap-2 items-center">
                {onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        className="px-3 py-1.5 rounded-full text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        Eliminar
                    </button>
                )}
            </div>
        </header>
    );
}
