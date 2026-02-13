import { Filter, X } from 'lucide-react';

interface TasksFilterBarProps {
  activeFiltersCount: number;
  onOpenFilters: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export default function TasksFilterBar({ 
  activeFiltersCount, 
  onOpenFilters, 
  onClearFilters,
  hasActiveFilters 
}: TasksFilterBarProps) {
  return (
    <div className="flex items-center justify-between bg-[#111827] dark:bg-[#0B1120] p-4 rounded-2xl border border-gray-800 mb-6">
      <button 
        onClick={onOpenFilters}
        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
      >
        <Filter className="w-4 h-4" />
        <span className="font-medium text-sm">Filtros y Orden</span>
        {activeFiltersCount > 0 && (
          <span className="flex items-center justify-center w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {hasActiveFilters && (
        <button 
          onClick={onClearFilters}
          className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
        >
          <X className="w-3 h-3" />
          <span>Limpiar</span>
        </button>
      )}
    </div>
  );
}
