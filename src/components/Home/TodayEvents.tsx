import { Event } from '@/services/events.service';
import { Clock, MapPin } from 'lucide-react';

interface TodayEventsProps {
  events: Event[];
}

export default function TodayEvents({ events }: TodayEventsProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getEventColor = (id: string) => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Eventos de hoy</h2>
        <span className="text-xs text-gray-400">{events.length} eventos</span>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
             <div className="p-6 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                <p className="text-gray-400 text-xs">No tienes eventos para hoy</p>
            </div>
        ) : (
            events.map(event => (
            <div 
                key={event.id}
                className="flex bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all duration-200"
            >
                <div className="flex flex-col justify-center items-center pr-4 border-r border-gray-100 dark:border-gray-800 min-w-[70px]">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{formatTime(event.start_time)}</span>
                </div>
                <div className="pl-4 flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white truncate">{event.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        {event.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">{event.location}</span>
                            </div>
                        )}
                        {!event.location && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>30 min</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="w-1 rounded-full self-stretch ml-2" style={{ backgroundColor: getEventColor(event.id) }}></div>
            </div>
            ))
        )}
      </div>
    </div>
  );
}
