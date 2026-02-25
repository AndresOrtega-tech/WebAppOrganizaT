'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Loader2 } from 'lucide-react';

import HomeSidebar from '@/components/Home/HomeSidebar';
import HomeHeader from '@/components/Home/HomeHeader';
import CreateItemModal from '@/components/CreateItemModal';
import EventCard from '@/components/EventCard';
import DateTimePicker from '@/components/DateTimePicker';

import { apiClient } from '@/services/api.client';
import { Event, EventFilters, eventsService } from '@/services/events.service';
import { Tag, tagsService } from '@/services/tags.service';
import { User } from '@/services/auth.service';

export default function EventsPage() {
  const router = useRouter();

  // Data State
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('sidebar_open');
    if (stored !== null) return stored === 'true';
    return window.innerWidth >= 768;
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<'task' | 'note' | 'event' | 'tag'>('event');

  // Filters State
  const [filters, setFilters] = useState<EventFilters>({
    start_date: new Date().toLocaleDateString('sv')
  });
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

  // Persistence for Sidebar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('sidebar_open', String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Initial Load
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
        loadTags();
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Load events when filters change
  useEffect(() => {
    if (user) {
      loadEvents(filters);
    }
  }, [filters, user]);

  const loadEvents = async (currentFilters?: EventFilters) => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsService.getEvents(currentFilters);
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const data = await tagsService.getTags();
      setTags(data);
    } catch (err) {
      console.error('Error loading tags:', err);
    }
  };

  const handleLogout = () => {
    apiClient.logout();
    router.push('/login');
  };

  const handleCreateClick = (tab: 'task' | 'note' | 'event' | 'tag' = 'event') => {
    setCreateModalTab(tab);
    setIsCreateModalOpen(true);
  };

  const handleEventSaved = () => {
    setIsCreateModalOpen(false);
    loadEvents(filters);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] transition-colors duration-200">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <HomeSidebar
          tags={tags}
          user={user}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full space-y-8 pb-32">
            <HomeHeader
              userName={user.full_name || user.email}
              onNewItemClick={handleCreateClick}
              onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              createButtonLabel="Nuevo Evento"
              defaultTab="event"
            />

            {error && (
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 min-h-[400px]">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Mis Eventos 📅
                </h2>

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div className="space-y-1.5 w-full sm:w-auto">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">Desde</label>
                    <button
                      type="button"
                      onClick={() => setActivePicker('start')}
                      className="w-full sm:w-40 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white transition-all flex items-center justify-between shadow-sm"
                    >
                      <span>{filters.start_date || 'Seleccionar'}</span>
                    </button>
                  </div>
                  <div className="space-y-1.5 w-full sm:w-auto">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">Hasta</label>
                    <button
                      type="button"
                      onClick={() => setActivePicker('end')}
                      className="w-full sm:w-40 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white transition-all flex items-center justify-between shadow-sm"
                    >
                      <span>{filters.end_date || 'Seleccionar'}</span>
                    </button>
                  </div>

                  {(filters.start_date || filters.end_date) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilters({})}
                        className="px-4 py-2 mb-[1px] text-sm font-bold text-gray-500 hover:text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all shadow-sm"
                      >
                        Mostrar todo
                      </button>
                      {(filters.start_date !== new Date().toLocaleDateString('sv') || filters.end_date) && (
                        <button
                          onClick={() => setFilters({ start_date: new Date().toLocaleDateString('sv') })}
                          className="px-4 py-2 mb-[1px] text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl transition-all"
                        >
                          Hoy
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 dark:text-indigo-400 mb-3" />
                  <span>Cargando eventos...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center mb-4">
                    <CalendarDays className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sin Eventos</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                    No tienes reuniones ni eventos programados para este filtro.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {events.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <DateTimePicker
        isOpen={activePicker === 'start'}
        onClose={() => setActivePicker(null)}
        onSave={(date) => {
          const dateStr = new Date(date).toLocaleDateString('sv');
          setFilters(prev => ({ ...prev, start_date: dateStr }));
          setActivePicker(null);
        }}
        initialDate={filters.start_date}
        includeTime={false}
      />

      <DateTimePicker
        isOpen={activePicker === 'end'}
        onClose={() => setActivePicker(null)}
        onSave={(date) => {
          const dateStr = new Date(date).toLocaleDateString('sv');
          setFilters(prev => ({ ...prev, end_date: dateStr }));
          setActivePicker(null);
        }}
        initialDate={filters.end_date}
        includeTime={false}
      />

      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialTab={createModalTab}
        onCreated={handleEventSaved}
      />
    </div>
  );
}
