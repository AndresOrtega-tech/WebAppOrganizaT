'use client';

import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function RegistrationConfirmationPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 font-sans">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="mx-auto w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center">
          <Mail className="w-10 h-10 text-indigo-600" />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Confirma tu correo
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed">
            Hemos enviado un enlace de confirmación a tu dirección de correo electrónico. 
            Por favor, revísalo para activar tu cuenta.
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <p className="text-sm text-gray-600 mb-4">
            ¿Ya confirmaste tu correo?
          </p>
          <div className="flex flex-col gap-3">
             <Link
              href="/login"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 block"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
