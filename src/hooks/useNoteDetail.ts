import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Note, notesService } from '@/services/notes.service';
import { Event } from '@/services/events.service';

export interface NoteEditFormState {
    title: string;
    content: string;
}

export const useNoteDetail = (noteId: string) => {
    const router = useRouter();

    const [note, setNote] = useState<Note | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [isLinkEventModalOpen, setIsLinkEventModalOpen] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [showUnlinkEventModal, setShowUnlinkEventModal] = useState(false);
  const [eventToUnlink, setEventToUnlink] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);

    const [editForm, setEditForm] = useState<NoteEditFormState>({
        title: '',
        content: '',
    });

    const [initialEditForm, setInitialEditForm] = useState<NoteEditFormState | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const loadNote = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const [baseNote, related] = await Promise.all([
                notesService.getNoteById(id),
                notesService.getNoteRelations(id)
            ]);
            setNote({
                ...baseNote,
                tags: related.tags || [],
                tasks: related.tasks || [],
                events: related.events || []
            });
        } catch (err) {
            console.error('Error loading note:', err);
            setError('No se pudo cargar la nota.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (noteId) {
            loadNote(noteId);
        }
    }, [noteId, loadNote]);

    useEffect(() => {
        if (note) {
            const nextForm: NoteEditFormState = {
                title: note.title || '',
                content: note.content || '',
            };

            setEditForm(nextForm);
            setInitialEditForm(nextForm);
            setHasUnsavedChanges(false);
        }
    }, [note]);

    useEffect(() => {
        if (!initialEditForm) return;

        const isDirty =
            editForm.title !== initialEditForm.title ||
            editForm.content !== initialEditForm.content;

        setHasUnsavedChanges(isDirty);
    }, [editForm, initialEditForm]);

    const handleUpdate = async (e?: React.FormEvent): Promise<boolean> => {
        if (e) e.preventDefault();
        if (!note) return false;

        try {
            setIsSaving(true);
            const updatedNote = await notesService.updateNote(note.id, editForm);

            setNote(prev => {
                if (!prev) return updatedNote;
                return {
                    ...prev,
                    ...updatedNote,
                    tags: prev.tags,
                    tasks: prev.tasks,
                    events: prev.events,
                };
            });
            setIsEditing(false);
            setInitialEditForm(editForm);
            setHasUnsavedChanges(false);
            return true;
        } catch (err) {
            console.error('Error updating note:', err);
            alert('Error al actualizar la nota');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!note) return;

        try {
            setIsDeleting(true);
            await notesService.deleteNote(note.id);
            router.push('/notes');
        } catch (err) {
            console.error('Error deleting note:', err);
            alert('Error al eliminar la nota');
            setIsDeleting(false);
        }
    };

    const handleTagsUpdate = async (tagIds: string[]) => {
        if (!note) return;

        try {
            setIsSaving(true);

            const currentTagIds = note.tags?.map(t => t.id) || [];
            const tagsToAdd = tagIds.filter(id => !currentTagIds.includes(id));
            const tagsToRemove = currentTagIds.filter(id => !tagIds.includes(id));

            if (tagsToAdd.length > 0) {
                await notesService.assignTagsToNote(note.id, tagsToAdd);
            }

            if (tagsToRemove.length > 0) {
                for (const tagId of tagsToRemove) {
                    await notesService.removeTagFromNote(note.id, tagId);
                }
            }

            await loadNote(note.id);
            setIsTagsModalOpen(false);
        } catch (err) {
            console.error('Error updating tags:', err);
            alert('Error al actualizar las etiquetas');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveTag = async (tagId: string) => {
        if (!note) return;

        try {
            const updatedTags = note.tags?.filter(t => t.id !== tagId) || [];
            setNote({ ...note, tags: updatedTags });
            await notesService.removeTagFromNote(note.id, tagId);
        } catch (err) {
            console.error('Error removing tag:', err);
            alert('Error al eliminar la etiqueta de la nota');
            loadNote(note.id);
        }
    };

    const openLinkEventModal = async () => {
        setIsLinkEventModalOpen(true);
        setIsLoadingEvents(true);
        try {
            const { eventsService } = await import('@/services/events.service');
            const data = await eventsService.getEvents();
            const linkedIds = new Set((note?.events || []).map(e => e.id));
            setAvailableEvents(data.filter(e => !linkedIds.has(e.id)));
        } catch (err) {
            console.error('Error loading events:', err);
            alert('Error al cargar eventos disponibles');
        } finally {
            setIsLoadingEvents(false);
        }
    };

    const handleLinkEvent = async (eventId: string) => {
        if (!note) return;
        try {
            const { eventsService } = await import('@/services/events.service');
            await eventsService.linkNoteToEvent(eventId, note.id);
            await loadNote(note.id);
            setIsLinkEventModalOpen(false);
        } catch (err) {
            console.error('Error linking event:', err);
            alert('Error al vincular el evento');
        }
    };

    const handleUnlinkEvent = (eventId: string) => {
        setEventToUnlink(eventId);
        setShowUnlinkEventModal(true);
    };

    const confirmUnlinkEvent = async () => {
        if (!note || !eventToUnlink) return;
        try {
            const { eventsService } = await import('@/services/events.service');
            await eventsService.unlinkNoteFromEvent(eventToUnlink, note.id);
            await loadNote(note.id);
            setShowUnlinkEventModal(false);
            setEventToUnlink(null);
        } catch (err) {
            console.error('Error unlinking event:', err);
            alert('Error al desvincular el evento');
        }
    };

    const reloadNote = async () => {
        if (!noteId) return;
        await loadNote(noteId);
        router.refresh();
    };

    return {
        note,
        loading,
        error,
        isEditing,
        setIsEditing,
        isSaving,
        isDeleting,
        showDeleteModal,
        setShowDeleteModal,
        isTagsModalOpen,
        setIsTagsModalOpen,
        editForm,
        setEditForm,
        hasUnsavedChanges,
        handleUpdate,
        confirmDelete,
        handleTagsUpdate,
        handleRemoveTag,
        reloadNote,
        isLinkEventModalOpen,
        setIsLinkEventModalOpen,
        availableEvents,
        isLoadingEvents,
        showUnlinkEventModal,
        setShowUnlinkEventModal,
        eventToUnlink,
        eventsError,
        openLinkEventModal,
        handleLinkEvent,
        handleUnlinkEvent,
        confirmUnlinkEvent,
    };
};
