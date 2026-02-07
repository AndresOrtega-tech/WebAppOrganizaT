import React, { useState, useEffect } from 'react';
import { X, Search, Loader2 } from 'lucide-react';

interface LinkItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (id: string) => Promise<void>;
  items: { id: string; title: string; description?: string; content?: string }[];
  title: string;
  isLoading?: boolean;
}

export default function LinkItemModal({
  isOpen,
  onClose,
  onLink,
  items,
  title,
  isLoading = false
}: LinkItemModalProps) {
  const [search, setSearch] = useState('');
  const [linkingId, setLinkingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setLinkingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
    (item.content && item.content.toLowerCase().includes(search.toLowerCase()))
  );

  const handleLink = async (id: string) => {
    setLinkingId(id);
    try {
      await onLink(id);
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
              autoFocus
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {isLoading ? (
               <div className="flex justify-center py-8">
                 <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
               </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No se encontraron elementos disponibles para vincular.
              </div>
            ) : (
              filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleLink(item.id)}
                  disabled={linkingId !== null}
                  className="w-full text-left p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group relative"
                >
                  <div className="pr-8">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    {(item.description || item.content) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {item.description || item.content}
                      </p>
                    )}
                  </div>
                  {linkingId === item.id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
