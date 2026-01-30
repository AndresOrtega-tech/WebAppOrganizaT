import { Tag as TagIcon } from 'lucide-react';
import { Tag } from '@/services/task.service';

interface TagListProps {
  tags: Tag[];
}

export default function TagList({ tags }: TagListProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <TagIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-bold text-gray-700">Etiquetas</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span 
            key={tag.id} 
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
            style={{ 
              backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6', 
              color: tag.color || '#374151',
              border: `1px solid ${tag.color ? `${tag.color}40` : '#e5e7eb'}`
            }}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}
