import { useState } from 'react';
import { Calendar, Clock, Bell } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { Task, TaskPriority } from '@/services/task.service';
import { Event } from '@/services/events.service';
import TagList from '@/components/TagList';
import LinkedItemsList from '@/components/LinkedItemsList';
import type { EditFormState } from '@/hooks/useTaskDetail';
import DateTimePicker from '@/components/DateTimePicker';
import { useAiReformulation } from '@/hooks/useAiReformulation';
import AiReformulateButton from '@/components/AiReformulateButton';

interface TaskInfoProps {
  task: Task;
  editForm: EditFormState;
  setEditForm: Dispatch<SetStateAction<EditFormState>>;
  onRemoveTag?: (tagId: string) => void;
  onManageTags?: () => void;
  onLinkNote: () => void;
  onUnlinkNote: (noteId: string) => void;
  isLinkingEnabled?: boolean;
  linkedEvents?: Event[];
  onLinkEvent?: () => void;
  onUnlinkEvent?: (eventId: string) => void;
  isEventLinkingEnabled?: boolean;
}

export default function TaskInfo({ task, editForm, setEditForm, onRemoveTag, onManageTags, onLinkNote, onUnlinkNote, isLinkingEnabled = true, linkedEvents = [], onLinkEvent, onUnlinkEvent, isEventLinkingEnabled = false }: TaskInfoProps) {
  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState(false);

  const { isReformulating, handleReformulate } = useAiReformulation(
    editForm.description,
    (newText) => setEditForm(prev => ({ ...prev, description: newText })),
    'task'
  );
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

  const formatDateShort = (dateString: string | null) => {
    if (!dateString) return 'Sin fecha';
    const d = new Date(dateString);
    const now = new Date();
    const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) {
      return `Hoy`;
    }
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'media': return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'baja': return 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
  };

  const remindersSummary =
    editForm.reminders && editForm.reminders.length > 0
      ? `${editForm.reminders.length} recordatorio${editForm.reminders.length > 1 ? 's' : ''}`
      : 'Sin recordatorios';

  const toggleCompleted = () => {
    setEditForm(prev => ({
      ...prev,
      is_completed: !prev.is_completed
    }));
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 px-6 py-5 space-y-4">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={toggleCompleted}
                className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${editForm.is_completed ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-transparent'}`}
                aria-label={editForm.is_completed ? 'Marcar como pendiente' : 'Marcar como completada'}
              >
                {editForm.is_completed && <span className="w-2 h-2 rounded-full bg-white" />}
              </button>
              <input
                id="task-title"
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="flex-1 bg-transparent border-none text-2xl font-bold text-gray-900 dark:text-white focus:outline-none"
                placeholder="Sin título"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsDueDateModalOpen(true)}
                className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-full border text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-300 cursor-pointer"
              >
                <Calendar className="w-3 h-3" />
                {formatDateShort(editForm.due_date || null)}
              </button>
              <button
                type="button"
                onClick={() => setIsPriorityModalOpen(true)}
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${getPriorityColor(editForm.priority)} border-transparent cursor-pointer`}
              >
                {editForm.priority}
              </button>
              <button
                type="button"
                onClick={() => setIsRemindersModalOpen(true)}
                className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-full border text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400 cursor-pointer"
              >
                <Bell className="w-3 h-3" />
                {remindersSummary}
              </button>
            </div>

            <TagList
              tags={task.tags}
              onRemoveTag={onRemoveTag}
              actions={onManageTags && (
                <button
                  type="button"
                  onClick={onManageTags}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  + Agregar
                </button>
              )}
            />
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 px-6 py-5 space-y-4">
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-200">Descripción</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    editForm.description.length > 500
                      ? 'text-red-500'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
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
              value={editForm.description}
              onChange={(e) =>
                setEditForm(prev => ({ ...prev, description: e.target.value }))
              }
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              placeholder="Agrega una descripción..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Creada el</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(task.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">Relaciones</h3>
            {isLinkingEnabled && (
              <div className="space-y-6">
                <LinkedItemsList 
                  items={task.notes || []} 
                  type="note" 
                  onLinkNew={onLinkNote}
                  onUnlink={onUnlinkNote}
                  originType="task"
                  originId={task.id}
                />
                {isEventLinkingEnabled && onLinkEvent && onUnlinkEvent && (
                  <LinkedItemsList 
                    items={linkedEvents} 
                    type="event" 
                    onLinkNew={onLinkEvent}
                    onUnlink={onUnlinkEvent}
                    originType="task"
                    originId={task.id}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <DateTimePicker
        isOpen={isDueDateModalOpen}
        onClose={() => setIsDueDateModalOpen(false)}
        onSave={(date) => setEditForm(prev => ({ ...prev, due_date: date }))}
        initialDate={editForm.due_date}
      />

      {isPriorityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm shadow-xl overflow-hidden border border-transparent dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Prioridad</h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Elige la prioridad para esta tarea.
              </p>
              <div className="flex gap-2">
                {(['baja', 'media', 'alta'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setEditForm(prev => ({ ...prev, priority: p }));
                      setIsPriorityModalOpen(false);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all ${
                      editForm.priority === p
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPriorityModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {isRemindersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm shadow-xl overflow-hidden border border-transparent dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Recordatorios</h2>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Selecciona cuándo quieres que te recordemos esta tarea.
              </p>
              <div className="flex flex-col gap-2">
                {[
                  { value: 10, unit: 'minutes', label: '10 min antes' },
                  { value: 1, unit: 'hours', label: '1 hora antes' },
                  { value: 1, unit: 'days', label: '1 día antes' }
                ].map((option) => {
                  const isSelected = editForm.reminders?.some(
                    r => r.value === option.value && r.unit === option.unit
                  );

                  return (
                    <button
                      key={`${option.value}-${option.unit}`}
                      type="button"
                      onClick={() => {
                        let newReminders = [...(editForm.reminders || [])];
                        if (isSelected) {
                          newReminders = newReminders.filter(
                            r => !(r.value === option.value && r.unit === option.unit)
                          );
                        } else {
                          newReminders.push({ value: option.value, unit: option.unit });
                        }
                        setEditForm(prev => ({
                          ...prev,
                          reminders: newReminders.length > 0 ? newReminders : null
                        }));
                      }}
                      className={`flex items-center justify-between px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <span>{option.label}</span>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsRemindersModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
