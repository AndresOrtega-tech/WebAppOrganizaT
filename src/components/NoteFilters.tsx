import { useState, useEffect } from 'react';
import { Tag, tagsService } from '@/services/tags.service';
import { NoteFilters as FilterParams } from '@/services/notes.service';
import { Filter, X, ChevronDown } from 'lucide-react';

interface NoteFiltersProps {
  onFiltersChange: (filters: FilterParams) => void;
  className?: string;
}

export default function NoteFilters({ onFiltersChange, className = '' }: NoteFiltersProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [filters, setFilters] = useState<FilterParams>({});
  const [isOpen, setIsOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const loadTags = async () => {
    try {
      const data = await tagsService.getTags();
      setTags(data);
    } catch (error) {
      console.error('Error loading tags for filters:', error);
    }
  };

  const handleStatusChange = (value: string) => {
    const newFilters = { ...filters };
    if (value === 'all') {
      delete newFilters.is_archived;
    } else {
      newFilters.is_archived = value === 'archived';
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

  const handleSortChange = (sortBy: 'updated_at' | 'created_at', order: 'asc' | 'desc') => {
    setFilters({
      ...filters,
      sort_by: sortBy,
      order: order
    });
    setIsSortOpen(false);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const activeFiltersCount = [
    filters.is_archived !== undefined,
    filters.tag_ids && filters.tag_ids.length > 0,
    filters.sort_by !== undefined
  ].filter(Boolean).length;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => setIsOpen(!isOpen)}
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
                  filters.is_archived === undefined
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => handleStatusChange('active')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.is_archived === false
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Activas
              </button>
              <button
                onClick={() => handleStatusChange('archived')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filters.is_archived === true
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Archivadas
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

          {/* Sort Options */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Ordenar por
            </label>
            <div className="relative">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium px-3 py-2 rounded-xl border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              >
                <span className="truncate">
                  {filters.sort_by === 'updated_at' ? 'Última actualización' :
                   filters.sort_by === 'created_at' ? 'Fecha de creación' :
                   'Por defecto'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-1 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => handleSortChange('updated_at', 'desc')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      filters.sort_by === 'updated_at' && filters.order === 'desc' ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-700'
                    }`}
                  >
                    Última actualización (Reciente primero)
                  </button>
                  <button
                    onClick={() => handleSortChange('updated_at', 'asc')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      filters.sort_by === 'updated_at' && filters.order === 'asc' ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-700'
                    }`}
                  >
                    Última actualización (Antiguo primero)
                  </button>
                  <button
                    onClick={() => handleSortChange('created_at', 'desc')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      filters.sort_by === 'created_at' && filters.order === 'desc' ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-700'
                    }`}
                  >
                    Fecha de creación (Reciente primero)
                  </button>
                  <button
                    onClick={() => handleSortChange('created_at', 'asc')}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      filters.sort_by === 'created_at' && filters.order === 'asc' ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-700'
                    }`}
                  >
                    Fecha de creación (Antiguo primero)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
