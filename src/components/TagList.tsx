import { Tag as TagIcon, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Tag } from '@/services/task.service';


interface TagListProps {
  tags: Tag[];
  onRemoveTag?: (tagId: string) => void;
  actions?: ReactNode;
}

export default function TagList({ tags, onRemoveTag, actions }: TagListProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TagIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Etiquetas</span>
        {actions && (
          <div className="ml-auto">
            {actions}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold gap-1 group transition-all"
            style={{
              backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
              color: tag.color || '#374151',
              border: `1px solid ${tag.color ? `${tag.color}40` : '#e5e7eb'}`
            }}
          >
            {tag.name}
            {onRemoveTag && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onRemoveTag(tag.id);
                }}
                className="hover:bg-black/10 dark:hover:bg-white/10 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Desvincular etiqueta"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
