import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Loader2, StickyNote, Archive, RotateCcw } from 'lucide-react';
import { Note, notesService } from '@/services/notes.service';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteSaved: (note: Note) => void;
  initialData?: Note;
}

export default function NoteModal({ isOpen, onClose, onNoteSaved, initialData }: NoteModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          content: initialData.content
        });
      } else {
        setFormData({ title: '', content: '' });
      }
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isEditMode = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      let savedNote: Note;
      if (isEditMode && initialData) {
        savedNote = await notesService.updateNote(token, initialData.id, formData);
      } else {
        savedNote = await notesService.createNote(token, formData);
      }

      onNoteSaved(savedNote);
      onClose();
    } catch (err) {
      console.error('Error saving note:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }
      alert(`Error al ${isEditMode ? 'actualizar' : 'crear'} la nota`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!initialData) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      // Save current changes AND toggle archive status
      const updatedNote = await notesService.updateNote(token, initialData.id, {
        ...formData,
        is_archived: !initialData.is_archived
      });

      onNoteSaved(updatedNote);
      onClose();
    } catch (err) {
      console.error('Error archiving note:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        router.push('/login');
        return;
      }
      alert('Error al actualizar el estado de la nota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <StickyNote className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              {isEditMode ? 'Editar Nota' : 'Nueva Nota'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
              Título
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-gray-800 placeholder:text-gray-400 font-medium"
              placeholder="Ej: Ideas para el proyecto"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
              Contenido
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-gray-800 placeholder:text-gray-400 resize-none font-medium"
              placeholder="Escribe aquí los detalles..."
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            {isEditMode && initialData ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleToggleArchive}
                  disabled={loading}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                    initialData.is_archived
                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={initialData.is_archived ? "Desarchivar nota" : "Archivar nota"}
                >
                  {initialData.is_archived ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Desarchivar</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4" />
                      <span>Archivar</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div></div> /* Spacer for flex-between when no archive button */
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditMode ? 'Guardar Cambios' : 'Crear Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
