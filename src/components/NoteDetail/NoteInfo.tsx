import { Calendar, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Note } from '@/services/notes.service';
import TagList from '@/components/TagList';
import LinkedItemsList from '@/components/LinkedItemsList';

interface NoteInfoProps {
  note: Note;
  onRemoveTag?: (tagId: string) => void;
  onLinkTask: () => void;
}

export default function NoteInfo({ note, onRemoveTag, onLinkTask }: NoteInfoProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        <div className="p-6 space-y-8">
          {/* Title & Content */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{note.title}</h2>
            <div className="prose prose-indigo dark:prose-invert prose-lg max-w-none text-gray-600 dark:text-gray-300">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  ul: ({node, ...props}) => <ul className="list-disc list-outside ml-6 mb-4 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                  p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                }}
              >
                {note.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Created At */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Creada el</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(note.created_at)}</p>
              </div>
            </div>

            {/* Updated At */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Actualizada el</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(note.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <TagList tags={note.tags} onRemoveTag={onRemoveTag} />
          )}

          {/* Linked Tasks */}
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
            <LinkedItemsList 
              items={note.tasks || []} 
              type="task" 
              onLinkNew={onLinkTask} 
            />
          </div>
        </div>
      </div>
    </main>
  );
}
