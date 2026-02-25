import { useRouter } from 'next/navigation';
import { Task } from '@/services/task.service';
import {
  Circle,
  CheckCircle2,
  Tag as TagIcon
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskListProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  origin?: 'home' | 'tasks';
}

export default function TaskList({ tasks, onComplete, origin }: TaskListProps) {
  const router = useRouter();

  const formatGroupHeader = (dateString: string) => {
    if (dateString === 'sin-fecha') return 'Sin fecha';

    // Create date using local timezone to avoid shifting
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow =
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();

    const dayMonth = date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    });

    const weekday = date.toLocaleDateString('es-MX', { weekday: 'short' });

    if (isToday) return `Hoy • ${weekday}, ${dayMonth}`;
    if (isTomorrow) return `Mañana • ${weekday}, ${dayMonth}`;

    return `${weekday}, ${dayMonth}`;
  };

  const groupedTasks = tasks.reduce((acc, task) => {
    const key = task.due_date ? task.due_date.split('T')[0] : 'sin-fecha';
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const sortedDates = Object.keys(groupedTasks).sort((a, b) => {
    if (a === 'sin-fecha') return 1;
    if (b === 'sin-fecha') return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {tasks.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
          <p className="text-gray-400 text-sm">No tienes tareas para esta semana 🎉</p>
        </div>
      ) : (
        sortedDates.map(dateKey => {
          const groupTasks = groupedTasks[dateKey];
          const headerText = formatGroupHeader(dateKey);

          return (
            <div key={dateKey} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 px-1 pt-2">
                {headerText}
              </h3>
              <div className="space-y-2">
                {groupTasks.map(task => {
                  const isCompleted = task.is_completed;

                  return (
                    <div
                      key={task.id}
                      onClick={() => {
                        const search = origin ? `?from=${origin}` : '';
                        router.push(`/tasks/${task.id}${search}`);
                      }}
                      className="group bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all duration-200 flex gap-4 items-start cursor-pointer"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onComplete(task.id);
                        }}
                        className={`mt-1 flex-shrink-0 transition-colors ${isCompleted
                          ? 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300'
                          : 'text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                          }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : (
                          <Circle className="w-6 h-6" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold truncate ${isCompleted ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                          {task.title}
                        </h3>
                        {task.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 prose prose-xs dark:prose-invert">
                            {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ p: ({ node: _node, ...props }) => <span {...props} /> }}>
                              {task.description}
                            </ReactMarkdown>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-3">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border ${task.priority === 'alta'
                              ? 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 border-red-100 dark:border-red-800'
                              : task.priority === 'media'
                                ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-100 dark:border-yellow-800'
                                : 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 border-green-100 dark:border-green-800'
                              }`}
                          >
                            {task.priority}
                          </span>

                          {task.tags?.slice(0, 2).map(tag => (
                            <span
                              key={tag.id}
                              className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-md border"
                              style={{
                                color: tag.color,
                                backgroundColor: tag.color + '10',
                                borderColor: tag.color + '30'
                              }}
                            >
                              <TagIcon className="w-3 h-3" />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
