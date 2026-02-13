import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Loader2, MapPin, X } from 'lucide-react';
import DateTimePicker from '@/components/DateTimePicker';
import { CreateEventRequest, Event, eventsService, Reminder, ReminderData } from '@/services/events.service';
import { isFeatureEnabled } from '@/config/features';
import AiReformulateButton from './AiReformulateButton';
import { useAiReformulation } from '@/hooks/useAiReformulation';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventSaved: (event: Event) => void;
  initialData?: Event;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return '';
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

const formatDay = (dateString: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
};

const normalizeAllDayRange = (dateString: string) => {
  const date = new Date(dateString);
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const mapReminders = (startTime: string, remindersData?: ReminderData[]) => {
  if (!startTime || !remindersData || remindersData.length === 0) return null;
  const startMs = new Date(startTime).getTime();
  const mapped: Reminder[] = [];

  remindersData.forEach((r) => {
    const remindMs = new Date(r.remind_at).getTime();
    const diff = startMs - remindMs;
    const tolerance = 60000;

    if (Math.abs(diff - 600000) < tolerance) {
      mapped.push({ value: 10, unit: 'minutes' });
    } else if (Math.abs(diff - 3600000) < tolerance) {
      mapped.push({ value: 1, unit: 'hours' });
    } else if (Math.abs(diff - 86400000) < tolerance) {
      mapped.push({ value: 1, unit: 'days' });
    }
  });

  return mapped.length > 0 ? mapped : null;
};

export default function EventModal({ isOpen, onClose, onEventSaved, initialData }: EventModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    is_all_day: false,
    reminders: null
  });

  const { isReformulating, handleReformulate } = useAiReformulation(
    formData.description || '',
    (newText) => setFormData(prev => ({ ...prev, description: newText })),
    'event'
  );

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          description: initialData.description || '',
          start_time: initialData.start_time,
          end_time: initialData.end_time,
          location: initialData.location || '',
          is_all_day: initialData.is_all_day,
          reminders: mapReminders(initialData.start_time, initialData.reminders_data)
        });
      } else {
        setFormData({
          title: '',
          description: '',
          start_time: '',
          end_time: '',
          location: '',
          is_all_day: false,
          reminders: null
        });
      }
      setError(null);
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEditMode = Boolean(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.is_all_day) {
      if (!formData.start_time) {
        setError('Selecciona el día');
        return;
      }
    } else {
      if (!formData.start_time || !formData.end_time) {
        setError('Selecciona inicio y fin');
        return;
      }
      if (new Date(formData.end_time).getTime() < new Date(formData.start_time).getTime()) {
        setError('La fecha de fin debe ser posterior al inicio');
        return;
      }
    }

    if ((formData.description?.length || 0) > 500) {
      setError('La descripción excede los 500 caracteres. Por favor, reformúlala con IA.');
      return;
    }

    try {
      setLoading(true);

      const payload = formData.is_all_day
        ? (() => {
            const range = normalizeAllDayRange(formData.start_time);
            return {
              ...formData,
              start_time: range.start.toISOString(),
              end_time: range.end.toISOString()
            };
          })()
        : formData;
      const savedEvent = isEditMode && initialData
        ? await eventsService.updateEvent(initialData.id, payload)
        : await eventsService.createEvent(payload);
      onEventSaved(savedEvent);
      onClose();
    } catch (err) {
      console.error('Error saving event:', err);
      setError(`Error al ${isEditMode ? 'actualizar' : 'crear'} el evento`);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = (reminder: Reminder) => {
    const current = formData.reminders || [];
    const exists = current.some(r => r.value === reminder.value && r.unit === reminder.unit);
    const next = exists
      ? current.filter(r => !(r.value === reminder.value && r.unit === reminder.unit))
      : [...current, reminder];
    setFormData({ ...formData, reminders: next.length > 0 ? next : null });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-transparent dark:border-gray-800 transition-colors max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {isEditMode ? 'Editar Evento' : 'Nuevo Evento'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
              Título
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium"
              placeholder="Ej: Reunión con el equipo"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${(formData.description?.length || 0) > 500 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                  {formData.description?.length || 0}/500
                </span>
                <AiReformulateButton
                  onClick={handleReformulate}
                  isLoading={isReformulating}
                  hasText={(formData.description?.length || 0) > 0}
                  featureFlag="ENABLE_EVENT_AI_REFORMULATION"
                />
              </div>
            </div>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 resize-none font-medium"
              placeholder="Agrega detalles del evento"
            />
          </div>

          {formData.is_all_day ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                Día
              </label>
              <button
                type="button"
                onClick={() => setShowStartPicker(true)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium flex items-center justify-between"
              >
                <span className={!formData.start_time ? 'text-gray-400 dark:text-gray-500' : ''}>
                  {formData.start_time ? formatDay(formData.start_time) : 'Seleccionar día'}
                </span>
                <CalendarDays className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Inicio
                </label>
                <button
                  type="button"
                  onClick={() => setShowStartPicker(true)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium flex items-center justify-between"
                >
                  <span className={!formData.start_time ? 'text-gray-400 dark:text-gray-500' : ''}>
                    {formData.start_time ? formatDate(formData.start_time) : 'Seleccionar fecha y hora'}
                  </span>
                  <CalendarDays className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                  Fin
                </label>
                <button
                  type="button"
                  onClick={() => setShowEndPicker(true)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium flex items-center justify-between"
                >
                  <span className={!formData.end_time ? 'text-gray-400 dark:text-gray-500' : ''}>
                    {formData.end_time ? formatDate(formData.end_time) : 'Seleccionar fecha y hora'}
                  </span>
                  <CalendarDays className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </button>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
              Ubicación
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 font-medium"
                placeholder="Ej: Sala principal"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={formData.is_all_day}
              onChange={(e) => {
                const next = e.target.checked;
                const baseDate = formData.start_time || formData.end_time || '';
                setFormData({ 
                  ...formData, 
                  is_all_day: next, 
                  start_time: next ? baseDate : formData.start_time,
                  end_time: next ? baseDate : formData.end_time
                });
                setShowEndPicker(false);
              }}
              className="w-5 h-5 text-purple-600 dark:text-purple-400 rounded focus:ring-purple-500 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
            <span className="font-medium text-gray-700 dark:text-gray-300">Todo el día</span>
          </label>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 ml-1">
              Recordatorios
            </label>
            <div className="flex flex-col gap-2">
              {[
                { value: 10, unit: 'minutes', label: '10 min antes' },
                { value: 1, unit: 'hours', label: '1 hora antes' },
                { value: 1, unit: 'days', label: '1 día antes' }
              ].map((option) => {
                const selected = formData.reminders?.some(
                  r => r.value === option.value && r.unit === option.unit
                );
                return (
                  <button
                    key={`${option.value}-${option.unit}`}
                    type="button"
                    onClick={() => toggleReminder({ value: option.value, unit: option.unit })}
                    className={`flex items-center justify-between px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      selected
                        ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span>{option.label}</span>
                    {selected && <div className="w-2 h-2 rounded-full bg-purple-500"></div>}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 font-medium">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || (formData.description?.length || 0) > 500}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {isEditMode ? 'Guardando...' : 'Creando...'}
              </>
            ) : (
              isEditMode ? 'Guardar Cambios' : 'Crear Evento'
            )}
          </button>
        </form>
      </div>

      <DateTimePicker
        isOpen={showStartPicker}
        onClose={() => setShowStartPicker(false)}
        onSave={(date) => setFormData({ ...formData, start_time: date, end_time: formData.end_time || date })}
        initialDate={formData.start_time || undefined}
      />

      {!formData.is_all_day && (
        <DateTimePicker
          isOpen={showEndPicker}
          onClose={() => setShowEndPicker(false)}
          onSave={(date) => setFormData({ ...formData, end_time: date })}
          initialDate={formData.end_time || undefined}
        />
      )}
    </div>
  );
}
