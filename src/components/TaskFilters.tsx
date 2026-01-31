import { useState, useEffect } from 'react';
import { Tag, tagsService } from '@/services/tags.service';
import { TaskFilters as FilterParams } from '@/services/task.service';
import { Filter, X, ArrowUpDown, Calendar, CheckCircle2, ChevronDown } from 'lucide-react';

interface TaskFiltersProps {
  onFiltersChange: (filters: FilterParams) => void;
  className?: string;
}

export default function TaskFilters({ onFiltersChange, className = '' }: TaskFiltersProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState<FilterParams>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    // Debounce filter changes if needed, or apply immediately
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const loadTags = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    try {
      const data = await tagsService.getTags(token);
      setTags(data);
    } catch (error) {
      console.error('Error loading tags for filters:', error);
    }
  };

  const handleStatusChange = (value: string) => {
    const newFilters = { ...filters };
    if (value === 'all') {
      delete newFilters.is_completed;
    } else {
      newFilters.is_completed = value === 'completed';
    }
    setFilters(newFilters);
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
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const activeFiltersCount = [
    filters.is_completed !== undefined,
    filters.tag_ids && filters.tag_ids.length > 0,
    filters.sort_by !== undefined
  ].filter(Boolean).length;

  return (
    <div className={`bg-white rounded-3xl p-4 shadow-sm border border-gray-100 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-indigo-600 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filtros y Orden
          {activeFiltersCount > 0 && (
            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
              {activeFiltersCount}
            </span>
          )}
        </button>
        
        {activeFiltersCount > 0 && (
          <button 
            onClick={clearFilters}
            className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Limpiar
          </button>
        )}
      </div>

      {isOpen && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Status Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Estado
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.is_completed === undefined
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => handleStatusChange('pending')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.is_completed === false
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.is_completed === true
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Completadas
              </button>
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Etiquetas
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-sm text-gray-400 italic">No hay etiquetas disponibles</span>
              ) : (
                tags.map(tag => {
                  const isSelected = filters.tag_ids?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={`px-2 py-1 rounded-md text-xs font-bold border transition-all ${
                        isSelected 
                          ? 'ring-2 ring-offset-1 ring-indigo-500' 
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

          {/* Sort Options */}
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              Ordenar por
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <button
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                >
                  <span className="truncate">
                    {filters.sort_by === 'updated_at' ? 'Última actualización' :
                     filters.sort_by === 'due_date' ? 'Fecha de vencimiento' :
                     'Por defecto'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSortOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
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
