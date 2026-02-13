'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import TaskHeader from '@/components/TaskDetail/TaskHeader';
import TaskInfo from '@/components/TaskDetail/TaskInfo';
import TaskEditModal from '@/components/TaskDetail/TaskEditModal';
import TaskTagsModal from '@/components/TaskDetail/TaskTagsModal';
import LinkItemModal from '@/components/LinkItemModal';
import { isFeatureEnabled } from '@/config/features';
import { Event, eventsService } from '@/services/events.service';
import { taskService } from '@/services/task.service';

export default function TaskDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  const {
    task,
    loading,
    error,
    isEditing,
    setIsEditing,
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
    reloadTask
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

  const from = searchParams.get('from');
  const fromId = searchParams.get('fromId');
  const backHref = from === 'note' && fromId
    ? `/notes/${fromId}`
    : from === 'event' && fromId
      ? `/events/${fromId}`
      : from === 'task' && fromId
        ? `/tasks/${fromId}`
        : '/home';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <TaskHeader 
        backHref={backHref}
        onDelete={() => setShowDeleteModal(true)}
        onEdit={() => setIsEditing(true)}
        onManageTags={() => setIsTagsModalOpen(true)}
      />

      <TaskInfo 
        task={task} 
        isLinkingEnabled={isLinkingEnabled}
        onLinkNote={openLinkModal}
        onUnlinkNote={handleUnlinkNote}
        linkedEvents={linkedEvents}
        onLinkEvent={openLinkEventModal}
        onUnlinkEvent={handleUnlinkEvent}
      />

      {isEditing && (
        <TaskEditModal 
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          onSubmit={handleUpdate}
          editForm={editForm}
          setEditForm={setEditForm}
          isSaving={isSaving}
        />
      )}

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

      {isLinkingEnabled && (
        <>
          <LinkItemModal
            isOpen={isLinkModalOpen}
            onClose={() => setIsLinkModalOpen(false)}
            onLink={handleLinkNote}
            items={availableNotes}
            title="Vincular Nota"
            isLoading={isLoadingNotes}
          />

          <ConfirmationModal
            isOpen={showUnlinkModal}
            onClose={() => setShowUnlinkModal(false)}
            onConfirm={confirmUnlinkNote}
            title="Desvincular Nota"
            message="¿Estás seguro de que quieres desvincular esta nota? La nota no se eliminará."
            confirmText="Desvincular"
          />
        </>
      )}

      {isEventLinkingEnabled && (
        <>
          <LinkItemModal
            isOpen={isLinkEventModalOpen}
            onClose={() => setIsLinkEventModalOpen(false)}
            onLink={handleLinkEvent}
            items={availableEvents.map(e => ({
              ...e,
              description: e.description || undefined
            }))}
            title="Vincular Evento"
            isLoading={isLoadingEvents}
          />

          <ConfirmationModal
            isOpen={showUnlinkEventModal}
            onClose={() => setShowUnlinkEventModal(false)}
            onConfirm={confirmUnlinkEvent}
            title="Desvincular Evento"
            message="¿Estás seguro de que quieres desvincular este evento? El evento no se eliminará."
            confirmText="Desvincular"
          />
        </>
      )}

      {isTagsModalOpen && (
        <TaskTagsModal
          isOpen={isTagsModalOpen}
          onClose={() => setIsTagsModalOpen(false)}
          onSubmit={handleTagsUpdate}
          currentTagIds={task.tags.map(t => t.id)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
