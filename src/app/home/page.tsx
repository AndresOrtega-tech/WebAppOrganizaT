'use client';

import { useEffect, useState, useCallback } from 'react';
import { User } from '@/services/auth.service';
import { Task, taskService, TaskFilters as TaskFiltersParams } from '@/services/task.service';
import { apiClient } from '@/services/api.client';
import TaskCard from '@/components/TaskCard';
import CreateTaskModal from '@/components/CreateTaskModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import TagsSidebar from '@/components/TagsSidebar';
import TaskFilters from '@/components/TaskFilters';
import ThemeToggle from '@/components/ThemeToggle';
import { Plus, User as UserIcon, Loader2, StickyNote, CalendarDays } from 'lucide-react';
import { isFeatureEnabled } from '@/config/features';
import Link from 'next/link';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const DEFAULT_FILTERS: TaskFiltersParams = {
    is_completed: false,
    sort_by: 'due_date',
    order: 'asc',
    show_overdue: true
  };

  const [filters, setFilters] = useState<TaskFiltersParams>(DEFAULT_FILTERS);
  const [activeContextMenuTaskId, setActiveContextMenuTaskId] = useState<string | null>(null);

  const loadTasks = useCallback(async (currentFilters: TaskFiltersParams) => {
    try {
      setLoading(true);
      const data = await taskService.getTasks(currentFilters);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
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
    
    loadTasks(filters);
  }, [filters, loadTasks]);

  const handleFiltersChange = useCallback((newFilters: TaskFiltersParams) => {
    setFilters(newFilters);
  }, []);

  const handleTaskCreated = () => {
    // Reload tasks to respect current sort/filter order from backend
    loadTasks(filters);
  };

  const handleLogout = () => {
    apiClient.logout();
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    if (!isFeatureEnabled('ENABLE_TASK_CONTEXT_MENU')) return;
    setActiveContextMenuTaskId(task.id);
  }, []);

  const handleContextMenuUpdate = () => {
    loadTasks(filters);
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      setIsDeleting(true);
      await taskService.deleteTask(taskToDelete);
      const updatedTasks = tasks.filter((t) => t.id !== taskToDelete);
      setTasks(updatedTasks);
      setTaskToDelete(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Error al eliminar la tarea');
    } finally {
      setIsDeleting(false);
    }
  };

  const pendingCount = tasks.filter(t => !t.is_completed).length;
  const completedCount = tasks.filter(t => t.is_completed).length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
        {/* Navbar */}
        <nav className="bg-white dark:bg-gray-900 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm dark:shadow-gray-800/50 dark:border-b dark:border-gray-800 transition-colors duration-200">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">OrganizaT</h1>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                {isFeatureEnabled('ENABLE_NOTES_VIEW') && (
                    <Link
                        href="/notes"
                        className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-3 py-2 rounded-xl text-sm font-bold hover:bg-yellow-100 dark:hover:bg-yellow-900/50 transition-colors flex items-center gap-2"
                        title="Mis Notas"
                    >
                        <StickyNote className="w-4 h-4" />
                        <span className="hidden sm:inline">Notas</span>
                    </Link>
                )}
                {isFeatureEnabled('ENABLE_EVENTS_VIEW') && (
                    <Link
                        href="/events"
                        className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-xl text-sm font-bold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-2"
                        title="Mis Eventos"
                    >
                        <CalendarDays className="w-4 h-4" />
                        <span className="hidden sm:inline">Eventos</span>
                    </Link>
                )}
                {isFeatureEnabled('ENABLE_USER_PROFILE') && (
                    <Link
                        href="/profile"
                        className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Mi Perfil"
                    >
                        <UserIcon className="w-5 h-5" />
                    </Link>
                )}
                <button 
                    onClick={handleLogout}
                    className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                    Salir
                </button>
            </div>
        </nav>

        <main className="px-6 py-8 max-w-5xl mx-auto">
            {/* Greeting */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                    Hola, {user.avatar || user.full_name.split(' ')[0]} 👋
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium transition-colors">
                    Aquí tienes el resumen de tus tareas para hoy.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Sidebar */}
                {isFeatureEnabled('ENABLE_TAGS_VIEW') && (
                    <aside className="w-full md:w-auto shrink-0 sticky top-24">
                        <TagsSidebar />
                    </aside>
                )}

                {/* Main Content */}
                <div className="flex-1 w-full max-w-md mx-auto md:max-w-none">
                    {/* Stats */}
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors">Estado de Tareas</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm dark:shadow-none transition-colors">
                                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2 transition-colors">{pendingCount}</span>
                                <span className="text-sm font-semibold text-blue-900/70 dark:text-blue-300 transition-colors">Pendientes</span>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm dark:shadow-none transition-colors">
                                <span className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2 transition-colors">{completedCount}</span>
                                <span className="text-sm font-semibold text-green-900/70 dark:text-green-300 transition-colors">Completadas</span>
                            </div>
                        </div>
                    </div>

                    {/* Task List */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 transition-colors">Próximas Tareas</h3>
                        
                        {isFeatureEnabled('ENABLE_TASK_FILTERS') && (
                            <div className="mb-6">
                                <TaskFilters onFiltersChange={handleFiltersChange} initialFilters={DEFAULT_FILTERS} />
                            </div>
                        )}

                        <div className="space-y-4 relative min-h-[200px]">
                            {loading && tasks.length > 0 && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl transition-all duration-300">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                                </div>
                            )}

                            {loading && tasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
                                    <span>Cargando tareas...</span>
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl shadow-sm dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors">
                                    <p className="text-gray-400 font-medium">No se encontraron tareas</p>
                                    <p className="text-gray-300 dark:text-gray-600 text-sm mt-1">Prueba con otros filtros</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {tasks.map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            onDelete={() => handleDeleteTask(task.id)}
                                            onContextMenu={handleContextMenu}
                                            isContextMenuOpen={activeContextMenuTaskId === task.id}
                                            onMenuClose={() => setActiveContextMenuTaskId(null)}
                                            onUpdate={handleContextMenuUpdate}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>

        {/* Floating Action Button */}
            {isFeatureEnabled('ENABLE_TASK_CREATION') && (
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 z-40"
                >
                    <Plus className="w-5 h-5" />
                    <span>Agregar Tarea</span>
                </button>
            )}

            {isFeatureEnabled('ENABLE_TASK_CREATION') && (
                <CreateTaskModal 
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onTaskCreated={handleTaskCreated}
                />
            )}

        <ConfirmationModal
            isOpen={!!taskToDelete}
            onClose={() => setTaskToDelete(null)}
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
