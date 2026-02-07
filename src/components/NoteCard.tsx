import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Tag } from '@/services/tags.service';
import { Note } from '@/services/notes.service';
import { isFeatureEnabled } from '@/config/features';
import { Trash2, Archive, RotateCcw } from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onArchive?: (note: Note) => void;
  onDelete?: (note: Note) => void;
}

export default function NoteCard({ note, onArchive, onDelete }: NoteCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const CardContent = (
    <div className={`bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 transition-all duration-200 flex flex-col h-full ${isFeatureEnabled('ENABLE_NOTE_DETAIL') ? 'hover:shadow-md dark:hover:shadow-gray-700 cursor-pointer group' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className={`text-base font-bold text-gray-900 dark:text-white line-clamp-1 ${isFeatureEnabled('ENABLE_NOTE_DETAIL') ? 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors' : ''}`}>
          {note.title}
        </h4>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium whitespace-nowrap ml-2">
          {formatDate(note.updated_at)}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 flex-grow prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({node, ...props}) => <p className="mb-1" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-inside ml-1" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-inside ml-1" {...props} />,
            li: ({node, ...props}) => <li className="marker:text-gray-400" {...props} />,
            h1: ({node, ...props}) => <strong className="block font-bold" {...props} />,
            h2: ({node, ...props}) => <strong className="block font-bold" {...props} />,
            h3: ({node, ...props}) => <strong className="block font-bold" {...props} />,
            strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
          }}
        >
          {note.content}
        </ReactMarkdown>
      </div>

      {/* Footer: Tags and Actions */}
      <div className="flex items-end justify-between mt-auto pt-4 gap-2">
        <div className="flex flex-wrap gap-2">
          {note.tags && note.tags.map(tag => (
            <span 
              key={tag.id}
              className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
              style={{ 
                borderColor: tag.color + '40',
                color: tag.color,
                backgroundColor: tag.color + '10'
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onArchive && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onArchive(note);
              }}
              className={`p-1.5 rounded-full transition-colors ${
                note.is_archived 
                  ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              title={note.is_archived ? "Desarchivar" : "Archivar"}
            >
              {note.is_archived ? <RotateCcw className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
            </button>
          )}
          
          {onDelete && isFeatureEnabled('ENABLE_NOTE_DELETION') && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(note);
              }}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isFeatureEnabled('ENABLE_NOTE_DETAIL')) {
    return (
      <Link href={`/notes/${note.id}`} className="block h-full">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
}
