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
      alert('Error al eliminar la tarea');
      setIsDeleting(false);
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
    editForm,
    setEditForm,
    handleUpdate,
    confirmDelete
  };
};
