import { CheckCircle2, Circle } from 'lucide-react';

interface StatusBadgeProps {
  isCompleted: boolean;
}

export default function StatusBadge({ isCompleted }: StatusBadgeProps) {
  return (
    <div className={`px-6 py-4 flex items-center gap-3 ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/30' : 'bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700/50'}`}>
      {isCompleted ? (
        <>
          <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          <span className="font-bold text-green-700 dark:text-green-400">Completada</span>
        </>
      ) : (
        <>
          <Circle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-indigo-700 dark:text-indigo-400">Pendiente</span>
        </>
      )}
    </div>
  );
}
