import { useState, useEffect } from 'react';
import { X, Loader2, StickyNote, Archive, RotateCcw } from 'lucide-react';
import { Note, notesService } from '@/services/notes.service';
import { useAiReformulation } from '@/hooks/useAiReformulation';
import AiReformulateButton from '@/components/AiReformulateButton';
import { isFeatureEnabled } from '@/config/features';

interface NoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteSaved: (note: Note) => void;
  initialData?: Note;
}

export default function NoteModal({ isOpen, onClose, onNoteSaved, initialData }: NoteModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const { isReformulating, handleReformulate } = useAiReformulation(
    formData.content,
    (newText) => setFormData(prev => ({ ...prev, content: newText })),
    'note'
  );

  if (!isOpen) return null;

  const isEditMode = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (formData.content.length > 800) {
      setError('El contenido excede los 800 caracteres. Por favor, reformúlalo con IA.');
      return;
    }

    try {
      setLoading(true);

      let savedNote: Note;
      if (isEditMode && initialData) {
        savedNote = await notesService.updateNote(initialData.id, formData);
      } else {
        savedNote = await notesService.createNote(formData);
      }

      onNoteSaved(savedNote);
      onClose();
    } catch (err) {
      console.error('Error saving note:', err);
      setError(`Error al ${isEditMode ? 'actualizar' : 'crear'} la nota`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleArchive = async () => {
    if (!initialData) return;
    
    try {
      setLoading(true);

      const updatedNote = await notesService.updateNote(initialData.id, {
        is_archived: !initialData.is_archived
      });

      onNoteSaved(updatedNote);
      onClose();
    } catch (err) {
      console.error('Error archiving note:', err);
      setError('Error al archivar la nota');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <StickyNote className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isEditMode ? 'Editar Nota' : 'Nueva Nota'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
              Título
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium"
              placeholder="Ej: Ideas para el proyecto"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Contenido
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${formData.content.length > 800 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  {formData.content.length}/800
                </span>
                {isFeatureEnabled('ENABLE_NOTE_AI_REFORMULATION') && (
                  <AiReformulateButton
                    onClick={handleReformulate}
                    isLoading={isReformulating}
                    hasText={formData.content.length > 0}
                  />
                )}
              </div>
            </div>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none font-medium"
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
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
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
              disabled={loading || formData.content.length > 800}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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
