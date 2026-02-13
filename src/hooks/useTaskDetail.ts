import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Task, taskService, TaskPriority, Reminder } from '@/services/task.service';
import { Note, notesService } from '@/services/notes.service';

export interface EditFormState {
  title: string;
  description: string;
  due_date: string;
  is_completed: boolean;
  priority: TaskPriority;
  reminders: Reminder[] | null;
}

export const useTaskDetail = (taskId: string) => {
  const router = useRouter();

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState(false);
  const [noteToUnlink, setNoteToUnlink] = useState<string | null>(null);
  const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const [editForm, setEditForm] = useState<EditFormState>({
    title: '',
    description: '',
    due_date: '',
    is_completed: false,
    priority: 'media',
    reminders: null
  });

  const getLocalDateTimeForInput = (isoString: string) => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  const loadTask = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const data = await taskService.getTaskById(id);
      setTask(data);
    } catch (err) {
      console.error('Error loading task:', err);
      setError('No se pudo cargar la tarea.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (taskId) {
      loadTask(taskId);
    }
  }, [taskId, loadTask]);

  useEffect(() => {
    if (task) {
      // Map absolute reminders_data back to relative reminders for the form
      let mappedReminders: Reminder[] | null = null;
      if (task.reminders_data && task.reminders_data.length > 0 && task.due_date) {
        const dueDate = new Date(task.due_date).getTime();
        mappedReminders = [];
        
        task.reminders_data.forEach(r => {
          const remindAt = new Date(r.remind_at).getTime();
          const diff = dueDate - remindAt;
          const tolerance = 60000; // 1 minute tolerance

          if (Math.abs(diff - 600000) < tolerance) { // 10 mins
            mappedReminders!.push({ value: 10, unit: 'minutes' });
          } else if (Math.abs(diff - 3600000) < tolerance) { // 1 hour
            mappedReminders!.push({ value: 1, unit: 'hours' });
          } else if (Math.abs(diff - 86400000) < tolerance) { // 1 day
            mappedReminders!.push({ value: 1, unit: 'days' });
          }
        });
        
        if (mappedReminders.length === 0) mappedReminders = null;
      }

      setEditForm({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date ? getLocalDateTimeForInput(task.due_date) : '',
        is_completed: task.is_completed,
        priority: task.priority || 'media',
        reminders: mappedReminders
      });
    }
  }, [task]);

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!task) return;
    
    try {
      setIsSaving(true);

      const updatedTask = await taskService.updateTask(task.id, {
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

  const confirmDelete = async () => {
    if (!task) return;

    try {
      setIsDeleting(true);

      await taskService.deleteTask(task.id);
      router.push('/home');
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Error al eliminar la tarea');
      setIsDeleting(false);
    }
  };

  const handleTagsUpdate = async (tagIds: string[]) => {
    if (!task) return;

    try {
      setIsSaving(true);

      // Calculate diffs
      const currentTagIds = task.tags.map(t => t.id);
      const tagsToAdd = tagIds.filter(id => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter(id => !tagIds.includes(id));

      // 1. Add new tags (if any)
      if (tagsToAdd.length > 0) {
        await taskService.assignTagsToTask(task.id, tagsToAdd);
      }

      // 2. Remove unselected tags (if any)
      if (tagsToRemove.length > 0) {
        // Execute sequentially to avoid race conditions or backend overload
        for (const tagId of tagsToRemove) {
          await taskService.removeTagFromTask(task.id, tagId);
        }
      }
      
      // Reload task to get updated tags
      await loadTask(task.id);
      setIsTagsModalOpen(false);
    } catch (err) {
      console.error('Error updating tags:', err);
      alert('Error al actualizar las etiquetas');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!task) return;

    try {
      // Optimistic update
      const updatedTags = task.tags.filter(t => t.id !== tagId);
      setTask({ ...task, tags: updatedTags });

      await taskService.removeTagFromTask(task.id, tagId);
    } catch (err) {
      console.error('Error removing tag:', err);
      alert('Error al eliminar la etiqueta de la tarea');
      // Revert optimistic update
      loadTask(task.id);
    }
  };

  const openLinkModal = async () => {
    setIsLinkModalOpen(true);
    setIsLoadingNotes(true);
    try {
      const notes = await notesService.getNotes();
      // Filter out already linked notes
      const linkedNoteIds = task?.notes?.map(n => n.id) || [];
      const available = notes.filter(n => !linkedNoteIds.includes(n.id));
      setAvailableNotes(available);
    } catch (err) {
      console.error('Error loading notes:', err);
      alert('Error al cargar notas disponibles');
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleLinkNote = async (noteId: string) => {
    if (!task) return;
    try {
      await taskService.linkNoteToTask(task.id, noteId);
      await loadTask(task.id); // Reload to show new link
      setIsLinkModalOpen(false);
    } catch (err) {
      console.error('Error linking note:', err);
      alert('Error al vincular la nota');
    }
  };

  const handleUnlinkNote = (noteId: string) => {
    setNoteToUnlink(noteId);
    setShowUnlinkModal(true);
  };

  const confirmUnlinkNote = async () => {
    if (!task || !noteToUnlink) return;

    try {
      await taskService.unlinkNoteFromTask(task.id, noteToUnlink);
      await loadTask(task.id); // Reload to update list
      setShowUnlinkModal(false);
      setNoteToUnlink(null);
    } catch (err) {
      console.error('Error unlinking note:', err);
      alert('Error al desvincular la nota');
    }
  };

  const reloadTask = async () => {
    if (!taskId) return;
    await loadTask(taskId);
  };

  return {
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
    isLinkModalOpen,
    setIsLinkModalOpen,
    availableNotes,
    isLoadingNotes,
    openLinkModal,
    handleLinkNote,
    handleUnlinkNote,
    showUnlinkModal,
    setShowUnlinkModal,
    confirmUnlinkNote,
    reloadTask,
    editForm,
    setEditForm,
    handleUpdate,
    confirmDelete,
    handleTagsUpdate,
    handleRemoveTag
  };
};
