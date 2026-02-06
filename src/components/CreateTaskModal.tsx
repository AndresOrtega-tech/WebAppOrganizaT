import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Calendar, Loader2 } from 'lucide-react';
import { Task, taskService } from '@/services/task.service';
import DateTimePicker from './DateTimePicker';
import { useAiReformulation } from '@/hooks/useAiReformulation';
import AiReformulateButton from './AiReformulateButton';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
}

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    is_completed: false,
    has_reminder: false
  });

  const { isReformulating, handleReformulate } = useAiReformulation(
    formData.description,
    (newText) => setFormData(prev => ({ ...prev, description: newText }))
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No auth token');
      }

      const newTask = await taskService.createTask(token, {
        ...formData,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      });

      onTaskCreated(newTask);
      onClose();
      // Reset form
      setFormData({
        title: '',
        description: '',
        due_date: '',
        is_completed: false,
        has_reminder: false
      });
    } catch (err) {
      console.error('Error creating task:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }
      alert('Error al crear la tarea');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Seleccionar fecha y hora';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 border border-transparent dark:border-gray-800 transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Nueva Tarea</h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="create-title" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Título
              </label>
              <input
                id="create-title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="¿Qué necesitas hacer?"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="create-description" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${formData.description.length > 500 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {formData.description.length}/500
                  </span>
                  <AiReformulateButton
                    onClick={handleReformulate}
                    isLoading={isReformulating}
                    hasText={formData.description.length > 0}
                  />
                </div>
              </div>
              <textarea
                id="create-description"
                rows={3}
                maxLength={500}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
                placeholder="Detalles adicionales..."
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label htmlFor="create-due-date" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Fecha de vencimiento
              </label>
              <div 
                onClick={() => setShowDatePicker(true)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center justify-between"
              >
                <span className={!formData.due_date ? 'text-gray-400 dark:text-gray-500' : ''}>
                  {formatDate(formData.due_date)}
                </span>
                <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            <DateTimePicker
              isOpen={showDatePicker}
              onClose={() => setShowDatePicker(false)}
              onSave={(date) => setFormData({...formData, due_date: date})}
              initialDate={formData.due_date}
            />

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Tarea'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <DateTimePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSave={(date) => setFormData({...formData, due_date: date})}
        initialDate={formData.due_date}
      />
    </div>
  );
}
