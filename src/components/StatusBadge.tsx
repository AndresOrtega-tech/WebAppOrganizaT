import { CheckCircle2, Circle } from 'lucide-react';

interface StatusBadgeProps {
  isCompleted: boolean;
}

export default function StatusBadge({ isCompleted }: StatusBadgeProps) {
  return (
    <div className={`px-6 py-4 flex items-center gap-3 ${isCompleted ? 'bg-green-50 border-b border-green-100' : 'bg-gray-50 border-b border-gray-100'}`}>
      {isCompleted ? (
        <>
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <span className="font-bold text-green-700">Completada</span>
        </>
      ) : (
        <>
          <Circle className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-indigo-700">Pendiente</span>
        </>
      )}
    </div>
  );
}
