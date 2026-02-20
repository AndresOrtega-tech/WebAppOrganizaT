import { CheckCircle2, Circle, Trash, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Task } from '@/services/task.service';
import { isFeatureEnabled } from '@/config/features';
import TaskContextMenu from './TaskContextMenu';

interface TaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task) => void;
  isContextMenuOpen?: boolean;
  onMenuClose?: () => void;
  onUpdate?: () => void;
}

export default function TaskCard({ 
  task, 
  onDelete, 
  onContextMenu,
  isContextMenuOpen,
  onMenuClose,
  onUpdate
}: TaskCardProps) {
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

  const isOverdue = !task.is_completed && task.due_date && task.due_date < new Date().toLocaleDateString('sv');

  const content = (
    <div 
      className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 flex items-center gap-4 group-hover:shadow-md dark:group-hover:shadow-gray-700 transition-all duration-200"
      onContextMenu={(e) => onContextMenu && onContextMenu(e, task)}
    >
        <div className="flex-shrink-0">
          {task.is_completed ? (
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          ) : (
            <Circle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-base font-bold text-gray-900 dark:text-white truncate ${task.is_completed ? 'line-through text-gray-400 dark:text-gray-600' : ''}`}>
              {task.title}
            </h4>
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border shrink-0 ${
              task.priority === 'alta' ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 border-red-100 dark:border-red-800' :
              task.priority === 'media' ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800' :
              'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 border-green-100 dark:border-green-800'
            }`}>
              {task.priority}
            </span>
          </div>
          {task.due_date && (
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-xs font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                {formatDate(task.due_date)}
              </p>
              {isOverdue && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-800">
                  <AlertTriangle className="w-3 h-3" />
                  Atrasada
                </span>
              )}
            </div>
          )}
          {task.description && (
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({node: _node, ...props}) => <p className="mb-0" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                  ul: ({node: _node, ...props}) => <ul className="list-disc list-inside ml-1" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                  ol: ({node: _node, ...props}) => <ol className="list-decimal list-inside ml-1" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                  li: ({node: _node, ...props}) => <li className="marker:text-gray-400" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                  h1: ({node: _node, ...props}) => <strong className="font-bold" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                  h2: ({node: _node, ...props}) => <strong className="font-bold" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                  h3: ({node: _node, ...props}) => <strong className="font-bold" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                  strong: ({node: _node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                }}
              >
                {task.description}
              </ReactMarkdown>
            </div>
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
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            title="Eliminar tarea"
          >
            <Trash className="w-4 h-4" />
          </button>
        )}
      </div>
  );

  const card = isFeatureEnabled('ENABLE_TASK_DETAIL') ? (
    <Link href={`/tasks/${task.id}`} className="block group">
      {content}
    </Link>
  ) : (
    <div className="block group">
      {content}
    </div>
  );

  return (
    <div className={`relative ${isContextMenuOpen ? 'z-20' : ''}`}>
      {card}
      {isContextMenuOpen && onMenuClose && onUpdate && (
        <TaskContextMenu 
          task={task} 
          onClose={onMenuClose} 
          onUpdate={onUpdate} 
        />
      )}
    </div>
  );
}
