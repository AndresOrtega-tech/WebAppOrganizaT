'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import TaskHeader from '@/components/TaskDetail/TaskHeader';
import TaskInfo from '@/components/TaskDetail/TaskInfo';
import TaskTagsModal from '@/components/TaskDetail/TaskTagsModal';
import LinkItemModal from '@/components/LinkItemModal';
import { isFeatureEnabled } from '@/config/features';
import { Event, eventsService } from '@/services/events.service';
import { taskService } from '@/services/task.service';
import HomeSidebar from '@/components/Home/HomeSidebar';
import { Tag, tagsService } from '@/services/tags.service';
import { User } from '@/services/auth.service';
import { apiClient } from '@/services/api.client';

export default function TaskDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  const {
    task,
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
    isLinkModalOpen,
    setIsLinkModalOpen,
    availableNotes,
    isLoadingNotes,
    handleLinkNote,
    handleUnlinkNote,
    showUnlinkModal,
    setShowUnlinkModal,
    confirmUnlinkNote,
    openLinkModal,
    reloadTask,
    hasUnsavedChanges
  } = useTaskDetail(id);

  const isLinkingEnabled = isFeatureEnabled('ENABLE_TASK_NOTE_LINKING');
  const isEventLinkingEnabled = isFeatureEnabled('ENABLE_EVENT_LINKING');
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

  const from = searchParams.get('from');
  const fromId = searchParams.get('fromId');
  const backHref = from === 'note' && fromId
    ? `/notes/${fromId}`
    : from === 'event' && fromId
      ? `/events/${fromId}`
      : from === 'task' && fromId
        ? `/tasks/${fromId}`
        : '/tasks';

  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
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

  const loadTags = useCallback(async () => {
    try {
      const data = await tagsService.getTags();
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleLogout = () => {
    apiClient.logout();
    router.push('/login');
  };

  useEffect(() => {
    if (!isFeatureEnabled('ENABLE_TASK_DETAIL')) {
      router.push('/tasks');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (!task || !isEventLinkingEnabled) return;
    loadEvents();
  }, [task, isEventLinkingEnabled]);

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

  const linkedEvents = task ? events.filter(e => (e.tasks || []).some(t => t.id === task.id)) : [];

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
    if (!task) return;
    try {
      await eventsService.linkTaskToEvent(eventId, task.id);
      const selectedEvent = availableEvents.find(e => e.id === eventId) || events.find(e => e.id === eventId);
      const eventNotes = selectedEvent?.notes || [];
      const taskNotes = task.notes || [];
      const eventNoteIds = new Set(eventNotes.map(n => n.id));

      for (const note of taskNotes) {
        if (!eventNoteIds.has(note.id)) {
          await eventsService.linkNoteToEvent(eventId, note.id);
        }
      }

      const taskNoteIds = new Set(taskNotes.map(n => n.id));
      for (const note of eventNotes) {
        if (!taskNoteIds.has(note.id)) {
          await taskService.linkNoteToTask(task.id, note.id);
        }
      }

      await loadEvents();
      await reloadTask();
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
    if (!eventToUnlink || !task) return;
    try {
      await eventsService.unlinkTaskFromEvent(eventToUnlink, task.id);
      await loadEvents();
      await reloadTask();
      setShowUnlinkEventModal(false);
      setEventToUnlink(null);
    } catch (err) {
      console.error('Error unlinking event:', err);
      alert('Error al desvincular el evento');
    }
  };

  const navigateWithGuard = (href: string) => {
    if (hasUnsavedChanges) {
      setPendingRoute(href);
      setIsUnsavedModalOpen(true);
      return;
    }
    router.push(href);
  };

  const handleBack = () => {
    navigateWithGuard(backHref);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">Cargando detalles...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6">
        <div className="text-red-500 font-medium mb-4">{error || 'Tarea no encontrada'}</div>
        <Link 
          href={backHref} 
          className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-sans">
      <div className="flex">
        <HomeSidebar
          tags={tags}
          user={user}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-4 md:p-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto space-y-6">
            <TaskHeader 
              onBack={handleBack}
              onDelete={() => setShowDeleteModal(true)}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            <TaskInfo 
              task={task}
              editForm={editForm}
              setEditForm={setEditForm}
              onManageTags={() => setIsTagsModalOpen(true)}
              onRemoveTag={handleRemoveTag}
              onLinkNote={openLinkModal}
              onUnlinkNote={handleUnlinkNote}
              isLinkingEnabled={isLinkingEnabled}
              linkedEvents={linkedEvents}
              onLinkEvent={openLinkEventModal}
              onUnlinkEvent={handleUnlinkEvent}
              isEventLinkingEnabled={isEventLinkingEnabled && !eventsError}
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

      <TaskTagsModal
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        onSubmit={handleTagsUpdate}
        currentTagIds={task.tags.map(t => t.id)}
        isSaving={isSaving}
      />

      <LinkItemModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onLink={handleLinkNote}
        items={availableNotes}
        title="Vincular Nota"
        isLoading={isLoadingNotes}
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
        onConfirm={confirmUnlinkNote}
        title="Desvincular Nota"
        message="¿Estás seguro de que quieres desvincular esta nota? La nota no se eliminará."
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
        message="Se detectaron cambios en esta tarea. ¿Quieres guardar antes de salir?"
        confirmText="Guardar y salir"
        cancelText="Cancelar"
        isLoading={isSaving}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Tarea"
        message="¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />
    </div>
  );
}
