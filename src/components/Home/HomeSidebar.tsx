import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  CheckSquare, 
  StickyNote, 
  CalendarDays, 
  Tag as TagIcon, 
  LogOut,
  X
} from 'lucide-react';
import { Tag } from '@/services/tags.service';
import { User } from '@/services/auth.service';
import { isFeatureEnabled } from '@/config/features';
import ThemeToggle from '@/components/ThemeToggle';
import { taskService } from '@/services/task.service';
import { notesService } from '@/services/notes.service';
import { eventsService } from '@/services/events.service';

interface HomeSidebarProps {
  tags: Tag[];
  user: User | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function HomeSidebar({ tags, user, onLogout, isOpen, onClose }: HomeSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const prefetchRouteAndData = (href: string) => {
    try {
      router.prefetch(href);
      const today = new Date();
      const todayLocal = today.toLocaleDateString('sv');
      const in7 = new Date(today);
      in7.setDate(in7.getDate() + 7);
      const in7Local = in7.toLocaleDateString('sv');

      if (href === '/home') {
        // Warm home tasks using backend view=home rules
        void taskService.getTasks({
          view: 'home',
        });
        if (isFeatureEnabled('ENABLE_NOTES_VIEW')) {
          void notesService.getNotes();
        }
        if (isFeatureEnabled('ENABLE_EVENTS_VIEW')) {
          void eventsService.getEvents({ start_date: todayLocal });
        }
      } else if (href === '/tasks') {
        void taskService.getTasks({
          view: 'tasks',
        });
      } else if (href === '/notes') {
        void notesService.getNotes();
      } else if (href === '/events') {
        void eventsService.getEvents({ start_date: todayLocal });
      }
    } catch {
      // best-effort prefetch; ignore errors
    }
  };

  const navItems = [
    { name: 'Inicio', href: '/home', icon: Home, enabled: true },
    { name: 'Tareas', href: '/tasks', icon: CheckSquare, enabled: true },
    { name: 'Notas', href: '/notes', icon: StickyNote, enabled: isFeatureEnabled('ENABLE_NOTES_VIEW') },
    { name: 'Eventos', href: '/events', icon: CalendarDays, enabled: isFeatureEnabled('ENABLE_EVENTS_VIEW') },
    { name: 'Etiquetas', href: '/tags', icon: TagIcon, enabled: isFeatureEnabled('ENABLE_TAGS_VIEW') },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed md:sticky top-0 left-0 z-30 h-screen
          bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
          flex flex-col overflow-hidden
          ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:w-0 md:translate-x-0'}
        `}
      >
        {/* Logo & Close Button */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold">
               O
             </div>
             <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">organizaT</span>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Menu */}
      <nav className="px-4 space-y-1">
        <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menú</p>
        {navItems.filter(item => item.enabled).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              onMouseEnter={() => prefetchRouteAndData(item.href)}
              onFocus={() => prefetchRouteAndData(item.href)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Tags */}
      {isFeatureEnabled('ENABLE_TAGS_VIEW') && (
        <div className="px-4 mt-8 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between px-4 mb-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Etiquetas</p>
          </div>
          <div className="space-y-1">
            {tags.slice(0, 5).map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-default"
              >
                <TagIcon className="w-4 h-4" style={{ color: tag.color }} />
                <span className="truncate">{tag.name}</span>
              </div>
            ))}
            {tags.length > 5 && (
               <Link href="/tasks" className="block px-4 py-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                 Ver todas ({tags.length})
               </Link>
            )}
          </div>
        </div>
      )}

      {/* Theme Toggle & User */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between px-2">
           <span className="text-sm text-gray-500 dark:text-gray-400">Tema</span>
           <ThemeToggle />
        </div>
        
        {user && (
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
              {user.avatar || user.full_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.full_name}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
