'use client';

 import { useEffect, useState } from 'react';
 import { useRouter } from 'next/navigation';
 import Link from 'next/link';
 import { CalendarDays, CheckSquare, StickyNote, User as UserIcon, Plus, Loader2 } from 'lucide-react';
 import ThemeToggle from '@/components/ThemeToggle';
 import EventModal from '@/components/EventModal';
 import { isFeatureEnabled } from '@/config/features';
 import { User } from '@/services/auth.service';
 import { Event, eventsService } from '@/services/events.service';
 import EventCard from '@/components/EventCard';

 export default function EventsPage() {
   const router = useRouter();
   const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

   useEffect(() => {
     if (!isFeatureEnabled('ENABLE_EVENTS_VIEW')) {
       router.push('/home');
       return;
     }

     const token = localStorage.getItem('access_token');
     const userData = localStorage.getItem('user');

     if (!token || !userData) {
       router.push('/login');
       return;
     }

    try {
      setUser(JSON.parse(userData));
      loadEvents(token);
    } catch (e) {
      console.error('Error parsing user data', e);
      router.push('/login');
    }
   }, [router]);

  const loadEvents = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsService.getEvents(token);
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
      if (err instanceof Error && err.message === 'Unauthorized') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
        router.push('/login');
        return;
      }
      setError('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

   const handleLogout = () => {
     localStorage.removeItem('access_token');
     localStorage.removeItem('user');
     localStorage.removeItem('refresh_token');
     router.push('/login');
   };

   if (!user) return null;

  const handleEventSaved = () => {
    setIsCreateModalOpen(false);
    const token = localStorage.getItem('access_token');
    if (token) {
      loadEvents(token);
    }
  };

   return (
     <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
       <nav className="bg-white dark:bg-gray-900 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm dark:shadow-gray-800/50 dark:border-b dark:border-gray-800 transition-colors duration-200">
         <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">OrganizaT</h1>
         <div className="flex items-center gap-2">
           <ThemeToggle />
           <Link
             href="/home"
             className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2"
             title="Mis Tareas"
           >
             <CheckSquare className="w-4 h-4" />
             <span className="hidden sm:inline">Tareas</span>
           </Link>
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
         <div className="mb-8">
           <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
             Mis Eventos 📅
           </h2>
           <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium transition-colors">
             Organiza tus reuniones, recordatorios y fechas importantes.
           </p>
         </div>

         {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 font-medium animate-pulse">
             <Loader2 className="w-8 h-8 animate-spin text-purple-400 mb-3" />
             <span>Cargando eventos...</span>
           </div>
         ) : error ? (
           <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 p-8 text-center">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No se pudieron cargar los eventos</h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm">{error}</p>
           </div>
         ) : events.length === 0 ? (
           <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 p-8 text-center">
             <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
               <CalendarDays className="w-6 h-6" />
             </div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No tienes eventos</h3>
             <p className="text-gray-500 dark:text-gray-400 text-sm">
               Crea tu primer evento para verlo aquí.
             </p>
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {events.map(event => (
               <EventCard key={event.id} event={event} />
             ))}
           </div>
         )}
       </main>

      {isFeatureEnabled('ENABLE_EVENT_CREATION') && (
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 z-40"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Evento</span>
        </button>
      )}

      <EventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventSaved={handleEventSaved}
      />
     </div>
   );
 }
