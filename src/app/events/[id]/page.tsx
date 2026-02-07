'use client';

 import { useEffect, useState } from 'react';
 import { useParams, useRouter } from 'next/navigation';
 import Link from 'next/link';
 import { ArrowLeft, CalendarDays, MapPin, Bell, Loader2, Pencil, Trash2 } from 'lucide-react';
 import ThemeToggle from '@/components/ThemeToggle';
 import EventModal from '@/components/EventModal';
 import ConfirmationModal from '@/components/ConfirmationModal';
 import LinkItemModal from '@/components/LinkItemModal';
 import LinkedItemsList from '@/components/LinkedItemsList';
 import { isFeatureEnabled } from '@/config/features';
 import { Event, eventsService } from '@/services/events.service';
 import { Task, taskService } from '@/services/task.service';
 import { Note, notesService } from '@/services/notes.service';

 const formatDateTime = (dateString: string | null) => {
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

 export default function EventDetailPage() {
   const router = useRouter();
   const params = useParams();
   const id = params?.id as string;
   const [event, setEvent] = useState<Event | null>(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLinkTaskModalOpen, setIsLinkTaskModalOpen] = useState(false);
  const [isLinkNoteModalOpen, setIsLinkNoteModalOpen] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [showUnlinkTaskModal, setShowUnlinkTaskModal] = useState(false);
  const [showUnlinkNoteModal, setShowUnlinkNoteModal] = useState(false);
  const [taskToUnlink, setTaskToUnlink] = useState<string | null>(null);
  const [noteToUnlink, setNoteToUnlink] = useState<string | null>(null);

   useEffect(() => {
     if (!isFeatureEnabled('ENABLE_EVENT_DETAIL')) {
       router.push('/events');
       return;
     }

     const token = localStorage.getItem('access_token');
     if (!token) {
       router.push('/login');
       return;
     }

     loadEvent(token, id);
   }, [id, router]);

   const loadEvent = async (token: string, eventId: string) => {
     try {
       setLoading(true);
       const data = await eventsService.getEventById(token, eventId);
       setEvent(data);
     } catch (err) {
       console.error('Error loading event:', err);
       if (err instanceof Error && err.message === 'Unauthorized') {
         localStorage.removeItem('access_token');
         localStorage.removeItem('user');
         localStorage.removeItem('refresh_token');
         router.push('/login');
         return;
       }
       setError('Error al cargar el evento');
     } finally {
       setLoading(false);
     }
   };

  const handleEventSaved = () => {
    setIsEditModalOpen(false);
    const token = localStorage.getItem('access_token');
    if (token) {
      loadEvent(token, id);
    }
  };

  const confirmDelete = async () => {
    if (!event) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      await eventsService.deleteEvent(token, event.id);
      router.push('/events');
    } catch (err) {
      console.error('Error deleting event:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }
      setError('Error al eliminar el evento');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const openLinkTaskModal = async () => {
    setIsLinkTaskModalOpen(true);
    setIsLoadingTasks(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const tasks = await taskService.getTasks(token);
      const linkedTaskIds = event?.tasks?.map(t => t.id) || [];
      const available = tasks.filter(t => !linkedTaskIds.includes(t.id));
      setAvailableTasks(available);
    } catch (err) {
      console.error('Error loading tasks:', err);
      alert('Error al cargar tareas disponibles');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const openLinkNoteModal = async () => {
    setIsLinkNoteModalOpen(true);
    setIsLoadingNotes(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const notes = await notesService.getNotes(token);
      const linkedNoteIds = event?.notes?.map(n => n.id) || [];
      const available = notes.filter(n => !linkedNoteIds.includes(n.id));
      setAvailableNotes(available);
    } catch (err) {
      console.error('Error loading notes:', err);
      alert('Error al cargar notas disponibles');
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleLinkTask = async (taskId: string) => {
    if (!event) return;
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      await eventsService.linkTaskToEvent(token, event.id, taskId);
      const selectedTask = availableTasks.find(t => t.id === taskId);
      const eventNotes = event.notes || [];
      const eventNoteIds = new Set(eventNotes.map(n => n.id));
      const taskNotes = selectedTask?.notes || [];

      for (const note of taskNotes) {
        if (!eventNoteIds.has(note.id)) {
          await eventsService.linkNoteToEvent(token, event.id, note.id);
        }
      }

      const taskNoteIds = new Set(taskNotes.map(n => n.id));
      for (const note of eventNotes) {
        if (!taskNoteIds.has(note.id)) {
          await taskService.linkNoteToTask(token, taskId, note.id);
        }
      }

      await loadEvent(token, event.id);
      setIsLinkTaskModalOpen(false);
    } catch (err) {
      console.error('Error linking task:', err);
      alert('Error al vincular la tarea');
    }
  };

  const handleLinkNote = async (noteId: string) => {
    if (!event) return;
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      await eventsService.linkNoteToEvent(token, event.id, noteId);
      const selectedNote = availableNotes.find(n => n.id === noteId);
      const eventTasks = event.tasks || [];
      const eventTaskIds = new Set(eventTasks.map(t => t.id));
      const noteTasks = selectedNote?.tasks || [];

      for (const task of noteTasks) {
        if (!eventTaskIds.has(task.id)) {
          await eventsService.linkTaskToEvent(token, event.id, task.id);
        }
      }

      const noteTaskIds = new Set(noteTasks.map(t => t.id));
      for (const task of eventTasks) {
        if (!noteTaskIds.has(task.id)) {
          await taskService.linkNoteToTask(token, task.id, noteId);
        }
      }

      await loadEvent(token, event.id);
      setIsLinkNoteModalOpen(false);
    } catch (err) {
      console.error('Error linking note:', err);
      alert('Error al vincular la nota');
    }
  };

  const handleUnlinkTask = (taskId: string) => {
    setTaskToUnlink(taskId);
    setShowUnlinkTaskModal(true);
  };

  const handleUnlinkNote = (noteId: string) => {
    setNoteToUnlink(noteId);
    setShowUnlinkNoteModal(true);
  };

  const confirmUnlinkTask = async () => {
    if (!event || !taskToUnlink) return;
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      await eventsService.unlinkTaskFromEvent(token, event.id, taskToUnlink);
      await loadEvent(token, event.id);
      setShowUnlinkTaskModal(false);
      setTaskToUnlink(null);
    } catch (err) {
      console.error('Error unlinking task:', err);
      alert('Error al desvincular la tarea');
    }
  };

  const confirmUnlinkNote = async () => {
    if (!event || !noteToUnlink) return;
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      await eventsService.unlinkNoteFromEvent(token, event.id, noteToUnlink);
      await loadEvent(token, event.id);
      setShowUnlinkNoteModal(false);
      setNoteToUnlink(null);
    } catch (err) {
      console.error('Error unlinking note:', err);
      alert('Error al desvincular la nota');
    }
  };

   if (loading) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
         <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400 mb-2" />
         <div className="text-purple-600 dark:text-purple-400 font-medium animate-pulse">Cargando evento...</div>
       </div>
     );
   }

   if (error || !event) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6">
         <div className="text-red-500 font-medium mb-4">{error || 'Evento no encontrado'}</div>
         <Link 
           href="/events" 
           className="text-purple-600 dark:text-purple-400 font-bold hover:text-purple-700 dark:hover:text-purple-300 flex items-center"
         >
           <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Eventos
         </Link>
       </div>
     );
   }

   const isLinkingEnabled = isFeatureEnabled('ENABLE_EVENT_LINKING');

   return (
     <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
       <nav className="bg-white dark:bg-gray-900 px-6 py-4 shadow-sm sticky top-0 z-10 border-b border-transparent dark:border-gray-800 transition-colors">
         <div className="max-w-2xl mx-auto flex items-center justify-between">
           <div className="flex items-center flex-1 min-w-0">
             <Link href="/events" className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0">
               <ArrowLeft className="w-6 h-6" />
             </Link>
             <h1 className="ml-4 text-xl font-bold text-gray-900 dark:text-white truncate">Detalle de Evento</h1>
           </div>
           <div className="flex gap-2 items-center">
             <ThemeToggle />
             {isFeatureEnabled('ENABLE_EVENT_EDITING') && (
               <button
                 onClick={() => setIsEditModalOpen(true)}
                 className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-full transition-colors"
                 title="Editar evento"
               >
                 <Pencil className="w-5 h-5" />
               </button>
             )}
             {isFeatureEnabled('ENABLE_EVENT_DELETION') && (
               <button
                 onClick={() => setShowDeleteModal(true)}
                 className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                 title="Eliminar evento"
               >
                 <Trash2 className="w-5 h-5" />
               </button>
             )}
           </div>
         </div>
       </nav>

       <main className="max-w-2xl mx-auto px-6 py-8">
         <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
           <div className="p-6 space-y-8">
             <div>
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{event.title}</h2>
               <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                 {event.description || 'Sin descripción'}
               </p>
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <div className="flex items-start gap-3">
                 <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                   <CalendarDays className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-gray-900 dark:text-gray-200">
                     {event.is_all_day ? 'Día' : 'Inicio'}
                   </p>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                     {event.is_all_day ? formatDay(event.start_time) : formatDateTime(event.start_time)}
                   </p>
                 </div>
               </div>

               {!event.is_all_day && (
                 <div className="flex items-start gap-3">
                   <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                     <CalendarDays className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Fin</p>
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDateTime(event.end_time)}</p>
                   </div>
                 </div>
               )}

               <div className="flex items-start gap-3">
                 <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                   <MapPin className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Ubicación</p>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{event.location || 'Sin ubicación'}</p>
                 </div>
               </div>

               <div className="flex items-start gap-3">
                 <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                   <Bell className="w-5 h-5" />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Recordatorios</p>
                   {event.reminders_data && event.reminders_data.length > 0 ? (
                     <div className="flex flex-col gap-1 mt-0.5">
                       {event.reminders_data.map((r) => (
                         <p key={r.id} className="text-sm text-gray-500 dark:text-gray-400">
                           {formatDateTime(r.remind_at)}
                         </p>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Sin recordatorios</p>
                   )}
                 </div>
               </div>
             </div>

            {isLinkingEnabled && (
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-6">
                <LinkedItemsList
                  items={event.tasks || []}
                  type="task"
                  onLinkNew={openLinkTaskModal}
                  onUnlink={handleUnlinkTask}
                  originType="event"
                  originId={event.id}
                />
                <LinkedItemsList
                  items={event.notes || []}
                  type="note"
                  onLinkNew={openLinkNoteModal}
                  onUnlink={handleUnlinkNote}
                  originType="event"
                  originId={event.id}
                />
              </div>
            )}
           </div>
         </div>
       </main>

      <EventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onEventSaved={handleEventSaved}
        initialData={event}
      />

      <LinkItemModal
        isOpen={isLinkTaskModalOpen}
        onClose={() => setIsLinkTaskModalOpen(false)}
        onLink={handleLinkTask}
        items={availableTasks}
        title="Vincular Tarea"
        isLoading={isLoadingTasks}
      />

      <LinkItemModal
        isOpen={isLinkNoteModalOpen}
        onClose={() => setIsLinkNoteModalOpen(false)}
        onLink={handleLinkNote}
        items={availableNotes}
        title="Vincular Nota"
        isLoading={isLoadingNotes}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Evento"
        message="¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={showUnlinkTaskModal}
        onClose={() => setShowUnlinkTaskModal(false)}
        onConfirm={confirmUnlinkTask}
        title="Desvincular Tarea"
        message="¿Estás seguro de que quieres desvincular esta tarea? La tarea no se eliminará."
        confirmText="Desvincular"
      />

      <ConfirmationModal
        isOpen={showUnlinkNoteModal}
        onClose={() => setShowUnlinkNoteModal(false)}
        onConfirm={confirmUnlinkNote}
        title="Desvincular Nota"
        message="¿Estás seguro de que quieres desvincular esta nota? La nota no se eliminará."
        confirmText="Desvincular"
      />
     </div>
   );
 }
