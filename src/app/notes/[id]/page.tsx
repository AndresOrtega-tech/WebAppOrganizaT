'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNoteDetail } from '@/hooks/useNoteDetail';

import NoteHeader from '@/components/NoteDetail/NoteHeader';
import NoteInfo from '@/components/NoteDetail/NoteInfo';
import NoteTagsModal from '@/components/NoteDetail/NoteTagsModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import LinkItemModal from '@/components/LinkItemModal';
import HomeSidebar from '@/components/Home/HomeSidebar';
import { User } from '@/services/auth.service';
import { Tag, tagsService } from '@/services/tags.service';
import { apiClient } from '@/services/api.client';
import { taskService, Task } from '@/services/task.service';
import { Event, eventsService } from '@/services/events.service';

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  const {
    note,
    loading,
    error,
    isSaving,
    isDeleting,
    showDeleteModal,
    setShowDeleteModal,
    isTagsModalOpen,
    setIsTagsModalOpen,
    editForm,
    setEditForm,
    handleUpdate,
    confirmDelete,
    handleTagsUpdate,
    handleRemoveTag,
    hasUnsavedChanges,
    reloadNote,
  } = useNoteDetail(id);

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [taskToUnlink, setTaskToUnlink] = useState<string | null>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [isLinkEventModalOpen, setIsLinkEventModalOpen] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [showUnlinkEventModal, setShowUnlinkEventModal] = useState(false);
  const [eventToUnlink, setEventToUnlink] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [origin, setOrigin] = useState<{ from: string; fromId?: string | null } | null>(null);

  const setSidebarOpen = (open: boolean) => {
    setIsSidebarOpen(open);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sidebar_open', String(open));
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextFrom = searchParams.get('from');
    const nextFromId = searchParams.get('fromId');
    if (nextFrom) {
      const value = { from: nextFrom, fromId: nextFromId || null };
      setOrigin(value);
      window.localStorage.setItem('note_detail_origin', JSON.stringify(value));
      return;
    }
    const stored = window.localStorage.getItem('note_detail_origin');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { from: string; fromId?: string | null };
        setOrigin(parsed);
      } catch {
        setOrigin(null);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('sidebar_open');
    if (stored !== null) {
      setIsSidebarOpen(stored === 'true');
      return;
    }
    const isDesktop = window.innerWidth >= 768;
    setIsSidebarOpen(isDesktop);
    window.localStorage.setItem('sidebar_open', String(isDesktop));
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  const loadTags = async () => {
    try {
      const data = await tagsService.getTags();
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const handleLogout = () => {
    apiClient.logout();
    router.push('/login');
  };

  useEffect(() => {
    if (!note) return;
    loadEvents();
  }, [note]);

  const loadEvents = async () => {
    try {
      setEventsError(null);
      const data = await eventsService.getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
      setEventsError('Error al cargar eventos');
    }
  };

  const openLinkModal = async () => {
    setIsLinkModalOpen(true);
    setIsLoadingTasks(true);
    try {
      const { tasks } = await taskService.getTasks();
      const linkedTaskIds = note?.tasks?.map(t => t.id) || [];
      const available = tasks.filter(t => !linkedTaskIds.includes(t.id));
      setAvailableTasks(available);
    } catch (err) {
      console.error('Error loading tasks:', err);
      alert('Error al cargar tareas disponibles');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleLinkTask = async (taskId: string) => {
    if (!note) return;
    try {
      await taskService.linkNoteToTask(taskId, note.id);
      await reloadNote();
      setIsLinkModalOpen(false);
    } catch (err) {
      console.error('Error linking task:', err);
      alert('Error al vincular la tarea');
    }
  };

  const handleUnlinkTask = (taskId: string) => {
    setTaskToUnlink(taskId);
    setShowUnlinkModal(true);
  };

  const confirmUnlinkTask = async () => {
    if (!note || !taskToUnlink) return;
    try {
      await taskService.unlinkNoteFromTask(taskToUnlink, note.id);
      await reloadNote();
      setShowUnlinkModal(false);
      setTaskToUnlink(null);
    } catch (err) {
      console.error('Error unlinking task:', err);
      alert('Error al desvincular la tarea');
    }
  };

  const linkedEvents = note ? events.filter(e => (e.notes || []).some(n => n.id === note.id)) : [];

  const openLinkEventModal = async () => {
    setIsLinkEventModalOpen(true);
    setIsLoadingEvents(true);
    try {
      const data = await eventsService.getEvents();
      const linkedIds = new Set(linkedEvents.map(e => e.id));
      setAvailableEvents(data.filter(e => !linkedIds.has(e.id)));
    } catch (err) {
      console.error('Error loading events:', err);
      alert('Error al cargar eventos disponibles');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleLinkEvent = async (eventId: string) => {
    if (!note) return;
    try {
      await eventsService.linkNoteToEvent(eventId, note.id);
      const selectedEvent = availableEvents.find(e => e.id === eventId) || events.find(e => e.id === eventId);
      const eventTasks = selectedEvent?.tasks || [];
      const noteTasks = note.tasks || [];
      const eventTaskIds = new Set(eventTasks.map(t => t.id));

      for (const task of noteTasks) {
        if (!eventTaskIds.has(task.id)) {
          await eventsService.linkTaskToEvent(eventId, task.id);
        }
      }

      const noteTaskIds = new Set(noteTasks.map(t => t.id));
      for (const task of eventTasks) {
        if (!noteTaskIds.has(task.id)) {
          await taskService.linkNoteToTask(task.id, note.id);
        }
      }

      await loadEvents();
      await reloadNote();
      setIsLinkEventModalOpen(false);
    } catch (err) {
      console.error('Error linking event:', err);
      alert('Error al vincular el evento');
    }
  };

  const handleUnlinkEvent = (eventId: string) => {
    setEventToUnlink(eventId);
    setShowUnlinkEventModal(true);
  };

  const confirmUnlinkEvent = async () => {
    if (!note || !eventToUnlink) return;
    try {
      await eventsService.unlinkNoteFromEvent(eventToUnlink, note.id);
      await loadEvents();
      await reloadNote();
      setShowUnlinkEventModal(false);
      setEventToUnlink(null);
    } catch (err) {
      console.error('Error unlinking event:', err);
      alert('Error al desvincular el evento');
    }
  };

  const backHref =
    origin?.from === 'task' && origin.fromId
      ? `/tasks/${origin.fromId}`
      : origin?.from === 'event' && origin.fromId
        ? `/events/${origin.fromId}`
        : origin?.from === 'note' && origin.fromId
          ? `/notes/${origin.fromId}`
          : origin?.from === 'home'
            ? '/home'
            : '/notes';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
        <div className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Cargando nota...</div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6">
        <div className="text-red-500 font-medium mb-4">{error || 'Nota no encontrada'}</div>
        <Link
          href={backHref}
          className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Notas
        </Link>
      </div>
    );
  }

  const isLinkingEnabled = true;
  const isEventLinkingEnabled = true;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <div className="flex">
        {/* Sidebar */}
        <HomeSidebar
          tags={tags}
          user={user}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 transition-all duration-300 relative max-h-screen overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            <NoteHeader
              backHref={backHref}
              onDelete={() => setShowDeleteModal(true)}
              onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
            />

            <NoteInfo
              note={note}
              editForm={editForm}
              setEditForm={setEditForm}
              onRemoveTag={handleRemoveTag}
              onManageTags={() => setIsTagsModalOpen(true)}
              onLinkTask={openLinkModal}
              onUnlinkTask={handleUnlinkTask}
              isLinkingEnabled={isLinkingEnabled}
              linkedEvents={linkedEvents}
              onLinkEvent={openLinkEventModal}
              onUnlinkEvent={handleUnlinkEvent}
              isEventLinkingEnabled={isEventLinkingEnabled && !eventsError}
              onSummaryGenerated={reloadNote}
            />
          </div>
        </main>
      </div>

      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => handleUpdate()}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            Guardar cambios
          </button>
        </div>
      )}

      <NoteTagsModal
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        onSubmit={handleTagsUpdate}
        currentTagIds={note.tags?.map(t => t.id) || []}
        isSaving={isSaving}
      />

      <LinkItemModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLink={handleLinkTask}
        items={availableTasks}
        title="Vincular Tarea"
        isLoading={isLoadingTasks}
      />

      <LinkItemModal
        isOpen={isLinkEventModalOpen}
        onClose={() => setIsLinkEventModalOpen(false)}
        onLink={handleLinkEvent}
        items={availableEvents.map(event => ({
          ...event,
          description: event.description || undefined
        }))}
        title="Vincular Evento"
        isLoading={isLoadingEvents}
      />

      <ConfirmationModal
        isOpen={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
        onConfirm={confirmUnlinkTask}
        title="Desvincular Tarea"
        message="¿Estás seguro de que quieres desvincular esta tarea? La tarea no se eliminará."
        confirmText="Desvincular"
      />

      <ConfirmationModal
        isOpen={showUnlinkEventModal}
        onClose={() => setShowUnlinkEventModal(false)}
        onConfirm={confirmUnlinkEvent}
        title="Desvincular Evento"
        message="¿Estás seguro de que quieres desvincular este evento? El evento no se eliminará."
        confirmText="Desvincular"
      />

      <ConfirmationModal
        isOpen={isUnsavedModalOpen}
        onClose={() => setIsUnsavedModalOpen(false)}
        onConfirm={async () => {
          const ok = await handleUpdate();
          if (ok) {
            setIsUnsavedModalOpen(false);
            const target = pendingRoute || backHref;
            router.push(target);
          }
        }}
        title="Cambios sin guardar"
        message="Se detectaron cambios en esta nota. ¿Quieres guardar antes de salir?"
        confirmText="Guardar y salir"
        cancelText="Cancelar"
        isLoading={isSaving}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Nota"
        message="¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />
    </div>
  );
}
