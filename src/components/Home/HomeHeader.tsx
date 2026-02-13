import { Search, Plus, Menu } from 'lucide-react';
import { isFeatureEnabled } from '@/config/features';

interface HomeHeaderProps {
  userName: string;
  pendingTasksCount: number;
  onNewItemClick: (type: 'task' | 'note' | 'event') => void;
  onMenuClick: () => void;
  isSidebarOpen: boolean;
  createButtonLabel?: string;
}

export default function HomeHeader({ 
  userName, 
  pendingTasksCount, 
  onNewItemClick, 
  onMenuClick,
  isSidebarOpen,
  createButtonLabel = 'Nuevo'
}: HomeHeaderProps) {
  const firstName = userName.split(' ')[0];

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={isSidebarOpen ? "Ocultar menú" : "Mostrar menú"}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Buenos días, {firstName}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm md:text-base">
            Tienes <span className="font-semibold text-indigo-600 dark:text-indigo-400">{pendingTasksCount} tareas pendientes</span> hoy
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar tareas, notas, eventos..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white"
          />
        </div>
        
        {isFeatureEnabled('ENABLE_TASK_CREATION') && (
          <button 
            onClick={() => onNewItemClick('task')}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{createButtonLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
}
