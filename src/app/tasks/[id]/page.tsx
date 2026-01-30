'use client';

import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ConfirmationModal from '@/components/ConfirmationModal';
import { useTaskDetail } from '@/hooks/useTaskDetail';
import TaskHeader from '@/components/TaskDetail/TaskHeader';
import TaskInfo from '@/components/TaskDetail/TaskInfo';
import TaskEditModal from '@/components/TaskDetail/TaskEditModal';

export default function TaskDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const {
    task,
    loading,
    error,
    isEditing,
    setIsEditing,
    isSaving,
    isDeleting,
    showDeleteModal,
    setShowDeleteModal,
    editForm,
    setEditForm,
    handleUpdate,
    confirmDelete
  } = useTaskDetail(id);

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
      <TaskHeader 
        onBack={() => {}} // Link handles navigation
        onDelete={() => setShowDeleteModal(true)}
        onEdit={() => setIsEditing(true)}
      />

      <TaskInfo task={task} />

      <TaskEditModal 
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSubmit={handleUpdate}
        editForm={editForm}
        setEditForm={setEditForm}
        isSaving={isSaving}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar Tarea"
        message="¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isLoading={isDeleting}
      />
    </div>
  );
}
