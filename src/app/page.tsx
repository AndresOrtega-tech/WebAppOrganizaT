import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, StickyNote, Tag, CheckSquare } from 'lucide-react';


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white font-sans">
      {/* Navbar */}
      <nav className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="OrganizaT Logo" width={40} height={40} className="w-10 h-10 object-contain" />
          <span className="text-2xl font-bold text-indigo-900 tracking-tight">OrganizaT</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-6 py-2.5 text-indigo-600 font-semibold hover:bg-indigo-50 rounded-full transition-all"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/register"
            className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200 transition-all"
          >
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Organiza tu vida, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              simplifica tu mente.
            </span>
          </h1>

          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            La plataforma integral para gestionar tus tareas y notas.
            Captura ideas, organiza prioridades y mantén el control de tu día a día con etiquetas personalizadas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Comenzar Ahora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-bold rounded-2xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md"
            >
              Crear Cuenta Gratis
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Gestión de Tareas</h3>
            <p className="text-gray-500 leading-relaxed">
              Crea, edita y completa tareas fácilmente. Establece fechas de vencimiento y mantén tus objetivos claros y alcanzables.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <StickyNote className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Notas Rápidas</h3>
            <p className="text-gray-500 leading-relaxed">
              No pierdas ninguna idea. Escribe notas, archívalas cuando no las necesites y accede a ellas en cualquier momento.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Tag className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Etiquetas Personalizadas</h3>
            <p className="text-gray-500 leading-relaxed">
              Organiza todo con colores. Asigna etiquetas a tareas y notas para filtrar y encontrar lo que buscas al instante.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">OrganizaT</span>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} OrganizaT. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
