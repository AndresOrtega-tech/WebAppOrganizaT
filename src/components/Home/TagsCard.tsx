import { Plus, Tag as TagIcon } from 'lucide-react';
import { Tag } from '@/services/tags.service';

interface TagsCardProps {
  tags: Tag[];
  onAddTag: () => void;
  isLoading?: boolean;
}

export default function TagsCard({ tags, onAddTag, isLoading = false }: TagsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-gray-900 dark:text-white font-bold text-lg">
          <TagIcon className="w-5 h-5 text-indigo-500" />
          <h2>Etiquetas</h2>
        </div>
        <button 
          onClick={onAddTag}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-indigo-600 dark:text-indigo-400 transition-colors"
          title="Crear etiqueta"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          // Skeletons
          [1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
          ))
        ) : tags.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No hay etiquetas creadas
          </p>
        ) : (
          tags.map((tag) => (
            <div 
              key={tag.id} 
              className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
            >
              <div 
                className="w-3 h-3 rounded-full shadow-sm" 
                style={{ backgroundColor: tag.color }} 
              />
              <span className="text-gray-600 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {tag.name}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
