import { useState, useEffect } from 'react';
import { Tag, tagsService } from '@/services/tags.service';
import { TaskFilters as FilterParams } from '@/services/task.service';
import { Filter, X, ChevronDown, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import DateTimePicker from './DateTimePicker';

interface TaskFiltersProps {
  onFiltersChange: (filters: FilterParams) => void;
  className?: string;
  initialFilters?: FilterParams;
  isOpen?: boolean;
  onToggle?: () => void;
  hideHeader?: boolean;
}

export default function TaskFilters({ 
  onFiltersChange, 
  className = '', 
  initialFilters = {},
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  hideHeader = false
}: TaskFiltersProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState<FilterParams>(initialFilters);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const loadTags = async () => {
    try {
      const data = await tagsService.getTags();
      setTags(data);
    } catch (error) {
      console.error('Error loading tags for filters:', error);
    }
  };

  useEffect(() => {
    if (isOpen && tags.length === 0) {
      loadTags();
    }
  }, [isOpen]);

  useEffect(() => {
    // Update local state if initialFilters changes (optional, but good for sync)
    setFilters(initialFilters);
  }, [initialFilters]);

  const handleToggleOpen = () => {
    if (controlledOnToggle) {
      controlledOnToggle();
    } else {
      setInternalIsOpen(!internalIsOpen);
    }
  };

  const updateFilters = (newFilters: FilterParams) => {
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleStatusChange = (value: string) => {
    const newFilters = { ...filters };
    if (value === 'all') {
      delete newFilters.is_completed;
    } else {
      newFilters.is_completed = value === 'completed';
    }
    updateFilters(newFilters);
  };


  const toggleTag = (tagId: string) => {
    const currentTags = filters.tag_ids || [];
    let newTags;
    if (currentTags.includes(tagId)) {
      newTags = currentTags.filter(id => id !== tagId);
    } else {
      newTags = [...currentTags, tagId];
    }
    
    const newFilters = { ...filters };
    if (newTags.length > 0) {
      newFilters.tag_ids = newTags;
    } else {
      delete newFilters.tag_ids;
    }
    updateFilters(newFilters);
  };

  const clearFilters = () => {
    updateFilters({});
  };

  const activeFiltersCount = [
    filters.is_completed !== undefined,
    filters.tag_ids && filters.tag_ids.length > 0,
    filters.sort_by !== undefined,
    filters.due_date !== undefined
  ].filter(Boolean).length;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 ${className}`}>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={handleToggleOpen}
            className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros y Orden
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>
          
          {activeFiltersCount > 0 && (
            <button 
              onClick={clearFilters}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      )}

      {isOpen && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Status Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Estado
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.is_completed === undefined
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => handleStatusChange('pending')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.is_completed === false
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.is_completed === true
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Completadas
              </button>
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-sm text-gray-400 dark:text-gray-500 italic">No hay etiquetas disponibles</span>
              ) : (
                tags.map(tag => {
                  const isSelected = filters.tag_ids?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-2 py-1 rounded-md text-xs font-bold border transition-all ${
                        isSelected 
                          ? 'ring-2 ring-offset-1 ring-indigo-500 dark:ring-indigo-400' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        borderColor: tag.color + '40',
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Fecha de Vencimiento
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsDatePickerOpen(true)}
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium border transition-all flex items-center justify-between ${
                  filters.due_date
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{filters.due_date ? new Date(filters.due_date).toLocaleDateString() : 'Seleccionar fecha'}</span>
                <CalendarIcon className="w-4 h-4 opacity-50" />
              </button>
              {filters.due_date && (
                <button
                  onClick={() => {
                    const newFilters = { ...filters };
                    delete newFilters.due_date;
                    setFilters(newFilters);
                  }}
                  className="px-3 py-2 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="mt-3">
               <button
                 onClick={() => setFilters({ ...filters, show_overdue: !filters.show_overdue })}
                 className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                   filters.show_overdue
                     ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                     : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
                 }`}
               >
                 <div className="flex items-center gap-2">
                   <AlertTriangle className={`w-4 h-4 ${filters.show_overdue ? 'fill-amber-500/20' : ''}`} />
                   <span>Mostrar atrasadas</span>
                 </div>
                 <div className={`w-9 h-5 rounded-full transition-colors relative ${filters.show_overdue ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                   <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${filters.show_overdue ? 'translate-x-4' : 'translate-x-0'}`} />
                 </div>
               </button>
            </div>
          </div>

          <DateTimePicker
            isOpen={isDatePickerOpen}
            onClose={() => setIsDatePickerOpen(false)}
            onSave={(date) => {
              // Extract just the date part YYYY-MM-DD using local time
              const dateStr = new Date(date).toLocaleDateString('sv');
              setFilters({ ...filters, due_date: dateStr });
              setIsDatePickerOpen(false);
            }}
            initialDate={filters.due_date}
            includeTime={false}
          />

          {/* Sort Options */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Ordenar por
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium px-3 py-2 rounded-xl border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                >
                  <span className="truncate">
                    {filters.sort_by === 'updated_at' ? 'Última actualización' :
                     filters.sort_by === 'due_date' ? 'Fecha de vencimiento' :
                     'Por defecto'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-1 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => {
                        const newFilters = { ...filters };
                        delete newFilters.sort_by;
                        delete newFilters.order;
                        setFilters(newFilters);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${!filters.sort_by ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Por defecto
                    </button>
                    <button
                      onClick={() => {
                        setFilters({ ...filters, sort_by: 'updated_at', order: filters.order || 'desc' });
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filters.sort_by === 'updated_at' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Última actualización
                    </button>
                    <button
                      onClick={() => {
                        setFilters({ ...filters, sort_by: 'due_date', order: filters.order || 'desc' });
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${filters.sort_by === 'due_date' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      Fecha de vencimiento
                    </button>
                  </div>
                )}
              </div>
              
              <div className={`flex bg-gray-50 rounded-xl p-1 border border-gray-200 transition-opacity ${!filters.sort_by ? 'opacity-50 pointer-events-none' : ''}`}>
                <button
                  onClick={() => setFilters({ ...filters, order: 'asc' })}
                  className={`flex-1 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    filters.order === 'asc' 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Ascendente"
                >
                  Asc
                </button>
                <button
                  onClick={() => setFilters({ ...filters, order: 'desc' })}
                  className={`flex-1 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    filters.order === 'desc' || (!filters.order && filters.sort_by)
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Descendente"
                >
                  Desc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
