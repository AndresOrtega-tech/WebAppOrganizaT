import Link from 'next/link';
import { Note } from '@/services/notes.service';
import { FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface RecentNotesProps {
  notes: Note[];
}

export default function RecentNotes({ notes }: RecentNotesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notas recientes</h2>
        <Link href="/notes" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          Ver todas
        </Link>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
            <div className="p-6 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                <p className="text-gray-400 text-xs">No hay notas recientes</p>
            </div>
        ) : (
            notes.map(note => (
            <Link 
                href={`/notes/${note.id}`}
                key={note.id}
                className="block bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-yellow-200 dark:hover:border-yellow-900/30 transition-all duration-200 group"
            >
                <div className="flex items-start gap-3">
                <div className="mt-0.5 p-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform">
                    <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{note.title || 'Sin título'}</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                         <ReactMarkdown 
                            remarkPlugins={[remarkGfm]} 
                            allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li']}
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            components={{ p: ({node: _node, ...props}) => <p className="mb-0" {...props} /> }}
                        >
                            {note.content}
                        </ReactMarkdown>
                    </div>
                    
                    {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {note.tags.slice(0, 2).map(tag => (
                        <span 
                            key={tag.id}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
                            style={{ 
                            color: tag.color,
                            backgroundColor: tag.color + '10',
                            borderColor: tag.color + '30'
                            }}
                        >
                            {tag.name}
                        </span>
                        ))}
                    </div>
                    )}
                </div>
                </div>
            </Link>
            ))
        )}
      </div>
    </div>
  );
}
