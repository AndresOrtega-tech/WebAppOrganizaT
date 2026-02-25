'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEventDetail } from '@/hooks/useEventDetail';

import EventHeader from '@/components/EventDetail/EventHeader';
import EventInfo from '@/components/EventDetail/EventInfo';
import EventTagsModal from '@/components/EventDetail/EventTagsModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import LinkItemModal from '@/components/LinkItemModal';
import HomeSidebar from '@/components/Home/HomeSidebar';
import Link from 'next/link';

import { User } from '@/services/auth.service';
import { Tag, tagsService } from '@/services/tags.service';
import { apiClient } from '@/services/api.client';
import { taskService, Task } from '@/services/task.service';
import { Note, notesService } from '@/services/notes.service';
import { eventsService } from '@/services/events.service';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  const {
    event,
    loading,
    error,
    isSaving,
    isDeleting,
    showDeleteModal,
    setShowDeleteModal,
    isTagsModalOpen,
    setIsTagsModalOpen,
    editForm,
    setEditForm,
    handleUpdate,
    confirmDelete,
    handleTagsUpdate,
    handleRemoveTag,
    hasUnsavedChanges,
    reloadEvent,
  } = useEventDetail(id);

  // Link Task State
  const [isLinkTaskModalOpen, setIsLinkTaskModalOpen] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [showUnlinkTaskModal, setShowUnlinkTaskModal] = useState(false);
  const [taskToUnlink, setTaskToUnlink] = useState<string | null>(null);

  // Link Note State
  const [isLinkNoteModalOpen, setIsLinkNoteModalOpen] = useState(false);
  const [availableNotes, setAvailableNotes] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [showUnlinkNoteModal, setShowUnlinkNoteModal] = useState(false);
  const [noteToUnlink, setNoteToUnlink] = useState<string | null>(null);

  // Sidebar & User State
  const [user, setUser] = useState<User | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Unsaved changes modal
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const [origin, setOrigin] = useState<{ from: string; fromId?: string | null } | null>(null);

  const setSidebarOpen = (open: boolean) => {
    setIsSidebarOpen(open);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('sidebar_open', String(open));
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const nextFrom = searchParams.get('from');
    const nextFromId = searchParams.get('fromId');
    if (nextFrom) {
      const value = { from: nextFrom, fromId: nextFromId || null };
      setOrigin(value);
      window.localStorage.setItem('event_detail_origin', JSON.stringify(value));
      return;
    }
    const stored = window.localStorage.getItem('event_detail_origin');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { from: string; fromId?: string | null };
        setOrigin(parsed);
      } catch {
        setOrigin(null);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('sidebar_open');
    if (stored !== null) {
      setIsSidebarOpen(stored === 'true');
      return;
    }
    const isDesktop = window.innerWidth >= 768;
    setIsSidebarOpen(isDesktop);
    window.localStorage.setItem('sidebar_open', String(isDesktop));
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data', e);
      }
    }
  }, []);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const data = await tagsService.getTags();
        setTags(data);
      } catch (error) {
        console.error('Error loading tags:', error);
      }
    };
    loadTags();
  }, []);

  const handleLogout = () => {
    apiClient.logout();
    router.push('/login');
  };

  // -------------------------
  // Link Tasks Logic
  // -------------------------
  const openLinkTaskModal = async () => {
    setIsLinkTaskModalOpen(true);
    setIsLoadingTasks(true);
    try {
      const { tasks } = await taskService.getTasks();
      const linkedTaskIds = event?.tasks?.map(t => t.id) || [];
      const available = tasks.filter(t => !linkedTaskIds.includes(t.id));
      setAvailableTasks(available);
    } catch (err) {
      console.error('Error loading tasks:', err);
      alert('Error al cargar tareas disponibles');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleLinkTask = async (taskId: string) => {
    if (!event) return;
    try {
      await eventsService.linkTaskToEvent(event.id, taskId);
      await reloadEvent();
      setIsLinkTaskModalOpen(false);
    } catch (err) {
      console.error('Error linking task:', err);
      alert('Error al vincular la tarea');
    }
  };

  const handleUnlinkTask = (taskId: string) => {
    setTaskToUnlink(taskId);
    setShowUnlinkTaskModal(true);
  };

  const confirmUnlinkTask = async () => {
    if (!event || !taskToUnlink) return;
    try {
      await eventsService.unlinkTaskFromEvent(event.id, taskToUnlink);
      await reloadEvent();
      setShowUnlinkTaskModal(false);
      setTaskToUnlink(null);
    } catch (err) {
      console.error('Error unlinking task:', err);
      alert('Error al desvincular la tarea');
    }
  };

  // -------------------------
  // Link Notes Logic
  // -------------------------
  const openLinkNoteModal = async () => {
    setIsLinkNoteModalOpen(true);
    setIsLoadingNotes(true);
    try {
      const data = await notesService.getNotes();
      const linkedNoteIds = event?.notes?.map(n => n.id) || [];
      const available = data.filter(n => !linkedNoteIds.includes(n.id));
      setAvailableNotes(available);
    } catch (err) {
      console.error('Error loading notes:', err);
      alert('Error al cargar notas disponibles');
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleLinkNote = async (noteId: string) => {
    if (!event) return;
    try {
      await eventsService.linkNoteToEvent(event.id, noteId);
      await reloadEvent();
      setIsLinkNoteModalOpen(false);
    } catch (err) {
      console.error('Error linking note:', err);
      alert('Error al vincular la nota');
    }
  };

  const handleUnlinkNote = (noteId: string) => {
    setNoteToUnlink(noteId);
    setShowUnlinkNoteModal(true);
  };

  const confirmUnlinkNote = async () => {
    if (!event || !noteToUnlink) return;
    try {
      await eventsService.unlinkNoteFromEvent(event.id, noteToUnlink);
      await reloadEvent();
      setShowUnlinkNoteModal(false);
      setNoteToUnlink(null);
    } catch (err) {
      console.error('Error unlinking note:', err);
      alert('Error al desvincular la nota');
    }
  };

  // Context Back URL
  const getBackUrl = () => {
    if (origin) {
      if (origin.from === 'task' && origin.fromId) return `/tasks/${origin.fromId}`;
      if (origin.from === 'note' && origin.fromId) return `/notes/${origin.fromId}`;
      if (origin.from) return `/${origin.from}`;
    }
    return '/events';
  };
  if (!user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0A]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0A0A0A]">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 text-center max-w-sm w-full mx-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Evento no encontrado</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || 'El evento que buscas no existe o fue eliminado.'}</p>
          <Link href="/events" className="inline-block w-full text-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">
            Volver a mis Eventos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0A0A0A] overflow-hidden text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <HomeSidebar
        tags={tags}
        user={user}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <main className="flex-1 overflow-y-auto w-full relative">

          <div className="sticky top-0 z-20 px-6 py-4 bg-gray-50/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="max-w-7xl mx-auto">
              <EventHeader
                backHref={getBackUrl()}
                onDelete={() => setShowDeleteModal(true)}
                onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
              />

              <div className="flex justify-between items-center mt-2 px-1">
                <div className="flex items-center gap-3">
                  {hasUnsavedChanges && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      Cambios sin guardar
                    </span>
                  )}
                </div>

                {hasUnsavedChanges && (
                  <button
                    onClick={handleUpdate}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-indigo-200 dark:shadow-none"
                  >
                    {isSaving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                    ) : (
                      <>Guardar cambios</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pb-32">
            <EventInfo
              event={event}
              editForm={editForm}
              setEditForm={setEditForm}
              onRemoveTag={handleRemoveTag}
              onManageTags={() => setIsTagsModalOpen(true)}
              onLinkTask={openLinkTaskModal}
              onUnlinkTask={handleUnlinkTask}
              isLinkingEnabled={true}
              onLinkNote={openLinkNoteModal}
              onUnlinkNote={handleUnlinkNote}
              isNoteLinkingEnabled={true}
            />
          </div>
        </main>
      </div>

      <EventTagsModal
        isOpen={isTagsModalOpen}
        onClose={() => setIsTagsModalOpen(false)}
        onSubmit={handleTagsUpdate}
        currentTagIds={event.tags?.map(t => t.id) || []}
        isSaving={isSaving}
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Eliminar evento"
        message="¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer."
        confirmText={isDeleting ? "Eliminando..." : "Sí, eliminar"}
        cancelText="Cancelar"
      />

      {/* Discard changes modal */}
      <ConfirmationModal
        isOpen={isUnsavedModalOpen}
        onClose={() => setIsUnsavedModalOpen(false)}
        onConfirm={() => {
          setIsUnsavedModalOpen(false);
          router.push(getBackUrl());
        }}
        title="Cambios sin guardar"
        message="Tienes cambios sin guardar. ¿Estás seguro de que deseas salir? Los cambios se perderán."
        confirmText="Sí, salir y descartar"
        cancelText="Quedarme"
      />

      <LinkItemModal
        isOpen={isLinkTaskModalOpen}
        onClose={() => setIsLinkTaskModalOpen(false)}
        onLink={handleLinkTask}
        items={availableTasks}
        title="Vincular Tareas"
        isLoading={isLoadingTasks}
      />

      <ConfirmationModal
        isOpen={showUnlinkTaskModal}
        onClose={() => {
          setShowUnlinkTaskModal(false);
          setTaskToUnlink(null);
        }}
        onConfirm={confirmUnlinkTask}
        title="Desvincular Tarea"
        message="¿Estás seguro de que deseas desvincular esta tarea del evento?"
        confirmText="Desvincular"
        cancelText="Cancelar"
      />

      <LinkItemModal
        isOpen={isLinkNoteModalOpen}
        onClose={() => setIsLinkNoteModalOpen(false)}
        onLink={handleLinkNote}
        items={availableNotes}
        title="Vincular Notas"
        isLoading={isLoadingNotes}
      />

      <ConfirmationModal
        isOpen={showUnlinkNoteModal}
        onClose={() => {
          setShowUnlinkNoteModal(false);
          setNoteToUnlink(null);
        }}
        onConfirm={confirmUnlinkNote}
        title="Desvincular Nota"
        message="¿Estás seguro de que deseas desvincular esta nota del evento?"
        confirmText="Desvincular"
        cancelText="Cancelar"
      />
    </div>
  );
}
