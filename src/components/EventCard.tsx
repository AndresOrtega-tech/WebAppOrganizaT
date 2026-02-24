import Link from 'next/link';
import { CalendarDays, MapPin, Bell } from 'lucide-react';
import { Event } from '@/services/events.service';


interface EventCardProps {
  event: Event;
}

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDay = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function EventCard({ event }: EventCardProps) {
  const CardContent = (
    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 transition-all duration-200 flex flex-col gap-4 h-full hover:shadow-md dark:hover:shadow-gray-700 cursor-pointer">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 w-full">
          <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
            {event.title}
          </h4>
          <div className="h-10 mt-1">
            {event.description ? (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {event.description}
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                Sin descripción
              </p>
            )}
          </div>
        </div>
        {event.is_all_day && (
          <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">
            Todo el día
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300 mt-auto">
        <div className="flex items-start gap-2">
          <CalendarDays className="w-4 h-4 mt-0.5 text-purple-500" />
          <div className="flex flex-col">
            {event.is_all_day ? (
              <span className="font-medium">{formatDay(event.start_time)}</span>
            ) : (
              <>
                <span className="font-medium">{formatDateTime(event.start_time)}</span>
                <span className="text-gray-500 dark:text-gray-400">{formatDateTime(event.end_time)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-purple-500" />
          <span>{event.location || 'Sin ubicación'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-500" />
          <span>{event.has_reminder ? `${event.reminders_data.length} recordatorios` : 'Sin recordatorios'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Link href={`/events/${event.id}`} className="block h-full">
      {CardContent}
    </Link>
  );
}
