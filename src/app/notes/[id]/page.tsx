'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Note, notesService } from '@/services/notes.service';

import NoteModal from '@/components/NoteModal';
import NoteHeader from '@/components/NoteDetail/NoteHeader';
import NoteInfo from '@/components/NoteDetail/NoteInfo';
import NoteTagsModal from '@/components/NoteDetail/NoteTagsModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import LinkItemModal from '@/components/LinkItemModal';
import { taskService, Task } from '@/services/task.service';
import { Event, eventsService } from '@/services/events.service';

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  useEffect(() => {

    loadNote(id);
  }, [id, router]);

  useEffect(() => {
    if (!note) return;
    loadEvents();
  }, [note]);

  const loadNote = async (noteId: string) => {
    try {
      setLoading(true);
      const data = await notesService.getNoteById(noteId);
      setNote(data);
    } catch (err) {
      console.error('Error loading note:', err);
      setError('Error al cargar la nota');
    } finally {
      setLoading(false);
    }
  };

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

  const handleNoteUpdated = (updatedNote: Note) => {
    setNote(updatedNote);
  };

  const handleTagsUpdate = async (tagIds: string[]) => {
    if (!note) return;

    try {
      setIsSaving(true);

      // Calculate diffs
      const currentTagIds = note.tags.map(t => t.id);
      const tagsToAdd = tagIds.filter(id => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter(id => !tagIds.includes(id));

      // 1. Add new tags (if any)
      if (tagsToAdd.length > 0) {
        await notesService.assignTagsToNote(note.id, tagsToAdd);
      }

      // 2. Remove unselected tags (if any)
      if (tagsToRemove.length > 0) {
        // Execute sequentially to avoid race conditions or backend overload
        for (const tagId of tagsToRemove) {
          await notesService.removeTagFromNote(note.id, tagId);
        }
      }

      // Reload note to get updated tags
      await loadNote(note.id);
      setIsTagsModalOpen(false);
    } catch (err) {
      console.error('Error updating tags:', err);
      alert('Error al actualizar las etiquetas');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!note) return;

    try {
      setIsDeleting(true);

      await notesService.deleteNote(note.id);
      router.push('/notes');
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Error al eliminar la nota');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!note) return;

    try {
      // Optimistic update
      const updatedTags = note.tags.filter(t => t.id !== tagId);
      setNote({ ...note, tags: updatedTags });

      await notesService.removeTagFromNote(note.id, tagId);
    } catch (err) {
      console.error('Error removing tag:', err);
      // Revert on error
      loadNote(note.id);
    }
  };

  const openLinkModal = async () => {
    setIsLinkModalOpen(true);
    setIsLoadingTasks(true);
    try {
      const { tasks } = await taskService.getTasks();
      // Filter out already linked tasks
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
      // Use taskService to link note to task (endpoint works both ways effectively)
      await taskService.linkNoteToTask(taskId, note.id);
      await loadNote(note.id); // Reload to show new link
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
      await loadNote(note.id);
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
      await loadNote(note.id);
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
      await loadNote(note.id);
      setShowUnlinkEventModal(false);
      setEventToUnlink(null);
    } catch (err) {
      console.error('Error unlinking event:', err);
      alert('Error al desvincular el evento');
    }
  };

  const from = searchParams.get('from');
  const fromId = searchParams.get('fromId');
  const backHref = from === 'task' && fromId
    ? `/tasks/${fromId}`
    : from === 'event' && fromId
      ? `/events/${fromId}`
      : from === 'note' && fromId
        ? `/notes/${fromId}`
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <NoteHeader
        backHref={backHref}
        onEdit={() => setIsEditModalOpen(true)}
        onManageTags={() => setIsTagsModalOpen(true)}
        onDelete={() => setShowDeleteModal(true)}
      />

      <NoteInfo
        note={note}
        onRemoveTag={handleRemoveTag}
        onLinkTask={openLinkModal}
        onUnlinkTask={handleUnlinkTask}
        isLinkingEnabled={isLinkingEnabled}
        linkedEvents={linkedEvents}
        onLinkEvent={openLinkEventModal}
        onUnlinkEvent={handleUnlinkEvent}
        isEventLinkingEnabled={isEventLinkingEnabled && !eventsError}
      />

      <NoteModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onNoteSaved={handleNoteUpdated}
        initialData={note}
      />

      <NoteTagsModal
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        onSubmit={handleTagsUpdate}
        currentTagIds={note.tags.map(t => t.id)}
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
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Nota"
        message="¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}
