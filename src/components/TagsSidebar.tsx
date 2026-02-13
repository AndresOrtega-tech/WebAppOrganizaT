'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tag, tagsService } from '@/services/tags.service';
import { Tag as TagIcon, Loader2, Plus, Pencil } from 'lucide-react';
import TagModal from './TagModal';
import { isFeatureEnabled } from '@/config/features';

export default function TagsSidebar() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await tagsService.getTags();
        setTags(data);
      } catch (err) {
        console.error('Error fetching tags:', err);
        setError('No se pudieron cargar las etiquetas');
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleSaveTag = async (data: { name: string; color: string }) => {
    try {
      if (editingTag) {
        // Update existing tag
        const updatedTag = await tagsService.updateTag(editingTag.id, data);
        setTags((prev) => prev.map((tag) => (tag.id === editingTag.id ? updatedTag : tag)));
      } else {
        // Create new tag
        const createdTag = await tagsService.createTag(data);
        setTags((prev) => [...prev, createdTag]);
      }
      setIsModalOpen(false);
      setEditingTag(null);
    } catch (err) {
      console.error('Error saving tag:', err);
      alert('Error al guardar la etiqueta');
    }
  };

  const openCreateModal = () => {
    setEditingTag(null);
    setIsModalOpen(true);
  };

  const handleTagClick = (tag: Tag) => {
    if (isFeatureEnabled('ENABLE_TAG_EDIT')) {
      setEditingTag(tag);
      setIsModalOpen(true);
    }
  };

  const handleDeleteTag = async () => {
    if (!editingTag) return;
    
    try {
      await tagsService.deleteTag(editingTag.id);
      setTags((prev) => prev.filter((tag) => tag.id !== editingTag.id));
      setIsModalOpen(false);
      setEditingTag(null);
    } catch (err) {
      console.error('Error deleting tag:', err);
      alert('Error al eliminar la etiqueta');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-transparent dark:border-gray-800 h-fit w-full md:w-64 transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <TagIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-gray-900 dark:text-white">Etiquetas</h3>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return null; // O mostrar un mensaje discreto
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-transparent dark:border-gray-800 h-fit w-full md:w-64 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TagIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-bold text-gray-900 dark:text-white">Etiquetas</h3>
        </div>
        {isFeatureEnabled('ENABLE_TAG_CREATION') && (
          <button
            onClick={openCreateModal}
            className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            title="Crear etiqueta"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {tags.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-2">No hay etiquetas</p>
          {isFeatureEnabled('ENABLE_TAG_CREATION') && (
            <button
              onClick={openCreateModal}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Crear una
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {tags.map((tag) => (
            <li 
              key={tag.id} 
              onClick={() => handleTagClick(tag)}
              className={`flex items-center gap-3 group p-2 rounded-xl transition-colors ${
                isFeatureEnabled('ENABLE_TAG_EDIT') ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full shadow-sm" 
                style={{ backgroundColor: tag.color || '#808080' }}
              />
              <span className="text-gray-600 dark:text-gray-300 font-medium text-sm group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {tag.name}
              </span>
              {isFeatureEnabled('ENABLE_TAG_EDIT') && (
                <Pencil className="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 ml-auto" />
              )}
            </li>
          ))}
        </ul>
      )}

      <TagModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTag(null);
        }}
        onSubmit={handleSaveTag}
        onDelete={
          editingTag && isFeatureEnabled('ENABLE_TAG_DELETION') 
            ? handleDeleteTag 
            : undefined
        }
        initialData={editingTag ? { name: editingTag.name, color: editingTag.color } : undefined}
        title={editingTag ? 'Editar Etiqueta' : 'Nueva Etiqueta'}
        submitLabel={editingTag ? 'Guardar Cambios' : 'Crear Etiqueta'}
      />
    </div>
  );
}
