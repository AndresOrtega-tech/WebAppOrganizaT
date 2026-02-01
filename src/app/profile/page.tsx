'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, authService } from '@/services/auth.service';
import { Loader2, ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setAvatar(parsedUser.avatar || '');
    } catch (e) {
      console.error('Error parsing user data', e);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleUpdateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await authService.updateAvatar(token, avatar);
      
      // Update local state and local storage
      if (user) {
        // response.avatar es el nuevo string del avatar
        const updatedUser = { ...user, avatar: response.avatar || avatar };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      setSuccess(response.message || 'Avatar actualizado correctamente');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el avatar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link 
            href="/home" 
            className="p-2 -ml-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="ml-2 text-2xl font-bold text-gray-900">Mi Perfil</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-sm p-8 mb-6 text-center">
          <div className="w-24 h-24 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600 text-3xl font-bold">
            {user.avatar ? (
              user.avatar.substring(0, 2).toUpperCase()
            ) : (
              <UserIcon className="w-10 h-10" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{user.full_name}</h2>
          <p className="text-gray-500 font-medium">{user.email}</p>
        </div>

        {/* Edit Avatar Form */}
        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Editar Avatar</h3>
          
          <form onSubmit={handleUpdateAvatar} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="avatar" className="block text-sm font-bold text-gray-700">
                Nuevo Avatar
              </label>
              <input
                id="avatar"
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Escribe tu nuevo avatar"
              />
              <p className="text-xs text-gray-400 px-1">
                Este nombre será visible para identificar tu cuenta.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving || avatar === user.avatar}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
