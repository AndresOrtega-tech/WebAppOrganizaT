'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/services/auth.service';
import { Task, taskService } from '@/services/task.service';
import TaskCard from '@/components/TaskCard';
import CreateTaskModal from '@/components/CreateTaskModal';
import { Plus } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      loadTasks(token);
    } catch (e) {
      console.error('Error parsing user data', e);
      router.push('/login');
    }
  }, [router]);

  const loadTasks = async (token: string) => {
    try {
      const data = await taskService.getTasks(token);
      setTasks(data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      if (error instanceof Error && error.message === 'Unauthorized') {
         handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    router.push('/login');
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prevTasks) => [newTask, ...prevTasks]);
  };

  const pendingCount = tasks.filter(t => !t.is_completed).length;
  const completedCount = tasks.filter(t => t.is_completed).length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
        {/* Navbar */}
        <nav className="bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <h1 className="text-2xl font-bold text-indigo-600 tracking-tight">OrganizaT</h1>
            <button 
                onClick={handleLogout}
                className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
            >
                Salir
            </button>
        </nav>

        <main className="px-6 py-8 max-w-md mx-auto">
            {/* Greeting */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900">
                    Hola, {user.full_name.split(' ')[0]} 👋
                </h2>
                <p className="text-gray-500 mt-2 text-sm font-medium">
                    Aquí tienes el resumen de tus tareas para hoy.
                </p>
            </div>

            {/* Stats */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Estado de Tareas</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-4xl font-bold text-blue-600 mb-2">{pendingCount}</span>
                        <span className="text-sm font-semibold text-blue-900/70">Pendientes</span>
                    </div>
                    <div className="bg-green-50 p-6 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-4xl font-bold text-green-600 mb-2">{completedCount}</span>
                        <span className="text-sm font-semibold text-green-900/70">Completadas</span>
                    </div>
                </div>
            </div>

            {/* Task List */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Próximas Tareas</h3>
                <div className="space-y-4">
                    {loading ? (
                         <div className="text-center py-10 text-gray-500 font-medium">Cargando tareas...</div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-sm font-medium">
                            No tienes tareas pendientes 🎉
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                        ))
                    )}
                </div>
            </div>
        </main>

        {/* Floating Action Button */}
        <button
            onClick={() => setIsCreateModalOpen(true)}
            className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 z-40"
        >
            <Plus className="w-5 h-5" />
            <span>Agregar Tarea</span>
        </button>

        <CreateTaskModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onTaskCreated={handleTaskCreated}
        />
    </div>
  );
}
