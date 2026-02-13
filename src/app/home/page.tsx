'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/services/auth.service';
import { Task, taskService } from '@/services/task.service';
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

export default function HomePage() {
  const router = useRouter();
  
  // State
  const [user] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (e) {
          console.error('Error parsing user data', e);
        }
      }
    }
    return null;
  });
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

  // Load Data
  const loadData = useCallback(async () => {
    try {
      
      const [tasksData, tagsData] = await Promise.all([
        taskService.getTasks({ is_completed: false }),
        tagsService.getTags()
      ]);
      
      setTasks(tasksData);
      setTags(tagsData);

      if (isFeatureEnabled('ENABLE_NOTES_VIEW')) {
        const notesData = await notesService.getNotes();
        setNotes(notesData.slice(0, 3)); // Only recent notes
      }

      if (isFeatureEnabled('ENABLE_EVENTS_VIEW')) {
        // For demo/simplicity, getting all events and filtering for today client-side
        // In a real app, you'd pass a date range to the API
        const eventsData = await eventsService.getEvents();
        const today = new Date().toISOString().split('T')[0];
        const todayEvents = eventsData.filter(e => e.start_time.startsWith(today));
        setEvents(todayEvents);
      }

    } catch (error) {
      console.error('Error loading home data:', error);
    }
  }, []);

  useEffect(() => {
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
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto">
            <HomeHeader 
              userName={user?.full_name || 'Usuario'}
              pendingTasksCount={tasks.length}
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
