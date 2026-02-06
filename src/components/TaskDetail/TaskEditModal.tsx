import { useState } from 'react';
import { X, Calendar, Save, Loader2 } from 'lucide-react';
import DateTimePicker from '@/components/DateTimePicker';
import { EditFormState } from '@/hooks/useTaskDetail';
import { useAiReformulation } from '@/hooks/useAiReformulation';
import AiReformulateButton from '@/components/AiReformulateButton';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  editForm: EditFormState;
  setEditForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  isSaving: boolean;
}

export default function TaskEditModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editForm, 
  setEditForm, 
  isSaving 
}: TaskEditModalProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { isReformulating, handleReformulate } = useAiReformulation(
    editForm.description,
    (newText) => setEditForm(prev => ({ ...prev, description: newText }))
  );

  if (!isOpen) return null;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin fecha';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col border border-transparent dark:border-gray-800 transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Editar Tarea</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="edit-form" onSubmit={onSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Título
              </label>
              <input
                id="title"
                type="text"
                required
                value={editForm.title}
                onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Nombre de la tarea"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="description" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${editForm.description.length > 500 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {editForm.description.length}/500
                  </span>
                  <AiReformulateButton
                    onClick={handleReformulate}
                    isLoading={isReformulating}
                    hasText={editForm.description.length > 0}
                  />
                </div>
              </div>
              <textarea
                id="description"
                rows={4}
                maxLength={500}
                value={editForm.description}
                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all resize-none placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Detalles de la tarea..."
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label htmlFor="due_date" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Fecha de vencimiento
              </label>
              <div 
                onClick={() => setShowDatePicker(true)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center justify-between"
              >
                <span className={!editForm.due_date ? 'text-gray-400 dark:text-gray-500' : ''}>
                  {editForm.due_date ? formatDate(editForm.due_date) : 'Seleccionar fecha y hora'}
                </span>
                <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            <DateTimePicker
              isOpen={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              onSave={(date) => setEditForm({...editForm, due_date: date})}
              initialDate={editForm.due_date}
            />

            {/* Toggles */}
            <div className="flex flex-col gap-3 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={editForm.is_completed}
                  onChange={(e) => setEditForm({...editForm, is_completed: e.target.checked})}
                  className="w-5 h-5 text-indigo-600 dark:text-indigo-400 rounded focus:ring-indigo-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
                <span className="font-medium text-gray-700 dark:text-gray-300">Marcar como completada</span>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={editForm.has_reminder}
                  onChange={(e) => setEditForm({...editForm, has_reminder: e.target.checked})}
                  className="w-5 h-5 text-indigo-600 dark:text-indigo-400 rounded focus:ring-indigo-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
                <span className="font-medium text-gray-700 dark:text-gray-300">Activar recordatorio</span>
              </label>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-form"
            disabled={isSaving}
            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-700 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 disabled:opacity-70 flex items-center gap-2 transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
