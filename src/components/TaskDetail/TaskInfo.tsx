import { Calendar, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Task } from '@/services/task.service';
import StatusBadge from '@/components/StatusBadge';
import TagList from '@/components/TagList';

interface TaskInfoProps {
  task: Task;
  onRemoveTag?: (tagId: string) => void;
}

export default function TaskInfo({ task, onRemoveTag }: TaskInfoProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        
        {/* Status Banner */}
        <StatusBadge isCompleted={task.is_completed} />

        <div className="p-6 space-y-8">
          {/* Title & Description */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{task.title}</h2>
            <div className="text-gray-600 dark:text-gray-300 leading-relaxed prose prose-lg max-w-none dark:prose-invert">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({node, ...props}) => <a className="text-indigo-600 dark:text-indigo-400 hover:underline" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal list-inside" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                }}
              >
                {task.description || 'Sin descripción'}
              </ReactMarkdown>
            </div>
          </div>

          {/* Meta Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Due Date */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Fecha de vencimiento</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(task.due_date)}</p>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Creada el</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(task.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <TagList tags={task.tags} onRemoveTag={onRemoveTag} />
        </div>
      </div>
    </main>
  );
}
