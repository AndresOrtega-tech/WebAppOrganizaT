import { CheckCircle2, Circle, Trash } from 'lucide-react';
import Link from 'next/link';
import { Task } from '@/services/task.service';
import { isFeatureEnabled } from '@/config/features';

interface TaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
}

export default function TaskCard({ task, onDelete }: TaskCardProps) {
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

  const content = (
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
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {task.tags.map(tag => (
                <span 
                  key={tag.id}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                  style={{ 
                    borderColor: tag.color + '40', // 25% opacity border
                    color: tag.color,
                    backgroundColor: tag.color + '10' // ~6% opacity bg (works if hex)
                  }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {onDelete && isFeatureEnabled('ENABLE_TASK_DELETION') && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete(task.id);
            }}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            title="Eliminar tarea"
          >
            <Trash className="w-4 h-4" />
          </button>
        )}
      </div>
  );

  if (isFeatureEnabled('ENABLE_TASK_DETAILS')) {
    return (
      <Link href={`/tasks/${task.id}`} className="block group">
        {content}
      </Link>
    );
  }

  return (
    <div className="block group">
      {content}
    </div>
  );
}
