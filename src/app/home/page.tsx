'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/services/auth.service';
import { Task, taskService } from '@/services/task.service';
import { Note, notesService } from '@/services/notes.service';
import { Event, eventsService } from '@/services/events.service';
import { Tag, tagsService } from '@/services/tags.service';
import { apiClient } from '@/services/api.client';


import HomeSidebar from '@/components/Home/HomeSidebar';
import HomeHeader from '@/components/Home/HomeHeader';
import TaskList from '@/components/Home/TaskList';
import RecentNotes from '@/components/Home/RecentNotes';
import TodayEvents from '@/components/Home/TodayEvents';
import CreateItemModal from '@/components/CreateItemModal';

export default function HomePage() {
  const router = useRouter();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('sidebar_open');
    if (stored !== null) {
      return stored === 'true';
    }
    return window.innerWidth >= 768;
  });

  const setSidebarOpen = (open: boolean) => {
    setIsSidebarOpen(open);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('sidebar_open', String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<'task' | 'note' | 'event' | 'tag'>('task');

  // Load User
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData) as User;
        queueMicrotask(() => setUser(parsed));
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const [tasksResult, tagsData] = await Promise.all([
        taskService.getTasks({
          view: 'home',
          limit: 50,
        }),
        tagsService.getTags(),
      ]);

      // Con view='home' delegamos la priorización y orden al backend
      setTasks(tasksResult.tasks);
      setTags(tagsData);

      const notesData = await notesService.getNotes();
      setNotes(notesData.slice(0, 3)); // Only recent notes

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
          <div className="max-w-7xl mx-auto">
            <HomeHeader
              userName={user?.full_name || 'Usuario'}
              onNewItemClick={handleCreateClick}
              onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              defaultTab="task"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Tasks */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tareas</h2>
                  <TaskList
                    tasks={tasks}
                    onComplete={handleTaskComplete}
                    origin="home"
                  />
                </div>
              </div>

              {/* Right Column: Notes & Events */}
              <div className="space-y-8">
                <RecentNotes notes={notes} />

                <TodayEvents events={events} />
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
