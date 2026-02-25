'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/services/auth.service';
import { Note, notesService } from '@/services/notes.service';
import { Tag, tagsService } from '@/services/tags.service';
import { apiClient } from '@/services/api.client';

import HomeSidebar from '@/components/Home/HomeSidebar';
import HomeHeader from '@/components/Home/HomeHeader';
import NoteCard from '@/components/NoteCard';
import CreateItemModal from '@/components/CreateItemModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import { Loader2 } from 'lucide-react';

function NotesContent() {
  const router = useRouter();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentTab, setCurrentTab] = useState<'active' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('sidebar_open');
    if (stored !== null) {
      return stored === 'true';
    }
    return window.innerWidth >= 768;
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<'task' | 'note' | 'event' | 'tag'>('note');

  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean, noteId: string | null }>({
    isOpen: false,
    noteId: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const setSidebarOpen = (open: boolean) => {
    setIsSidebarOpen(open);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('sidebar_open', String(isSidebarOpen));
  }, [isSidebarOpen]);

  // Load User
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) return;
    try {
      const parsed = JSON.parse(userData) as User;
      queueMicrotask(() => setUser(parsed));
    } catch (e) {
      console.error('Error parsing user data', e);
    }
  }, []);

  // Load Data
  const loadNotes = useCallback(async (tab: 'active' | 'archived') => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const isArchived = tab === 'archived';
      const data = await notesService.getNotes({ is_archived: isArchived });
      setNotes(data);
    } catch (error) {
      console.error('Error loading notes:', error);
      setErrorMessage('Error al cargar las notas');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const data = await tagsService.getTags();
      setTags(data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.all([loadNotes(currentTab), loadTags()]);
    })();
  }, [currentTab, loadNotes, loadTags]);

  // Handlers
  const handleLogout = () => {
    apiClient.logout();
    router.push('/login');
  };

  const handleCreateClick = (tab: 'task' | 'note' | 'event' | 'tag' = 'note') => {
    setErrorMessage(null);
    setCreateModalTab(tab);
    setIsCreateModalOpen(true);
  };

  const handleArchiveNote = async (note: Note) => {
    try {
      await notesService.updateNote(note.id, { is_archived: !note.is_archived });
      await loadNotes(currentTab);
    } catch (error) {
      console.error('Error archiving note:', error);
      setErrorMessage('Error al actualizar el estado de la nota');
    }
  };

  const handleDeleteClick = (note: Note) => {
    setDeleteModal({ isOpen: true, noteId: note.id });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.noteId) return;
    try {
      setIsDeleting(true);
      await notesService.deleteNote(deleteModal.noteId);
      setDeleteModal({ isOpen: false, noteId: null });
      await loadNotes(currentTab);
    } catch (error) {
      console.error('Error deleting note:', error);
      setErrorMessage('Error al eliminar la nota');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <div className="flex">
        {/* Sidebar */}
        <HomeSidebar
          tags={tags}
          user={user}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 transition-all duration-300">
          <div className="max-w-7xl mx-auto space-y-8">
            <HomeHeader
              userName={user?.full_name || 'Usuario'}
              onNewItemClick={handleCreateClick}
              onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              createButtonLabel="Nueva Nota"
            />

            {errorMessage && (
              <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            {/* Notes Section */}
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 min-h-[400px]">
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mis Notas</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentTab('active')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentTab === 'active'
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    Activas
                  </button>
                  <button
                    onClick={() => setCurrentTab('archived')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentTab === 'archived'
                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    Archivadas
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
                  <span>Cargando notas...</span>
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                  <p className="text-gray-400 font-medium">
                    {currentTab === 'active' ? 'No tienes notas activas' : 'No tienes notas archivadas'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {notes.map(note => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onArchive={handleArchiveNote}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          loadNotes(currentTab);
          loadTags();
          setIsCreateModalOpen(false);
        }}
        initialTab={createModalTab}
        disableTabs={true}
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, noteId: null })}
        onConfirm={handleConfirmDelete}
        title="Eliminar Nota"
        message="¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <NotesContent />
    </Suspense>
  );
}
