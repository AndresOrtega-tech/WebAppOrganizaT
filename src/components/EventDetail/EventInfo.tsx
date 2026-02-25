import type { Dispatch, SetStateAction } from 'react';
import { Calendar, Clock, MapPin, AlignLeft } from 'lucide-react';
import { Event } from '@/services/events.service';
import TagList from '@/components/TagList';
import LinkedItemsList from '@/components/LinkedItemsList';
import type { EventEditFormState } from '@/hooks/useEventDetail';
import DateTimePicker from '@/components/DateTimePicker';
import { useState } from 'react';

interface EventInfoProps {
    event: Event;
    editForm: EventEditFormState;
    setEditForm: Dispatch<SetStateAction<EventEditFormState>>;
    onRemoveTag?: (tagId: string) => void;
    onManageTags?: () => void;
    onLinkTask: () => void;
    onUnlinkTask: (taskId: string) => void;
    isLinkingEnabled?: boolean;
    onLinkNote?: () => void;
    onUnlinkNote?: (noteId: string) => void;
    isNoteLinkingEnabled?: boolean;
}

export default function EventInfo({
    event,
    editForm,
    setEditForm,
    onRemoveTag,
    onManageTags,
    onLinkTask,
    onUnlinkTask,
    isLinkingEnabled = true,
    onLinkNote,
    onUnlinkNote,
    isNoteLinkingEnabled = true,
}: EventInfoProps) {
    const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Sin asignar';
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

    const handleDateSave = (dateStr: string) => {
        // DateTimePicker devuelve un ISO string limpio en la mayoria de casos.
        // Asegurarse de mantener local time format usando formato iso ajustado.
        const date = new Date(dateStr);
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);

        if (activePicker === 'start') {
            setEditForm(prev => ({ ...prev, start_time: localISOTime }));
        } else if (activePicker === 'end') {
            setEditForm(prev => ({ ...prev, end_time: localISOTime }));
        }
        setActivePicker(null);
    };

    return (
        <main className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 px-6 py-5 space-y-4">
                        <div className="flex-1 min-w-0 space-y-2">
                            <textarea
                                id="event-title"
                                value={editForm.title}
                                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                                rows={2}
                                className="w-full bg-transparent border-none text-2xl font-bold text-gray-900 dark:text-white focus:outline-none resize-none leading-snug"
                                placeholder="Título del evento..."
                            />
                        </div>

                        <TagList
                            tags={event.tags || []}
                            onRemoveTag={onRemoveTag}
                            actions={onManageTags && (
                                <button
                                    type="button"
                                    onClick={onManageTags}
                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                >
                                    + Agregar
                                </button>
                            )}
                        />
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 px-6 py-5 space-y-5">
                        {/* Fechas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">Inicio</label>
                                <button
                                    type="button"
                                    onClick={() => setActivePicker('start')}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-left text-gray-900 dark:text-white hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors flex items-center justify-between"
                                >
                                    <span className="truncate">{formatDate(editForm.start_time)}</span>
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">Fin</label>
                                <button
                                    type="button"
                                    onClick={() => setActivePicker('end')}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-left text-gray-900 dark:text-white hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors flex items-center justify-between"
                                >
                                    <span className="truncate">{formatDate(editForm.end_time)}</span>
                                    <Calendar className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                                </button>
                            </div>
                        </div>

                        {/* Ubicacion y Todo el dia */}
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                            <div className="flex-1 w-full space-y-1.5">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider">Ubicación</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={editForm.location || ''}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        placeholder="Añadir ubicación..."
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer pt-6">
                                <input
                                    type="checkbox"
                                    checked={editForm.is_all_day}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, is_all_day: e.target.checked }))}
                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-600 dark:focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Todo el día</span>
                            </label>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider flex items-center gap-1.5">
                                <AlignLeft className="w-3.5 h-3.5" />
                                Descripción
                            </label>
                            <textarea
                                value={editForm.description || ''}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                rows={6}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400"
                                placeholder="Añade más detalles sobre este evento..."
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1 mt-4 border-t border-gray-100 dark:border-gray-800 pt-5">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Creado el</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(event.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Actualizado el</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(event.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Relations & Metadata */}
                <div className="space-y-5">
                    {isLinkingEnabled && (
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Tareas vinculadas</h3>
                            <LinkedItemsList
                                items={event.tasks || []}
                                type="task"
                                onLinkNew={onLinkTask}
                                onUnlink={onUnlinkTask}
                                originType="event"
                                originId={event.id}
                            />
                        </div>
                    )}

                    {isNoteLinkingEnabled && onLinkNote && onUnlinkNote && (
                        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Notas vinculadas</h3>
                            <LinkedItemsList
                                items={event.notes || []}
                                type="note"
                                onLinkNew={onLinkNote}
                                onUnlink={onUnlinkNote}
                                originType="event"
                                originId={event.id}
                            />
                        </div>
                    )}
                </div>
            </div>

            <DateTimePicker
                isOpen={activePicker !== null}
                onClose={() => setActivePicker(null)}
                onSave={handleDateSave}
                initialDate={activePicker === 'start' ? editForm.start_time : editForm.end_time || undefined}
                includeTime={!editForm.is_all_day}
            />
        </main>
    );
}
