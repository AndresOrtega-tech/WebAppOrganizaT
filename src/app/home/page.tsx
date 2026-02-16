'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/services/auth.service';
import { Task, taskService, TaskPriority } from '@/services/task.service';
import { Note, notesService } from '@/services/notes.service';
import { Event, eventsService } from '@/services/events.service';
import { Tag, tagsService } from '@/services/tags.service';
import { apiClient } from '@/services/api.client';
import { isFeatureEnabled } from '@/config/features';

import HomeSidebar from '@/components/Home/HomeSidebar';
import HomeHeader from '@/components/Home/HomeHeader';
import TaskList from '@/components/Home/TaskList';
import RecentNotes from '@/components/Home/RecentNotes';
import TodayEvents from '@/components/Home/TodayEvents';
import CreateItemModal from '@/components/CreateItemModal';

const sortDashboardTasks = (tasks: Task[]): Task[] => {
  const priorityOrder: { [key in TaskPriority]: number } = {
    alta: 0,
    media: 1,
    baja: 2,
  };

  return [...tasks].sort((a, b) => {
    const dateA = a.due_date ? a.due_date.split('T')[0] : '';
    const dateB = b.due_date ? b.due_date.split('T')[0] : '';

    if (dateA !== dateB) {
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.localeCompare(dateB);
    }

    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    const updatedA = new Date(a.updated_at).getTime();
    const updatedB = new Date(b.updated_at).getTime();
    if (updatedA === updatedB) return 0;
    return updatedB - updatedA;
  });
};

export default function HomePage() {
  const router = useRouter();
  
  // State
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };
    
    // Set initial state
    handleResize();
  }, []);
  
  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<'task' | 'note' | 'event' | 'tag'>('task');

  // Load User
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const today = new Date();
      const end = new Date(today);
      end.setDate(end.getDate() + 7);

      const startDateIso = today.toISOString();
      const endDateIso = end.toISOString();

      const startDate = startDateIso.split('T')[0];
      const endDate = endDateIso.split('T')[0];

      const [tasksData, tagsData] = await Promise.all([
        taskService.getTasks({
          is_completed: false,
          start_date: startDateIso,
          end_date: endDateIso,
          date_field: 'due_date',
        }),
        tagsService.getTags(),
      ]);

      const rangedTasks = tasksData.filter((task) => {
        if (!task.due_date) return false;
        const taskDate = task.due_date.split('T')[0];
        return taskDate >= startDate && taskDate <= endDate;
      });

      const sortedTasks = sortDashboardTasks(rangedTasks);

      setTasks(sortedTasks);
      setTags(tagsData);

      if (isFeatureEnabled('ENABLE_NOTES_VIEW')) {
        const notesData = await notesService.getNotes();
        setNotes(notesData.slice(0, 3)); // Only recent notes
      }

      if (isFeatureEnabled('ENABLE_EVENTS_VIEW')) {
        const todayLocal = new Date().toLocaleDateString('sv'); // YYYY-MM-DD (local)
        let eventsData = await eventsService.getEvents({ start_date: todayLocal });
        if (!Array.isArray(eventsData) || eventsData.length === 0) {
          // Fallback: fetch all and filter by local date to avoid backend TZ mismatches
          const allEvents = await eventsService.getEvents();
          eventsData = allEvents.filter(e => {
            if (!e.start_time) return false;
            const localDate = new Date(e.start_time).toLocaleDateString('sv');
            return localDate === todayLocal;
          });
        }
        setEvents(eventsData);
      }

    } catch (error) {
      console.error('Error loading home data:', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Handlers
  const handleLogout = () => {
    apiClient.logout();
    router.push('/login');
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await taskService.updateTask(taskId, { is_completed: !task.is_completed });
        loadData();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleCreateClick = (type: 'task' | 'note' | 'event' | 'tag') => {
    setCreateModalTab(type);
    setIsCreateModalOpen(true);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingTodayCount = tasks.filter((task) => {
    if (task.is_completed) return false;
    if (!task.due_date) return false;
    return task.due_date.startsWith(todayStr);
  }).length;

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
          <div className="max-w-7xl mx-auto">
            <HomeHeader 
              userName={user?.full_name || 'Usuario'}
              pendingTasksCount={pendingTodayCount}
              onNewItemClick={handleCreateClick}
              onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Tasks */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tareas</h2>
                  <TaskList 
                    tasks={tasks} 
                    onComplete={handleTaskComplete} 
                  />
                </div>
              </div>

              {/* Right Column: Notes & Events */}
              <div className="space-y-8">
                {isFeatureEnabled('ENABLE_NOTES_VIEW') && (
                  <RecentNotes notes={notes} />
                )}
                
                {isFeatureEnabled('ENABLE_EVENTS_VIEW') && (
                  <TodayEvents events={events} />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <CreateItemModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          loadData();
          setIsCreateModalOpen(false);
        }}
        initialTab={createModalTab}
      />
    </div>
  );
}
