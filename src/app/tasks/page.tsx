'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/services/auth.service';
import { Task, taskService, TaskFilters as TaskFiltersParams } from '@/services/task.service';
import { Tag, tagsService } from '@/services/tags.service';
import { apiClient } from '@/services/api.client';

import HomeSidebar from '@/components/Home/HomeSidebar';
import HomeHeader from '@/components/Home/HomeHeader';
import TaskStats from '@/components/Home/TaskStats';
import TaskList from '@/components/Home/TaskList';
import TasksFilterBar from '@/components/Home/TasksFilterBar';
import TaskFilters from '@/components/TaskFilters';
import CreateItemModal from '@/components/CreateItemModal';

export default function TasksPage() {
  const router = useRouter();
  
  // State
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const DEFAULT_FILTERS: TaskFiltersParams = {
    is_completed: false,
    sort_by: 'due_date',
    order: 'asc'
  };

  const [filters, setFilters] = useState<TaskFiltersParams>(DEFAULT_FILTERS);
  
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<'task' | 'note' | 'event' | 'tag'>('task');

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
  }, []);

  // Load User
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

  // Load Data
  const loadTasks = useCallback(async (currentFilters: TaskFiltersParams) => {
    try {
      setIsLoadingTasks(true);
      const data = await taskService.getTasks(currentFilters);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setIsLoadingTasks(false);
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
    loadTasks(filters);
    loadTags();
  }, [filters, loadTasks, loadTags]);

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
        loadTasks(filters);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleFiltersChange = (newFilters: TaskFiltersParams) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const activeFiltersCount = [
    filters.is_completed !== DEFAULT_FILTERS.is_completed,
    filters.tag_ids && filters.tag_ids.length > 0,
    filters.sort_by !== DEFAULT_FILTERS.sort_by,
    filters.due_date !== undefined
  ].filter(Boolean).length;

  // Stats
  const pendingCount = tasks.filter(t => !t.is_completed).length;
  const completedCount = tasks.filter(t => t.is_completed).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <div className="flex">
        {/* Sidebar */}
        <HomeSidebar 
          tags={tags} 
          user={user} 
          onLogout={handleLogout} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto space-y-8">
            <HomeHeader 
              userName={user?.full_name || 'Usuario'}
              pendingTasksCount={pendingCount}
              onNewItemClick={handleCreateClick}
              onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              createButtonLabel="Nueva Tarea"
            />

            {/* Stats */}
            <div>
               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Estado de Tareas</h2>
               <TaskStats pendingCount={pendingCount} completedCount={completedCount} isLoading={isLoadingTasks} />
            </div>

            {/* Tasks Section */}
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 min-h-[400px]">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Próximas Tareas</h2>
                
                <TasksFilterBar 
                  activeFiltersCount={activeFiltersCount}
                  onOpenFilters={() => setIsFiltersOpen(!isFiltersOpen)}
                  onClearFilters={handleClearFilters}
                  hasActiveFilters={activeFiltersCount > 0}
                />

                {isFiltersOpen && (
                  <div className="mb-6 animate-in fade-in slide-in-from-top-2">
                    <TaskFilters 
                      onFiltersChange={handleFiltersChange}
                      initialFilters={filters}
                      isOpen={true}
                      hideHeader={true}
                      className="!bg-gray-50 dark:!bg-gray-800/50 !border-gray-200 dark:!border-gray-700"
                    />
                  </div>
                )}
              </div>

              <TaskList 
                tasks={tasks} 
                onComplete={handleTaskComplete} 
              />
            </div>
          </div>
        </main>
      </div>

      <CreateItemModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          loadTasks(filters);
          loadTags();
          setIsCreateModalOpen(false);
        }}
        initialTab={createModalTab}
        disableTabs={true}
      />
    </div>
  );
}
