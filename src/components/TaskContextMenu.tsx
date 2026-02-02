'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, Circle, Tag as TagIcon, Loader2, X } from 'lucide-react';
import { Task, taskService } from '@/services/task.service';
import { Tag, tagsService } from '@/services/tags.service';

interface TaskContextMenuProps {
  task: Task;
  onClose: () => void;
  onUpdate: () => void; // Trigger reload or update local state
}

export default function TaskContextMenu({ task: initialTask, onClose, onUpdate }: TaskContextMenuProps) {
  const [task, setTask] = useState<Task>(initialTask);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [showTagsSubmenu, setShowTagsSubmenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTask(initialTask);
  }, [initialTask]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Fetch tags only if opening tags submenu
  const loadTags = async () => {
    if (tags.length > 0) return;
    
    setLoadingTags(true);
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const data = await tagsService.getTags(token);
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleToggleStatus = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      await taskService.updateTask(token, task.id, { is_completed: !task.is_completed });
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const handleToggleTag = async (tag: Tag, isAssigned: boolean) => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      if (isAssigned) {
        // Remove tag
        await taskService.removeTagFromTask(token, task.id, tag.id);
        setTask(prev => ({ ...prev, tags: prev.tags.filter(t => t.id !== tag.id) }));
      } else {
        // Assign tag
        await taskService.assignTagsToTask(token, task.id, [tag.id]);
        setTask(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      }
      onUpdate();
    } catch (error) {
      console.error('Error toggling tag:', error);
      alert('Error al actualizar etiquetas');
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!mounted) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[51] bg-white rounded-xl shadow-xl border border-gray-100 w-64 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 truncate px-2">
            {task.title}
          </p>
        </div>

        <div className="p-1">
          <button
            onClick={handleToggleStatus}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            {task.is_completed ? (
              <>
                <Circle className="w-4 h-4 text-orange-500" />
                <span>Marcar como pendiente</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Marcar como completada</span>
              </>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setShowTagsSubmenu(!showTagsSubmenu);
                loadTags();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors ${showTagsSubmenu ? 'bg-gray-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-indigo-500" />
                <span>Etiquetas</span>
              </div>
              <span className="text-xs text-gray-400">▼</span>
            </button>

            {showTagsSubmenu && (
              <div className="bg-gray-50 rounded-lg mt-1 p-1 max-h-48 overflow-y-auto border border-gray-100">
                {loadingTags ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                ) : tags.length === 0 ? (
                  <p className="text-xs text-center py-2 text-gray-400">No hay etiquetas</p>
                ) : (
                  tags.map(tag => {
                    const isAssigned = task.tags.some(t => t.id === tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={(e) => {
                          e.stopPropagation(); // Don't close submenu
                          handleToggleTag(tag, isAssigned);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-white rounded-md transition-colors"
                      >
                        <div 
                          className={`w-3 h-3 rounded-full border ${isAssigned ? 'border-transparent' : 'border-gray-300'}`}
                          style={{ backgroundColor: isAssigned ? tag.color : 'transparent' }}
                        >
                          {isAssigned && <CheckCircle className="w-3 h-3 text-white mix-blend-difference" />}
                        </div>
                        <span className="truncate flex-1 text-left">{tag.name}</span>
                        {isAssigned && <X className="w-3 h-3 text-gray-400 hover:text-red-500" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
