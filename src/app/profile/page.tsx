'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { Loader2, ArrowLeft, Save, User as UserIcon, Lock } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setAvatar(parsedUser.avatar || '');
      } catch (e) {
        console.error('Error parsing user data', e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleUpdateAvatar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await userService.updateAvatar(avatar);
      
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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await userService.changePassword(newPassword);
      setPasswordSuccess(response.message || 'Contraseña actualizada correctamente');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link 
              href="/tasks" 
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 p-8 mb-6 text-center transition-colors">
          <div className="w-24 h-24 mx-auto bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 text-3xl font-bold transition-colors">
            {user.avatar ? (
              user.avatar.substring(0, 2).toUpperCase()
            ) : (
              <UserIcon className="w-10 h-10" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.full_name}</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{user.email}</p>
        </div>

        {/* Edit Avatar Form */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 p-8 transition-colors">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Editar Avatar</h3>
          
          <form onSubmit={handleUpdateAvatar} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
                {success}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="avatar" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Nuevo Avatar
              </label>
              <input
                id="avatar"
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Escribe tu nuevo avatar"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 px-1">
                Este nombre será visible para identificar tu cuenta.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving || avatar === user.avatar}
              className="w-full py-3.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* Change Password Form */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm dark:shadow-gray-800/50 border border-gray-100 dark:border-gray-800 p-8 mt-6 transition-colors">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Cambiar Contraseña</h3>
          
          <form onSubmit={handlePasswordChange} className="space-y-6">
            {passwordError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {passwordError}
              </div>
            )}
            
            {passwordSuccess && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
                {passwordSuccess}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Nueva Contraseña
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Repite la nueva contraseña"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword || !newPassword || !confirmPassword}
              className="w-full py-3.5 bg-gray-900 dark:bg-indigo-600 hover:bg-gray-800 dark:hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-gray-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isChangingPassword ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Actualizar Contraseña</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
