import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Event, eventsService } from '@/services/events.service';

export interface EventEditFormState {
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    location: string | null;
    is_all_day: boolean;
}

export const useEventDetail = (eventId: string) => {
    const router = useRouter();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);

    const [editForm, setEditForm] = useState<EventEditFormState>({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        location: '',
        is_all_day: false,
    });

    const [initialEditForm, setInitialEditForm] = useState<EventEditFormState | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const loadEvent = useCallback(async (id: string) => {
        try {
            setLoading(true);
            const [baseEvent, related] = await Promise.all([
                eventsService.getEventById(id),
                eventsService.getEventRelations(id)
            ]);
            setEvent({
                ...baseEvent,
                tags: related.tags || [],
                tasks: related.tasks || [],
                notes: related.notes || []
            });
        } catch (err) {
            console.error('Error loading event:', err);
            setError('No se pudo cargar el evento.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (eventId) {
            loadEvent(eventId);
        }
    }, [eventId, loadEvent]);

    useEffect(() => {
        if (event) {
            const nextForm: EventEditFormState = {
                title: event.title || '',
                description: event.description || '',
                start_time: event.start_time || '',
                end_time: event.end_time || '',
                location: event.location || '',
                is_all_day: event.is_all_day || false,
            };

            setEditForm(nextForm);
            setInitialEditForm(nextForm);
            setHasUnsavedChanges(false);
        }
    }, [event]);

    useEffect(() => {
        if (!initialEditForm) return;

        const isDirty =
            editForm.title !== initialEditForm.title ||
            editForm.description !== initialEditForm.description ||
            editForm.start_time !== initialEditForm.start_time ||
            editForm.end_time !== initialEditForm.end_time ||
            editForm.location !== initialEditForm.location ||
            editForm.is_all_day !== initialEditForm.is_all_day;

        setHasUnsavedChanges(isDirty);
    }, [editForm, initialEditForm]);

    const handleUpdate = async (e?: React.FormEvent): Promise<boolean> => {
        if (e) e.preventDefault();
        if (!event) return false;

        try {
            setIsSaving(true);
            const updatedEvent = await eventsService.updateEvent(event.id, editForm);

            setEvent(prev => {
                if (!prev) return updatedEvent;
                return {
                    ...prev,
                    ...updatedEvent,
                    tags: prev.tags,
                    tasks: prev.tasks,
                    notes: prev.notes,
                };
            });
            setIsEditing(false);
            setInitialEditForm(editForm);
            setHasUnsavedChanges(false);
            return true;
        } catch (err) {
            console.error('Error updating event:', err);
            alert('Error al actualizar el evento');
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDelete = async () => {
        if (!event) return;

        try {
            setIsDeleting(true);
            await eventsService.deleteEvent(event.id);
            router.push('/events');
        } catch (err) {
            console.error('Error deleting event:', err);
            alert('Error al eliminar el evento');
            setIsDeleting(false);
        }
    };

    const handleTagsUpdate = async (tagIds: string[]) => {
        if (!event) return;

        try {
            setIsSaving(true);

            const currentTagIds = event.tags?.map(t => t.id) || [];
            const tagsToAdd = tagIds.filter(id => !currentTagIds.includes(id));
            const tagsToRemove = currentTagIds.filter(id => !tagIds.includes(id));

            if (tagsToAdd.length > 0) {
                await eventsService.assignTagsToEvent(event.id, tagsToAdd);
            }

            if (tagsToRemove.length > 0) {
                for (const tagId of tagsToRemove) {
                    await eventsService.removeTagFromEvent(event.id, tagId);
                }
            }

            await loadEvent(event.id);
            setIsTagsModalOpen(false);
        } catch (err) {
            console.error('Error updating tags:', err);
            alert('Error al actualizar las etiquetas');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveTag = async (tagId: string) => {
        if (!event) return;

        try {
            const updatedTags = event.tags?.filter(t => t.id !== tagId) || [];
            setEvent({ ...event, tags: updatedTags });
            await eventsService.removeTagFromEvent(event.id, tagId);
        } catch (err) {
            console.error('Error removing tag:', err);
            alert('Error al eliminar la etiqueta del evento');
            loadEvent(event.id);
        }
    };

    const reloadEvent = async () => {
        if (!eventId) return;
        await loadEvent(eventId);
    };

    return {
        event,
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
        reloadEvent,
    };
};
