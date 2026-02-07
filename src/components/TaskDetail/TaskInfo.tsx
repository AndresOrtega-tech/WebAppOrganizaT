import { Calendar, Clock, Bell, Flag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Task } from '@/services/task.service';
import StatusBadge from '@/components/StatusBadge';
import TagList from '@/components/TagList';
import LinkedItemsList from '@/components/LinkedItemsList';

interface TaskInfoProps {
  task: Task;
  onRemoveTag?: (tagId: string) => void;
  onLinkNote: () => void;
  onUnlinkNote: (noteId: string) => void;
  isLinkingEnabled?: boolean;
}

export default function TaskInfo({ task, onRemoveTag, onLinkNote, onUnlinkNote, isLinkingEnabled = true }: TaskInfoProps) {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'media': return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'baja': return 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    }
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

            {/* Priority */}
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${getPriorityColor(task.priority)}`}>
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Prioridad</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{task.priority}</p>
              </div>
            </div>

            {/* Reminders */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Recordatorios</p>
                {task.reminders_data && task.reminders_data.length > 0 ? (
                  <div className="flex flex-col gap-1 mt-0.5">
                    {task.reminders_data.map((r, idx) => (
                      <p key={idx} className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(r.remind_at)}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Sin recordatorios</p>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <TagList tags={task.tags} onRemoveTag={onRemoveTag} />

          {/* Linked Notes */}
          {isLinkingEnabled && (
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <LinkedItemsList 
                items={task.notes || []} 
                type="note" 
                onLinkNew={onLinkNote}
                onUnlink={onUnlinkNote}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
