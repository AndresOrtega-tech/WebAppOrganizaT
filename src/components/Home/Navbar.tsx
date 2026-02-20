import Link from 'next/link';
import { User, LogOut, StickyNote, Calendar } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { User as UserType } from '@/services/auth.service';

interface NavbarProps {
  user: UserType | null;
  onLogout: () => void;
}

export default function Navbar({ onLogout }: NavbarProps) {
  return (
    <nav className="flex items-center justify-between py-4 px-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm rounded-none md:rounded-b-3xl mb-8">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
          OrganizaT
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        <Link 
          href="/notes" 
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 dark:bg-gray-800 hover:bg-amber-100 dark:hover:bg-gray-700 text-amber-600 dark:text-amber-400 transition-colors font-medium"
        >
          <StickyNote className="w-4 h-4" />
          <span>Notas</span>
        </Link>
        
        <Link 
          href="/events" 
          className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 dark:bg-gray-800 hover:bg-purple-100 dark:hover:bg-gray-700 text-purple-600 dark:text-purple-400 transition-colors font-medium"
        >
          <Calendar className="w-4 h-4" />
          <span>Eventos</span>
        </Link>

        <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block"></div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </div>
          
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors font-medium border border-indigo-500/20"
          >
            <span>Salir</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
