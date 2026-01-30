'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Task, taskService } from '@/services/task.service';
import { ArrowLeft, Calendar, Clock, Pencil, X, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import DateTimePicker from '@/components/DateTimePicker';
import StatusBadge from '@/components/StatusBadge';
import TagList from '@/components/TagList';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    due_date: '',
    is_completed: false,
    has_reminder: false
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (id) {
      loadTask(token, id);
    }
  }, [id, router]);

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date ? getLocalDateTimeForInput(task.due_date) : '',
        is_completed: task.is_completed,
        has_reminder: task.has_reminder
      });
    }
  }, [task]);

  const getLocalDateTimeForInput = (isoString: string) => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  const loadTask = async (token: string, taskId: string) => {
    try {
      setLoading(true);
      const data = await taskService.getTaskById(token, taskId);
      setTask(data);
    } catch (err) {
      console.error('Error loading task:', err);
      setError('No se pudo cargar la tarea.');
      if (err instanceof Error && err.message === 'Unauthorized') {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    
    try {
      setIsSaving(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
          router.push('/login');
          return;
      }

      const updatedTask = await taskService.updateTask(token, task.id, {
          ...editForm,
          due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null
      });
      
      setTask(updatedTask);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Error al actualizar la tarea');
    } finally {
      setIsSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-indigo-600 font-medium animate-pulse">Cargando detalles...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
        <div className="text-red-500 font-medium mb-4">{error || 'Tarea no encontrada'}</div>
        <Link 
          href="/home" 
          className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <nav className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <Link href="/home" className="p-2 -ml-2 text-gray-600 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="ml-4 text-xl font-bold text-gray-900 truncate">Detalle de Tarea</h1>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="Editar tarea"
          >
            <Pencil className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Status Banner */}
          <StatusBadge isCompleted={task.is_completed} />

          <div className="p-6 space-y-8">
            {/* Title & Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {task.description || 'Sin descripción'}
              </p>
            </div>

            {/* Meta Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Due Date */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Fecha de vencimiento</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatDate(task.due_date)}</p>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gray-100 rounded-xl text-gray-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Creada el</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatDate(task.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <TagList tags={task.tags} />
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Editar Tarea</h2>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="edit-form" onSubmit={handleUpdate} className="space-y-5">
                {/* Title */}
                <div className="space-y-1.5">
                  <label htmlFor="title" className="block text-sm font-bold text-gray-700">
                    Título
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Nombre de la tarea"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-bold text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                    placeholder="Detalles de la tarea..."
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label htmlFor="due_date" className="block text-sm font-bold text-gray-700">
                    Fecha de vencimiento
                  </label>
                  <div 
                    onClick={() => setShowDatePicker(true)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 cursor-pointer hover:bg-gray-100 transition-all flex items-center justify-between"
                  >
                    <span className={!editForm.due_date ? 'text-gray-400' : ''}>
                      {editForm.due_date ? formatDate(editForm.due_date) : 'Seleccionar fecha y hora'}
                    </span>
                    <Calendar className="w-5 h-5 text-gray-400" />
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
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={editForm.is_completed}
                      onChange={(e) => setEditForm({...editForm, is_completed: e.target.checked})}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="font-medium text-gray-700">Marcar como completada</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={editForm.has_reminder}
                      onChange={(e) => setEditForm({...editForm, has_reminder: e.target.checked})}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="font-medium text-gray-700">Activar recordatorio</span>
                  </label>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="edit-form"
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 flex items-center gap-2 transition-all"
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
      )}
    </div>
  );
}
