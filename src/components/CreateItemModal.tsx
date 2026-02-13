import { useState, useEffect } from 'react';
import { 
  X, CheckSquare, StickyNote, Calendar, Tag as TagIcon, 
  Plus, Loader2, Link as LinkIcon, Check, Bell 
} from 'lucide-react';
import { isFeatureEnabled } from '@/config/features';
import { taskService, CreateTaskDTO, TaskPriority } from '@/services/task.service';
import { notesService, CreateNoteRequest } from '@/services/notes.service';
import { eventsService, CreateEventRequest } from '@/services/events.service';
import { Tag, tagsService, CreateTagRequest } from '@/services/tags.service';
import DateTimePicker from './DateTimePicker';
import AiReformulateButton from './AiReformulateButton';
import { useAiReformulation } from '@/hooks/useAiReformulation';

type TabType = 'task' | 'note' | 'event' | 'tag';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialTab?: TabType;
  disableTabs?: boolean;
}

const COLORS = [
  '#EF4444', // red-500
  '#F97316', // orange-500
  '#EAB308', // yellow-500
  '#22C55E', // green-500
  '#06B6D4', // cyan-500
  '#3B82F6', // blue-500
  '#6366F1', // indigo-500
  '#A855F7', // purple-500
  '#EC4899', // pink-500
  '#64748B', // slate-500
];

export default function CreateItemModal({  
  isOpen, 
  onClose, 
  onCreated, 
  initialTab = 'task',
  disableTabs = false
}: CreateItemModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tags State
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  // Forms State
  const [taskForm, setTaskForm] = useState<CreateTaskDTO>({
    title: '',
    description: '',
    due_date: null,
    is_completed: false,
    priority: 'media',
    reminders: null
  });

  const [noteForm, setNoteForm] = useState<CreateNoteRequest>({
    title: '',
    content: ''
  });

  const [eventForm, setEventForm] = useState<CreateEventRequest>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    is_all_day: false,
    reminders: null
  });

  const [tagForm, setTagForm] = useState<CreateTagRequest>({
    name: '',
    color: '#6366f1' // Default indigo
  });

  // UI Helpers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEventStartPicker, setShowEventStartPicker] = useState(false);
  const [showEventEndPicker, setShowEventEndPicker] = useState(false);

  // Reminders State Helper
  const [reminderValue, setReminderValue] = useState(10);
  const [reminderUnit, setReminderUnit] = useState('minutes');

  // Search & Linking State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string, title: string, type: 'task' | 'note' | 'event' }>>([]);
  const [linkedItems, setLinkedItems] = useState<Array<{ id: string, title: string, type: 'task' | 'note' | 'event' }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load tags on open
  useEffect(() => {
    if (isOpen) {
      loadTags();
      setActiveTab(initialTab);
      resetForms();
      setLinkedItems([]);
      setSearchQuery('');
    }
  }, [isOpen, initialTab]);

  // Search Effect
  useEffect(() => {
    const searchItems = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        let results: Array<{ id: string, title: string, type: 'task' | 'note' | 'event' }> = [];

        if (activeTab === 'task') {
          // Search Notes & Events
          if (isFeatureEnabled('ENABLE_NOTES_VIEW')) {
             const notes = await notesService.getNotes();
             const matchedNotes = notes
               .filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
               .map(n => ({ id: n.id, title: n.title, type: 'note' as const }));
             results = [...results, ...matchedNotes];
          }
          if (isFeatureEnabled('ENABLE_EVENTS_VIEW')) {
             const events = await eventsService.getEvents();
             const matchedEvents = events
               .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
               .map(e => ({ id: e.id, title: e.title, type: 'event' as const }));
             results = [...results, ...matchedEvents];
          }
        } else if (activeTab === 'note') {
           // Search Tasks & Events
           const tasks = await taskService.getTasks();
           const matchedTasks = tasks
             .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
             .map(t => ({ id: t.id, title: t.title, type: 'task' as const }));
           results = [...results, ...matchedTasks];

           if (isFeatureEnabled('ENABLE_EVENTS_VIEW')) {
             const events = await eventsService.getEvents();
             const matchedEvents = events
               .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
               .map(e => ({ id: e.id, title: e.title, type: 'event' as const }));
             results = [...results, ...matchedEvents];
           }
        } else if (activeTab === 'event') {
           // Search Tasks & Notes
           const tasks = await taskService.getTasks();
           const matchedTasks = tasks
             .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
             .map(t => ({ id: t.id, title: t.title, type: 'task' as const }));
           results = [...results, ...matchedTasks];

           if (isFeatureEnabled('ENABLE_NOTES_VIEW')) {
             const notes = await notesService.getNotes();
             const matchedNotes = notes
               .filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
               .map(n => ({ id: n.id, title: n.title, type: 'note' as const }));
             results = [...results, ...matchedNotes];
           }
        }

        // Filter out already linked items
        results = results.filter(r => !linkedItems.some(li => li.id === r.id));
        setSearchResults(results.slice(0, 5));
      } catch (error) {
        console.error('Error searching items:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchItems, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, activeTab, linkedItems]);

  const handleLinkItem = (item: { id: string, title: string, type: 'task' | 'note' | 'event' }) => {
    setLinkedItems([...linkedItems, item]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeLinkedItem = (itemId: string) => {
    setLinkedItems(linkedItems.filter(i => i.id !== itemId));
  };

  const addReminder = (type: 'task' | 'event') => {
    const newReminder = { value: reminderValue, unit: reminderUnit };
    if (type === 'task') {
      const currentReminders = taskForm.reminders || [];
      setTaskForm({ ...taskForm, reminders: [...currentReminders, newReminder] });
    } else {
      const currentReminders = eventForm.reminders || [];
      setEventForm({ ...eventForm, reminders: [...currentReminders, newReminder] });
    }
  };

  const removeReminder = (type: 'task' | 'event', index: number) => {
    if (type === 'task') {
      const currentReminders = taskForm.reminders || [];
      setTaskForm({ ...taskForm, reminders: currentReminders.filter((_, i) => i !== index) });
    } else {
      const currentReminders = eventForm.reminders || [];
      setEventForm({ ...eventForm, reminders: currentReminders.filter((_, i) => i !== index) });
    }
  };

  const loadTags = async () => {
    try {
      const tags = await tagsService.getTags();
      setAvailableTags(tags);
    } catch (e) {
      console.error('Error loading tags', e);
    }
  };

  const resetForms = () => {
    setTaskForm({
      title: '',
      description: '',
      due_date: null,
      is_completed: false,
      priority: 'media',
      reminders: null
    });
    setNoteForm({ title: '', content: '' });
    setEventForm({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      is_all_day: false,
      reminders: null
    });
    setTagForm({ name: '', color: '#6366f1' });
    setSelectedTagIds([]);
    setError(null);
  };

  // AI Reformulation Hooks
  const { isReformulating: isTaskReformulating, handleReformulate: handleTaskReformulate } = useAiReformulation(
    taskForm.description || '',
    (text) => setTaskForm(prev => ({ ...prev, description: text })),
    'task'
  );

  const { isReformulating: isNoteReformulating, handleReformulate: handleNoteReformulate } = useAiReformulation(
    noteForm.content,
    (text) => setNoteForm(prev => ({ ...prev, content: text })),
    'note'
  );

  const { isReformulating: isEventReformulating, handleReformulate: handleEventReformulate } = useAiReformulation(
    eventForm.description || '',
    (text) => setEventForm(prev => ({ ...prev, description: text })),
    'event'
  );

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'task') {
        const newTask = await taskService.createTask(taskForm);
        // Link tags
        if (selectedTagIds.length > 0) {
          await taskService.assignTagsToTask(newTask.id, selectedTagIds);
        }
        // Link Items
        for (const item of linkedItems) {
          if (item.type === 'note') {
            await taskService.linkNoteToTask(newTask.id, item.id);
          } else if (item.type === 'event') {
            await eventsService.linkTaskToEvent(item.id, newTask.id);
          }
        }
      } else if (activeTab === 'note') {
        const newNote = await notesService.createNote(noteForm);
        // Link tags
        if (selectedTagIds.length > 0) {
          await notesService.assignTagsToNote(newNote.id, selectedTagIds);
        }
        // Link Items
        for (const item of linkedItems) {
          if (item.type === 'task') {
            await taskService.linkNoteToTask(item.id, newNote.id);
          } else if (item.type === 'event') {
            await eventsService.linkNoteToEvent(item.id, newNote.id);
          }
        }
      } else if (activeTab === 'event') {
        const newEvent = await eventsService.createEvent(eventForm);
        // Events don't support tags in this version
        // Link Items
        for (const item of linkedItems) {
          if (item.type === 'task') {
            await eventsService.linkTaskToEvent(newEvent.id, item.id);
          } else if (item.type === 'note') {
            await eventsService.linkNoteToEvent(newEvent.id, item.id);
          }
        }
      } else if (activeTab === 'tag') {
        if (!tagForm.name.trim()) {
          throw new Error('El nombre de la etiqueta es requerido');
        }
        if (!/^#([0-9A-F]{3}){1,2}$/i.test(tagForm.color)) {
          throw new Error('El color debe ser un código hexadecimal válido (ej. #FF0000)');
        }
        await tagsService.createTag(tagForm);
      }

      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al crear el elemento.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {activeTab === 'task' && 'Crear nueva tarea'}
            {activeTab === 'note' && 'Crear nueva nota'}
            {activeTab === 'event' && 'Crear nuevo evento'}
            {activeTab === 'tag' && 'Crear nueva etiqueta'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {!disableTabs && (
          <div className="flex border-b border-gray-100 dark:border-gray-800 overflow-x-auto scrollbar-hide">
            {[
              { id: 'task', label: 'Tarea', icon: CheckSquare, color: 'text-green-500' },
              { id: 'note', label: 'Nota', icon: StickyNote, color: 'text-yellow-500' },
              { id: 'event', label: 'Evento', icon: Calendar, color: 'text-pink-500' },
              { id: 'tag', label: 'Etiqueta', icon: TagIcon, color: 'text-indigo-500' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id 
                    ? `border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10` 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? '' : tab.color}`} />
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
             <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
               {error}
             </div>
          )}

          {/* TASK FORM */}
          {activeTab === 'task' && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                  <input 
                    type="text" 
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="Ej. Preparar presentación..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha límite</label>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(true)}
                      className="w-full px-4 py-2.5 text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="truncate">
                        {taskForm.due_date 
                          ? new Date(taskForm.due_date).toLocaleDateString() 
                          : 'Sin fecha'}
                      </span>
                    </button>
                    {showDatePicker && (
                      <DateTimePicker 
                        isOpen={true}
                        initialDate={taskForm.due_date}
                        onSave={(dateStr) => {
                          setTaskForm({ ...taskForm, due_date: dateStr });
                          setShowDatePicker(false);
                        }}
                        onClose={() => setShowDatePicker(false)}
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </div>
                </div>

                {/* Reminders Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recordatorios</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="number"
                      min="1"
                      value={reminderValue}
                      onChange={(e) => setReminderValue(parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                    <select
                      value={reminderUnit}
                      onChange={(e) => setReminderUnit(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="minutes">Minutos antes</option>
                      <option value="hours">Horas antes</option>
                      <option value="days">Días antes</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => addReminder('task')}
                      className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* List of reminders */}
                  {taskForm.reminders && taskForm.reminders.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {taskForm.reminders.map((reminder, idx) => (
                        <span key={idx} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                          <Bell className="w-3 h-3" />
                          {reminder.value} {
                            reminder.unit === 'minutes' ? 'min' : 
                            reminder.unit === 'hours' ? 'hrs' : 'días'
                          }
                          <button 
                            onClick={() => removeReminder('task', idx)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                    {isFeatureEnabled('ENABLE_AI_REFORMULATION') && (
                      <AiReformulateButton 
                        onClick={handleTaskReformulate} 
                        isLoading={isTaskReformulating} 
                        hasText={!!taskForm.description}
                      />
                    )}
                  </div>
                  <textarea 
                    value={taskForm.description || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                    placeholder="Detalles de la tarea..."
                  />
                </div>
              </div>
            </>
          )}

          {/* NOTE FORM */}
          {activeTab === 'note' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                <input 
                  type="text" 
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Título de la nota"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contenido</label>
                  {isFeatureEnabled('ENABLE_NOTE_AI_REFORMULATION') && (
                    <AiReformulateButton 
                      onClick={handleNoteReformulate} 
                      isLoading={isNoteReformulating} 
                      hasText={!!noteForm.content}
                      featureFlag="ENABLE_NOTE_AI_REFORMULATION"
                    />
                  )}
                </div>
                <textarea 
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  placeholder="Escribe tu nota aquí..."
                />
              </div>
            </div>
          )}

          {/* EVENT FORM */}
          {activeTab === 'event' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del evento</label>
                <input 
                  type="text" 
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Ej. Reunión de equipo"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Inicio</label>
                  <button
                    type="button"
                    onClick={() => setShowEventStartPicker(true)}
                    className="w-full px-4 py-2.5 text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="truncate">
                      {eventForm.start_time 
                        ? new Date(eventForm.start_time).toLocaleString() 
                        : 'Seleccionar'}
                    </span>
                  </button>
                  {showEventStartPicker && (
                    <DateTimePicker 
                      isOpen={true}
                      initialDate={eventForm.start_time}
                      onSave={(dateStr) => {
                        setEventForm({ ...eventForm, start_time: dateStr });
                        setShowEventStartPicker(false);
                      }}
                      onClose={() => setShowEventStartPicker(false)}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fin</label>
                  <button
                    type="button"
                    onClick={() => setShowEventEndPicker(true)}
                    className="w-full px-4 py-2.5 text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="truncate">
                      {eventForm.end_time 
                        ? new Date(eventForm.end_time).toLocaleString() 
                        : 'Seleccionar'}
                    </span>
                  </button>
                  {showEventEndPicker && (
                    <DateTimePicker 
                      isOpen={true}
                      initialDate={eventForm.end_time}
                      onSave={(dateStr) => {
                        setEventForm({ ...eventForm, end_time: dateStr });
                        setShowEventEndPicker(false);
                      }}
                      onClose={() => setShowEventEndPicker(false)}
                    />
                  )}
                </div>
              </div>

              {/* Reminders Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recordatorios</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="number"
                    min="1"
                    value={reminderValue}
                    onChange={(e) => setReminderValue(parseInt(e.target.value) || 0)}
                    className="w-20 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <select
                    value={reminderUnit}
                    onChange={(e) => setReminderUnit(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  >
                    <option value="minutes">Minutos antes</option>
                    <option value="hours">Horas antes</option>
                    <option value="days">Días antes</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => addReminder('event')}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                
                {/* List of reminders */}
                {eventForm.reminders && eventForm.reminders.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {eventForm.reminders.map((reminder, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                        <Bell className="w-3 h-3" />
                        {reminder.value} {
                          reminder.unit === 'minutes' ? 'min' : 
                          reminder.unit === 'hours' ? 'hrs' : 'días'
                        }
                        <button 
                          onClick={() => removeReminder('event', idx)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ubicación</label>
                 <input 
                   type="text" 
                   value={eventForm.location || ''}
                   onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                   className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                   placeholder="Ej. Sala de conferencias / Zoom"
                 />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                  {isFeatureEnabled('ENABLE_EVENT_AI_REFORMULATION') && (
                    <AiReformulateButton 
                      onClick={handleEventReformulate} 
                      isLoading={isEventReformulating} 
                      hasText={!!eventForm.description}
                      featureFlag="ENABLE_EVENT_AI_REFORMULATION"
                    />
                  )}
                </div>
                <textarea 
                  value={eventForm.description || ''}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                  placeholder="Detalles del evento..."
                />
              </div>
            </div>
          )}

          {/* TAG FORM */}
          {activeTab === 'tag' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre de etiqueta</label>
                <input 
                  type="text" 
                  value={tagForm.name}
                  onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Ej. Trabajo, Personal..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                <div className="flex flex-wrap gap-3 mb-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTagForm({ ...tagForm, color })}
                      className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${
                        tagForm.color === color 
                          ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-indigo-400 dark:ring-offset-gray-900 scale-110' 
                          : 'hover:scale-110 hover:shadow-sm'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {tagForm.color === color && (
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                  
                  {/* Custom Color Button */}
                  <label className={`w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 cursor-pointer transition-all flex items-center justify-center ${
                    !COLORS.includes(tagForm.color) 
                      ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-indigo-400 dark:ring-offset-gray-900 scale-110' 
                      : 'hover:scale-110 hover:shadow-sm'
                  }`}>
                    <input 
                      type="color" 
                      className="opacity-0 w-0 h-0"
                      value={tagForm.color}
                      onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                    />
                    {!COLORS.includes(tagForm.color) ? (
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    ) : (
                      <Plus className="w-4 h-4 text-white" />
                    )}
                  </label>
                </div>
                
                {/* Custom Color Preview/Input for visibility */}
                {!COLORS.includes(tagForm.color) && (
                   <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                     <div 
                       className="w-10 h-10 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
                       style={{ backgroundColor: tagForm.color }}
                     />
                     <input 
                       type="text" 
                       value={tagForm.color}
                       onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                       className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm uppercase"
                       placeholder="#000000"
                       maxLength={7}
                     />
                   </div>
                )}
              </div>
            </div>
          )}

          {/* SHARED TAGS SECTION (Task & Note only) */}
          {(activeTab === 'task' || activeTab === 'note') && (
            <div className="space-y-4">
              {/* Tags Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Etiquetas</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTagSelection(tag.id)}
                        className={`
                          px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 border
                          ${isSelected 
                            ? 'shadow-sm' 
                            : 'border-transparent hover:opacity-80'}
                        `}
                        style={{ 
                          backgroundColor: tag.color + '15',
                          color: tag.color,
                          borderColor: isSelected ? tag.color : 'transparent'
                        }}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <TagIcon className="w-3.5 h-3.5" />}
                        {tag.name}
                      </button>
                    );
                  })}
                  <button 
                    type="button"
                    onClick={() => setActiveTab('tag')}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SHARED LINKING SECTION (Task, Note & Event) */}
          {(activeTab === 'task' || activeTab === 'note' || activeTab === 'event') && (
            <div className="relative z-10">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vincular con...</label>
              
              {/* Selected Linked Items */}
              {linkedItems.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {linkedItems.map(item => (
                    <span 
                      key={item.id} 
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800"
                    >
                      {item.type === 'task' && <CheckSquare className="w-3 h-3" />}
                      {item.type === 'note' && <StickyNote className="w-3 h-3" />}
                      {item.type === 'event' && <Calendar className="w-3 h-3" />}
                      {item.title}
                      <button 
                        onClick={() => removeLinkedItem(item.id)} 
                        className="ml-1 text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === 'task' ? "Buscar notas o eventos..." :
                    activeTab === 'note' ? "Buscar tareas o eventos..." :
                    "Buscar tareas o notas..."
                  }
                  className="w-full pl-10 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {isSearching && (
                   <div className="absolute right-3 top-1/2 -translate-y-1/2">
                     <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                   </div>
                )}
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto overflow-x-hidden z-20">
                    {searchResults.map(result => (
                      <button
                        key={result.id}
                        onClick={() => handleLinkItem(result)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-3 border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                      >
                        <div className={`
                          p-2 rounded-lg 
                          ${result.type === 'task' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : ''}
                          ${result.type === 'note' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                          ${result.type === 'event' ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : ''}
                        `}>
                          {result.type === 'task' && <CheckSquare className="w-4 h-4" />}
                          {result.type === 'note' && <StickyNote className="w-4 h-4" />}
                          {result.type === 'event' && <Calendar className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">{result.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{
                            result.type === 'task' ? 'Tarea' :
                            result.type === 'note' ? 'Nota' : 'Evento'
                          }</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckSquare className="w-5 h-5" />}
            <span>
              {activeTab === 'task' && 'Crear tarea'}
              {activeTab === 'note' && 'Crear nota'}
              {activeTab === 'event' && 'Crear evento'}
              {activeTab === 'tag' && 'Crear etiqueta'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
