'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/services/auth.service';
import { Task, taskService, TaskFilters as TaskFiltersParams } from '@/services/task.service';
import { Tag, tagsService } from '@/services/tags.service';
import { apiClient } from '@/services/api.client';

import HomeSidebar from '@/components/Home/HomeSidebar';
import HomeHeader from '@/components/Home/HomeHeader';
import TaskList from '@/components/Home/TaskList';
import CreateItemModal from '@/components/CreateItemModal';

export default function TasksPage() {
  const router = useRouter();
  
  // State
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentTab, setCurrentTab] = useState<'pending' | 'completed'>('pending');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('sidebar_open');
    if (stored !== null) {
      return stored === 'true';
    }
    return window.innerWidth >= 768;
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<'task' | 'note' | 'event' | 'tag'>('task');

  const setSidebarOpen = (open: boolean) => {
    setIsSidebarOpen(open);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('sidebar_open', String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Load User
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) return;
    try {
      const parsed = JSON.parse(userData) as User;
      queueMicrotask(() => setUser(parsed));
    } catch (e) {
      console.error('Error parsing user data', e);
    }
  }, []);

  // Load Data
  const loadTasks = useCallback(async (tab: 'pending' | 'completed') => {
    try {
      const result = await taskService.getTasks({
        view: 'tasks',
        limit: 5,
        tab,
      });
      setTasks(result.tasks);
      setNextCursor(result.next_cursor ?? null);
      setHasMore(Boolean(result.has_more));
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, []);

  const loadMoreTasks = useCallback(async () => {
    if (!hasMore || !nextCursor) return;

    try {
      setIsLoadingMore(true);

      const result = await taskService.getTasks({
        view: 'tasks',
        limit: 5,
        cursor: nextCursor,
        tab: currentTab,
      });

      setTasks(prev => [...prev, ...result.tasks]);
      setNextCursor(result.next_cursor ?? null);
      setHasMore(Boolean(result.has_more));
    } catch (error) {
      console.error('Error loading more tasks:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentTab, hasMore, nextCursor]);

  const loadTags = useCallback(async () => {
    try {
      const data = await tagsService.getTags();
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.all([loadTasks(currentTab), loadTags()]);
    })();
  }, [currentTab, loadTasks, loadTags]);

  // Handlers
  const handleLogout = () => {
    apiClient.logout();
    router.push('/login');
  };

  const handleCreateClick = (tab: 'task' | 'note' | 'event' | 'tag' = 'task') => {
    setCreateModalTab(tab);
    setIsCreateModalOpen(true);
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await taskService.updateTask(taskId, { is_completed: !task.is_completed });
        await loadTasks(currentTab);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

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
        <main className="flex-1 p-4 md:p-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto space-y-8">
              <HomeHeader 
                userName={user?.full_name || 'Usuario'}
                pendingTasksCount={tasks.filter(t => !t.is_completed).length}
                completedTasksCount={tasks.filter(t => t.is_completed).length}
                onNewItemClick={handleCreateClick}
                onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
                createButtonLabel="Nueva Tarea"
              />

            {/* Tasks Section */}
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 min-h-[400px]">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Próximas Tareas</h2>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setCurrentTab('pending')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentTab === 'pending'
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Pendientes
                  </button>
                  <button
                    onClick={() => setCurrentTab('completed')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      currentTab === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Completadas
                  </button>
                </div>
              </div>

              <TaskList 
                tasks={tasks} 
                onComplete={handleTaskComplete}
                origin="tasks"
              />

              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={loadMoreTasks}
                    disabled={isLoadingMore}
                    className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoadingMore ? 'Cargando más...' : 'Cargar más'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <CreateItemModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          loadTasks(currentTab);
          loadTags();
          setIsCreateModalOpen(false);
        }}
        initialTab={createModalTab}
        disableTabs={true}
      />
    </div>
  );
}
