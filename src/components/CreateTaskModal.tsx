import { useState } from 'react';
import { X, Calendar, Loader2 } from 'lucide-react';
import { Task, taskService } from '@/services/task.service';
import DateTimePicker from './DateTimePicker';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
}

export default function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    is_completed: false,
    has_reminder: false
  });

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
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Nueva Tarea</h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="create-title" className="block text-sm font-bold text-gray-700">
                Título
              </label>
              <input
                id="create-title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="¿Qué necesitas hacer?"
                autoFocus
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="create-description" className="block text-sm font-bold text-gray-700">
                Descripción
              </label>
              <textarea
                id="create-description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                placeholder="Detalles adicionales..."
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label htmlFor="create-due-date" className="block text-sm font-bold text-gray-700">
                Fecha de vencimiento
              </label>
              <div 
                onClick={() => setShowDatePicker(true)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 cursor-pointer hover:bg-gray-100 transition-all flex items-center justify-between"
              >
                <span className={!formData.due_date ? 'text-gray-400' : ''}>
                  {formatDate(formData.due_date)}
                </span>
                <Calendar className="w-5 h-5 text-gray-400" />
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
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
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
