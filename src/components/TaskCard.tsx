import { CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { Task } from '@/services/task.service';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if it's today
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();
    
    const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
    
    if (isToday) {
      return `Hoy, ${timeStr}`;
    }
    
    // Format: "Ene 28, 14:00 PM"
    return `${date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  return (
    <Link href={`/tasks/${task.id}`} className="block group">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 group-hover:shadow-md transition-all duration-200">
        <div className="flex-shrink-0">
          {task.is_completed ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : (
            <Circle className="w-6 h-6 text-indigo-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`text-base font-bold text-gray-900 truncate ${task.is_completed ? 'line-through text-gray-400' : ''}`}>
            {task.title}
          </h4>
          {task.due_date && (
            <p className="text-xs text-gray-500 mt-1 font-semibold">
              {formatDate(task.due_date)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
