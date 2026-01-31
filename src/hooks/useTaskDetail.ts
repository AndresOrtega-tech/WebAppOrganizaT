import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Task, taskService } from '@/services/task.service';

export interface EditFormState {
  title: string;
  description: string;
  due_date: string;
  is_completed: boolean;
  has_reminder: boolean;
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
  const [editForm, setEditForm] = useState<EditFormState>({
    title: '',
    description: '',
    due_date: '',
    is_completed: false,
    has_reminder: false
  });

  const getLocalDateTimeForInput = (isoString: string) => {
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  const loadTask = useCallback(async (token: string, id: string) => {
    try {
      setLoading(true);
      const data = await taskService.getTaskById(token, id);
      setTask(data);
    } catch (err) {
      console.error('Error loading task:', err);
      setError('No se pudo cargar la tarea.');
      if (err instanceof Error && err.message === 'Unauthorized') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (taskId) {
      loadTask(token, taskId);
    }
  }, [taskId, router, loadTask]);

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date ? getLocalDateTimeForInput(task.due_date) : '',
        is_completed: task.is_completed,
        has_reminder: task.has_reminder
      });
    }
  }, [task]);

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!task) return;
    
    try {
      setIsSaving(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
          router.push('/login');
          return;
      }

      const updatedTask = await taskService.updateTask(token, task.id, {
          ...editForm,
          due_date: editForm.due_date ? new Date(editForm.due_date).toISOString() : null
      });
      
      setTask(updatedTask);
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating task:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }
      alert('Error al actualizar la tarea');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!task) return;

    try {
      setIsDeleting(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      await taskService.deleteTask(token, task.id);
      router.push('/home');
    } catch (err) {
      console.error('Error deleting task:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }
      alert('Error al eliminar la tarea');
      setIsDeleting(false);
    }
  };

  const handleTagsUpdate = async (tagIds: string[]) => {
    if (!task) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Calculate diffs
      const currentTagIds = task.tags.map(t => t.id);
      const tagsToAdd = tagIds.filter(id => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter(id => !tagIds.includes(id));

      // 1. Add new tags (if any)
      if (tagsToAdd.length > 0) {
        await taskService.assignTagsToTask(token, task.id, tagsToAdd);
      }

      // 2. Remove unselected tags (if any)
      if (tagsToRemove.length > 0) {
        // Execute sequentially to avoid race conditions or backend overload
        for (const tagId of tagsToRemove) {
          await taskService.removeTagFromTask(token, task.id, tagId);
        }
      }
      
      // Reload task to get updated tags
      await loadTask(token, task.id);
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
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
        return;
      }

      // Optimistic update
      const updatedTags = task.tags.filter(t => t.id !== tagId);
      setTask({ ...task, tags: updatedTags });

      await taskService.removeTagFromTask(token, task.id, tagId);
    } catch (err) {
      console.error('Error removing tag:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }
      alert('Error al eliminar la etiqueta de la tarea');
      // Revert optimistic update
      const token = localStorage.getItem('access_token');
      if (token) loadTask(token, task.id);
    }
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
    editForm,
    setEditForm,
    handleUpdate,
    confirmDelete,
    handleTagsUpdate,
    handleRemoveTag
  };
};
