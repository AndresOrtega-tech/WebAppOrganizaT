import { Calendar, Clock } from 'lucide-react';
import { Note } from '@/services/notes.service';
import TagList from '@/components/TagList';

interface NoteInfoProps {
  note: Note;
  onRemoveTag?: (tagId: string) => void;
}

export default function NoteInfo({ note, onRemoveTag }: NoteInfoProps) {
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
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        <div className="p-6 space-y-8">
          {/* Title & Content */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{note.title}</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {note.content}
            </p>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Created At */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Creada el</p>
                <p className="text-sm text-gray-500 mt-0.5">{formatDate(note.created_at)}</p>
              </div>
            </div>

            {/* Updated At */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-gray-100 rounded-xl text-gray-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Actualizada el</p>
                <p className="text-sm text-gray-500 mt-0.5">{formatDate(note.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <TagList tags={note.tags} onRemoveTag={onRemoveTag} />
          )}
        </div>
      </div>
    </main>
  );
}
