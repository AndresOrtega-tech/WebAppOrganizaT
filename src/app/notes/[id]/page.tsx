'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Note, notesService } from '@/services/notes.service';
import { isFeatureEnabled } from '@/config/features';
import NoteModal from '@/components/NoteModal';
import NoteHeader from '@/components/NoteDetail/NoteHeader';
import NoteInfo from '@/components/NoteDetail/NoteInfo';
import NoteTagsModal from '@/components/NoteDetail/NoteTagsModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import LinkItemModal from '@/components/LinkItemModal';
import { taskService, Task } from '@/services/task.service';

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
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

  useEffect(() => {
    if (!isFeatureEnabled('ENABLE_NOTE_DETAIL')) {
      router.push('/notes');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadNote(token, id);
  }, [id, router]);

  const loadNote = async (token: string, noteId: string) => {
    try {
      setLoading(true);
      const data = await notesService.getNoteById(token, noteId);
      setNote(data);
    } catch (err) {
      console.error('Error loading note:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }
      setError('Error al cargar la nota');
    } finally {
      setLoading(false);
    }
  };

  const handleNoteUpdated = (updatedNote: Note) => {
    setNote(updatedNote);
  };

  const handleTagsUpdate = async (tagIds: string[]) => {
    if (!note) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Calculate diffs
      const currentTagIds = note.tags.map(t => t.id);
      const tagsToAdd = tagIds.filter(id => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter(id => !tagIds.includes(id));

      // 1. Add new tags (if any)
      if (tagsToAdd.length > 0) {
        await notesService.assignTagsToNote(token, note.id, tagsToAdd);
      }

      // 2. Remove unselected tags (if any)
      if (tagsToRemove.length > 0) {
        // Execute sequentially to avoid race conditions or backend overload
        for (const tagId of tagsToRemove) {
          await notesService.removeTagFromNote(token, note.id, tagId);
        }
      }
      
      // Reload note to get updated tags
      await loadNote(token, note.id);
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
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      await notesService.deleteNote(token, note.id);
      router.push('/notes');
    } catch (err) {
      console.error('Error deleting note:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        router.push('/login');
        return;
      }
      alert('Error al eliminar la nota');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!note) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Optimistic update
      const updatedTags = note.tags.filter(t => t.id !== tagId);
      setNote({ ...note, tags: updatedTags });

      await notesService.removeTagFromNote(token, note.id, tagId);
    } catch (err) {
      console.error('Error removing tag:', err);
      // Revert on error
      const token = localStorage.getItem('access_token');
      if (token) loadNote(token, note.id);
    }
  };

  const openLinkModal = async () => {
    setIsLinkModalOpen(true);
    setIsLoadingTasks(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const tasks = await taskService.getTasks(token);
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
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Use taskService to link note to task (endpoint works both ways effectively)
      await taskService.linkNoteToTask(token, taskId, note.id);
      await loadNote(token, note.id); // Reload to show new link
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
      const token = localStorage.getItem('access_token');
      if (!token) return;

      await taskService.unlinkNoteFromTask(token, taskToUnlink, note.id);
      await loadNote(token, note.id);
      setShowUnlinkModal(false);
      setTaskToUnlink(null);
    } catch (err) {
      console.error('Error unlinking task:', err);
      alert('Error al desvincular la tarea');
    }
  };

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
          href="/notes" 
          className="text-indigo-600 dark:text-indigo-400 font-bold hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Notas
        </Link>
      </div>
    );
  }

  const isLinkingEnabled = isFeatureEnabled('ENABLE_TASK_NOTE_LINKING');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
      <NoteHeader 
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

      <ConfirmationModal
        isOpen={showUnlinkModal}
        onClose={() => setShowUnlinkModal(false)}
        onConfirm={confirmUnlinkTask}
        title="Desvincular Tarea"
        message="¿Estás seguro de que quieres desvincular esta tarea? La tarea no se eliminará."
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
