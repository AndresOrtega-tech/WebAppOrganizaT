'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/services/auth.service';
import { Note, notesService, NoteFilters as NoteFiltersParams } from '@/services/notes.service';
import NoteCard from '@/components/NoteCard';
import NoteModal from '@/components/NoteModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import NoteFilters from '@/components/NoteFilters';
import TagsSidebar from '@/components/TagsSidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { Loader2, User as UserIcon, CheckSquare, Plus, StickyNote, CalendarDays } from 'lucide-react';
import { isFeatureEnabled } from '@/config/features';

function NotesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState<NoteFiltersParams>({});
  const [deleteModal, setDeleteModal] = useState<{isOpen: boolean, noteId: string | null}>({
    isOpen: false,
    noteId: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isFeatureEnabled('ENABLE_NOTES_VIEW')) {
      router.push('/home');
      return;
    }

    const userData = localStorage.getItem('user');

    if (!userData) {
      router.push('/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      
      // Initial load with potential URL params if we wanted to support deep linking
      // For now, we rely on NoteFilters to drive the state via onFiltersChange
      // But we need to load notes initially if filters are empty
      if (!isFeatureEnabled('ENABLE_NOTE_FILTERS')) {
        loadNotes(filters);
      }
    } catch (e) {
      console.error('Error parsing user data', e);
      router.push('/login');
    }
  }, [router]);

  const loadNotes = async (currentFilters: NoteFiltersParams) => {
    try {
      setLoading(true);
      const data = await notesService.getNotes(currentFilters);
      setNotes(data);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = useCallback((newFilters: NoteFiltersParams) => {
    setFilters(newFilters);
    loadNotes(newFilters);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('refresh_token');
    router.push('/login');
  };

  const handleNoteCreated = (newNote: Note) => {
    loadNotes(filters);
  };

  const handleArchiveNote = async (note: Note) => {
    try {
      // Optimistic update or just reload
      await notesService.updateNote(note.id, { is_archived: !note.is_archived });
      loadNotes(filters);
    } catch (error) {
      console.error('Error archiving note:', error);
      alert('Error al actualizar el estado de la nota');
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
      loadNotes(filters);
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error al eliminar la nota');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-200">
        {/* Navbar */}
        <nav className="bg-white dark:bg-gray-900 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm dark:shadow-gray-800/50 dark:border-b dark:border-gray-800 transition-colors duration-200">
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">OrganizaT</h1>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                <Link
                    href="/home"
                    className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-2"
                    title="Mis Tareas"
                >
                    <CheckSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">Tareas</span>
                </Link>
                {isFeatureEnabled('ENABLE_EVENTS_VIEW') && (
                    <Link
                        href="/events"
                        className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-xl text-sm font-bold hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-2"
                        title="Mis Eventos"
                    >
                        <CalendarDays className="w-4 h-4" />
                        <span className="hidden sm:inline">Eventos</span>
                    </Link>
                )}
                {isFeatureEnabled('ENABLE_USER_PROFILE') && (
                    <Link
                        href="/profile"
                        className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Mi Perfil"
                    >
                        <UserIcon className="w-5 h-5" />
                    </Link>
                )}
                <button 
                    onClick={handleLogout}
                    className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                    Salir
                </button>
            </div>
        </nav>

        <main className="px-6 py-8 max-w-5xl mx-auto">
            {/* Greeting */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                    Mis Notas 📝
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm font-medium transition-colors">
                    Gestiona tus ideas y apuntes personales.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Sidebar */}
                {isFeatureEnabled('ENABLE_TAGS_VIEW') && (
                    <aside className="w-full md:w-auto shrink-0 sticky top-24">
                        <TagsSidebar />
                    </aside>
                )}

                {/* Main Content */}
                <div className="flex-1 w-full max-w-md mx-auto md:max-w-none">
                    
                    {isFeatureEnabled('ENABLE_NOTE_FILTERS') && (
                        <div className="mb-6">
                            <NoteFilters onFiltersChange={handleFiltersChange} initialFilters={filters} />
                        </div>
                    )}

                    <div className="space-y-4 relative min-h-[200px]">
                        {loading && notes.length > 0 && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl transition-all duration-300">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                            </div>
                        )}

                        {loading && notes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400 font-medium animate-pulse">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
                                <span>Cargando notas...</span>
                            </div>
                        ) : notes.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl shadow-sm dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 transition-colors">
                                <p className="text-gray-400 font-medium">No se encontraron notas</p>
                                <p className="text-gray-300 dark:text-gray-600 text-sm mt-1">Crea una nueva nota para comenzar</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {notes.map((note) => (
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
            </div>
        </main>

        {isFeatureEnabled('ENABLE_NOTE_CREATION') && (
            <button
                onClick={() => setIsCreateModalOpen(true)}
                className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 z-40"
            >
                <Plus className="w-5 h-5" />
                <span>Nueva Nota</span>
            </button>
        )}

        <NoteModal 
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onNoteSaved={handleNoteCreated}
        />

        <ConfirmationModal
            isOpen={deleteModal.isOpen}
            onClose={() => setDeleteModal({ isOpen: false, noteId: null })}
            onConfirm={handleConfirmDelete}
            title="Eliminar Nota"
            message="¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer."
            confirmText="Eliminar"
            cancelText="Cancelar"
            isLoading={isDeleting}
        />
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    }>
      <NotesContent />
    </Suspense>
  );
}
