'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Task, taskService } from '@/services/task.service';
import { ArrowLeft, Calendar, CheckCircle2, Circle, Clock, Tag as TagIcon } from 'lucide-react';
import Link from 'next/link';

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    if (id) {
      loadTask(token, id);
    }
  }, [id, router]);

  const loadTask = async (token: string, taskId: string) => {
    try {
      setLoading(true);
      const data = await taskService.getTaskById(token, taskId);
      setTask(data);
    } catch (err) {
      console.error('Error loading task:', err);
      setError('No se pudo cargar la tarea.');
      if (err instanceof Error && err.message === 'Unauthorized') {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-indigo-600 font-medium animate-pulse">Cargando detalles...</div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
        <div className="text-red-500 font-medium mb-4">{error || 'Tarea no encontrada'}</div>
        <Link 
          href="/home" 
          className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <nav className="bg-white px-6 py-4 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center">
          <Link href="/home" className="p-2 -ml-2 text-gray-600 hover:text-indigo-600 transition-colors rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="ml-4 text-xl font-bold text-gray-900 truncate flex-1">Detalle de Tarea</h1>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Status Banner */}
          <div className={`px-6 py-4 flex items-center gap-3 ${task.is_completed ? 'bg-green-50 border-b border-green-100' : 'bg-gray-50 border-b border-gray-100'}`}>
            {task.is_completed ? (
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

          <div className="p-6 space-y-8">
            {/* Title & Description */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {task.description || 'Sin descripción'}
              </p>
            </div>

            {/* Meta Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Due Date */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Fecha de vencimiento</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatDate(task.due_date)}</p>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gray-100 rounded-xl text-gray-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Creada el</p>
                  <p className="text-sm text-gray-500 mt-0.5">{formatDate(task.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TagIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700">Etiquetas</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <span 
                      key={tag.id} 
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold"
                      style={{ 
                        backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6', 
                        color: tag.color || '#374151',
                        border: `1px solid ${tag.color ? `${tag.color}40` : '#e5e7eb'}`
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
