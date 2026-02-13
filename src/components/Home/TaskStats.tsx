interface TaskStatsProps {
  pendingCount: number;
  completedCount: number;
  isLoading?: boolean;
}

export default function TaskStats({ pendingCount, completedCount, isLoading = false }: TaskStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Pendientes Card */}
        <div className="bg-[#111827] dark:bg-[#0B1120] rounded-3xl p-6 border border-gray-800 flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors" />
          {isLoading ? (
            <div className="h-10 w-10 bg-gray-800 rounded-lg animate-pulse" />
          ) : (
            <span className="text-4xl font-bold text-indigo-400">{pendingCount}</span>
          )}
          <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Pendientes</span>
        </div>

        {/* Completadas Card */}
        <div className="bg-[#111827] dark:bg-[#0B1120] rounded-3xl p-6 border border-gray-800 flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
          {isLoading ? (
            <div className="h-10 w-10 bg-gray-800 rounded-lg animate-pulse" />
          ) : (
            <span className="text-4xl font-bold text-emerald-400">{completedCount}</span>
          )}
          <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300 transition-colors">Completadas</span>
        </div>
      </div>
  );
}
