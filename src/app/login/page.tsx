'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authService } from '@/services/auth.service';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { isFeatureEnabled } from '@/config/features';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });
      
      // Guardar token en localStorage
      localStorage.setItem('access_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      localStorage.setItem('user', JSON.stringify(response.user));
      
      router.push('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 font-sans">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Back Button */}
        <div className="w-full flex justify-start mb-8">
          <Link 
            href="/" 
            className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Regresar
          </Link>
        </div>

        {/* Logo */}
        <div className="relative w-24 h-24 mb-4">
          <Image
            src="/logo.png"
            alt="OrganizaT Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        {/* Title & Slogan */}
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Organiza<span className="text-indigo-600">T</span>
        </h1>
        <p className="mt-2 text-gray-500 font-medium">
          Tu vida, más organizada.
        </p>

        {/* Form */}
        <form className="w-full mt-10 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-bold text-gray-700">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                placeholder="usuario@organizat.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-bold text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 pr-16"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <Link 
              href="/forgot-password" 
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Iniciando...
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>

          {/* Register Link */}
          {isFeatureEnabled('ENABLE_REGISTRATION') && (
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm font-medium">
                ¿No tienes una cuenta?{' '}
                <Link href="/register" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                  Regístrate
                </Link>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
