import { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Bold, Italic, Heading1, List, Link as LinkIcon, Eye, Edit3, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Dispatch, SetStateAction } from 'react';
import { Note } from '@/services/notes.service';
import { Event } from '@/services/events.service';
import TagList from '@/components/TagList';
import LinkedItemsList from '@/components/LinkedItemsList';
import type { NoteEditFormState } from '@/hooks/useNoteDetail';
import { useAiReformulation } from '@/hooks/useAiReformulation';
import { useAiSummary } from '@/hooks/useAiSummary';
import AiReformulateButton from '@/components/AiReformulateButton';

interface NoteInfoProps {
  note: Note;
  editForm: NoteEditFormState;
  setEditForm: Dispatch<SetStateAction<NoteEditFormState>>;
  onRemoveTag?: (tagId: string) => void;
  onManageTags?: () => void;
  onLinkTask: () => void;
  onUnlinkTask: (taskId: string) => void;
  isLinkingEnabled?: boolean;
  linkedEvents?: Event[];
  onLinkEvent?: () => void;
  onUnlinkEvent?: (eventId: string) => void;
  isEventLinkingEnabled?: boolean;
  onSummaryGenerated: () => void;
}

export default function NoteInfo({
  note,
  editForm,
  setEditForm,
  onRemoveTag,
  onManageTags,
  onLinkTask,
  onUnlinkTask,
  isLinkingEnabled = true,
  linkedEvents = [],
  onLinkEvent,
  onUnlinkEvent,
  isEventLinkingEnabled = false,
  onSummaryGenerated
}: NoteInfoProps) {

  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const hasTriggeredAutoSummary = useRef(false);

  const { isSummarizing, handleSummarize } = useAiSummary(
    note.id,
    editForm.content,
    onSummaryGenerated
  );

  const { isReformulating, handleReformulate } = useAiReformulation(
    editForm.content,
    (newText) => {
      const textarea = document.getElementById('note-content-area') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(0, textarea.value.length);
        if (!document.execCommand('insertText', false, newText)) {
          setEditForm(prev => ({ ...prev, content: newText }));
        }
      } else {
        setEditForm(prev => ({ ...prev, content: newText }));
      }
    },
    'note'
  );

  useEffect(() => {
    if (note.summary) {
      hasTriggeredAutoSummary.current = false;
      return;
    }

    // Comprobar la longitud del contenido base para asegurar que ya está guardado (no durante el "typing" de editForm)
    if (note.content && note.content.length > 500 && !note.summary && !isSummarizing && !hasTriggeredAutoSummary.current) {
      hasTriggeredAutoSummary.current = true;
      handleSummarize();
    }
  }, [note.content, note.summary, isSummarizing, handleSummarize]);

  const formatDate = (dateString: string) => {
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

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('note-content-area') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = editForm.content;
    const selected = currentText.substring(start, end);

    textarea.focus();
    textarea.setSelectionRange(start, end);

    const insertion = prefix + selected + suffix;

    // Usamos execCommand para que la acción entre en el historial de Ctrl+Z
    if (!document.execCommand('insertText', false, insertion)) {
      // Fallback si execCommand no es soportado
      const before = currentText.substring(0, start);
      const after = currentText.substring(end);
      setEditForm(prev => ({ ...prev, content: before + insertion + after }));
    }

    setTimeout(() => {
      // Dejar seleccionado solo pero el texto envuelto para facil edicion
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 px-6 py-5 space-y-4">
            <div className="flex-1 min-w-0 space-y-2">
              <textarea
                id="note-title"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                rows={2}
                className="w-full bg-transparent border-none text-2xl font-bold text-gray-900 dark:text-white focus:outline-none resize-none leading-snug"
                placeholder="Título de la nota..."
              />
            </div>

            <TagList
              tags={note.tags || []}
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

          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 px-6 py-5 space-y-4">
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'write'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Escribir
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'preview'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Previsualizar
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  {editForm.content.length} caracteres
                </span>
                <AiReformulateButton
                  onClick={handleReformulate}
                  isLoading={isReformulating}
                  hasText={editForm.content.length > 0}
                />
              </div>
            </div>

            {activeTab === 'write' ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
                <div className="flex items-center gap-1 p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <button type="button" onClick={() => insertMarkdown('**', '**')} className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Bold">
                    <Bold className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => insertMarkdown('*', '*')} className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Italic">
                    <Italic className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <button type="button" onClick={() => insertMarkdown('# ')} className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Heading 1">
                    <Heading1 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => insertMarkdown('- ')} className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Bullet List">
                    <List className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                  <button type="button" onClick={() => insertMarkdown('[', '](url)')} className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" title="Link">
                    <LinkIcon className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  id="note-content-area"
                  value={editForm.content}
                  onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  rows={15}
                  className="w-full px-4 py-3 bg-transparent border-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 font-mono"
                  placeholder="Empieza a escribir tu nota aquí... (Soporta Markdown)"
                />
              </div>
            ) : (
              <div className="min-h-[300px] px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                {editForm.content ? (
                  <div className="prose prose-indigo dark:prose-invert prose-sm max-w-none text-gray-600 dark:text-gray-300">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        ul: ({ node: _node, ...props }) => <ul className="list-disc list-outside ml-6 mb-4 space-y-1" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                        ol: ({ node: _node, ...props }) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-1" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                        li: ({ node: _node, ...props }) => <li className="pl-1" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                        strong: ({ node: _node, ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                        p: ({ node: _node, ...props }) => <p className="mb-4 leading-relaxed whitespace-pre-wrap" {...props} />, // eslint-disable-line @typescript-eslint/no-unused-vars
                      }}
                    >
                      {editForm.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 italic">Nada que previsualizar.</p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1 mt-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-600 dark:text-gray-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Creada el</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(note.created_at)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-200">Actualizada el</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(note.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Relations & Metadata */}
        <div className="space-y-5">
          <div className={`rounded-2xl border px-5 py-4 ${note.summary ? 'bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-100 dark:border-indigo-800/50' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-800/80 text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-100">
                  Resumen de IA
                </h3>
              </div>
              <button
                type="button"
                onClick={handleSummarize}
                disabled={isSummarizing || !editForm.content.trim()}
                className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Solo se puede generar resumen de una nota con texto."
              >
                {isSummarizing ? 'Generando...' : note.summary ? 'Actualizar' : 'Generar AI'}
              </button>
            </div>
            {note.summary ? (
              <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80 leading-relaxed italic">
                &quot;{note.summary}&quot;
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                Aún no has generado un resumen en base a tu texto.
              </p>
            )}
          </div>

          {isLinkingEnabled && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Tareas vinculadas</h3>
              <LinkedItemsList
                items={note.tasks || []}
                type="task"
                onLinkNew={onLinkTask}
                onUnlink={onUnlinkTask}
                originType="note"
                originId={note.id}
              />
            </div>
          )}

          {isEventLinkingEnabled && onLinkEvent && onUnlinkEvent && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">Eventos vinculados</h3>
              <LinkedItemsList
                items={(note.events as Event[]) || []}
                type="event"
                onLinkNew={onLinkEvent}
                onUnlink={onUnlinkEvent}
                originType="note"
                originId={note.id}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
