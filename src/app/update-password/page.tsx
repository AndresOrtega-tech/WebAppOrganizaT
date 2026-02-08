'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { authService } from '@/services/auth.service';
import { Loader2, ArrowLeft, Lock } from 'lucide-react';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const hash = window.location.hash?.replace('#', '') || '';
    const params = new URLSearchParams(hash);
    const token = params.get('access_token') || '';

    if (!token) {
      setError('El enlace de recuperación es inválido o ha expirado.');
      return;
    }

    setAccessToken(token);
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!accessToken) {
      setError('El enlace de recuperación es inválido o ha expirado.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.changePassword(accessToken, newPassword);
      setSuccess(response.message || 'Contraseña actualizada exitosamente');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 font-sans">
      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-full flex justify-start mb-8">
          <Link 
            href="/login" 
            className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Regresar al Login
          </Link>
        </div>

        <div className="relative w-24 h-24 mb-4">
          <Image
            src="/logo.png"
            alt="OrganizaT Logo"
            fill
            className="object-contain"
            priority
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 tracking-tight text-center">
          Actualizar Contraseña
        </h1>
        <p className="mt-2 text-gray-500 font-medium text-center text-sm">
          Ingresa tu nueva contraseña para completar la recuperación.
        </p>

        <form className="w-full mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm text-center">
              {success}
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700">
                Nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading || !!success}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                placeholder="Repite la nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || !!success}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !!success}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Guardando...
              </span>
            ) : (
              'Actualizar Contraseña'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
