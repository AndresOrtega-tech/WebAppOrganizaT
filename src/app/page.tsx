import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  StickyNote,
  Tag,
  CheckSquare,
  CalendarDays,
  Sparkles,
  Link as LinkIcon,
  LayoutDashboard
} from 'lucide-react';
import AnimatedShowcase from '@/components/Home/AnimatedShowcase';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] font-sans selection:bg-indigo-500/30 text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* Navbar */}
      <nav className="fixed w-full z-50 top-0 px-6 py-4 border-b border-gray-100 dark:border-gray-800/50 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 md:w-10 md:h-10">
              <Image src="/logo.png" alt="OrganizaT Logo" fill className="object-contain" />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">OrganizaT</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/login"
              className="hidden sm:block px-5 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-full transition-all"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm lg:px-6 lg:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
            >
              Comenzar Gratis
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">

        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen" />
        </div>

        {/* Hero Section */}
        <div className="relative max-w-5xl mx-auto px-6 text-center space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-4 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>Productividad potenciada por IA</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            El sistema operativo para <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              tu vida personal y laboral.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Libera tu mente. Captura ideas rápidamente, organiza eventos, estructura tus tareas y deja que la IA resuma lo más importante. Todo profundamente interconectado.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-2xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
              Empieza ahora, es gratis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm"
            >
              Ya tengo una cuenta
            </Link>
          </div>
        </div>

        {/* Dashboard Preview / Mockup shape */}
        <div className="max-w-6xl mx-auto px-6 mt-20 md:mt-32">
          <AnimatedShowcase />
        </div>
      </main>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-[#0A0A0A] border-y border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
              Todo funciona mejor <span className="text-indigo-600 dark:text-indigo-400">junto.</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Diseñado con un nivel de integración profundo. Tus tareas bloquean tu calendario, tus eventos referencian notas, y la inteligencia artificial destila lo más importante.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Gestión de Tareas</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                Crea, edita y completa tareas al instante. Establece fechas límite claras y mantén tus objetivos trazados y alcanzables.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <StickyNote className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Editor de Notas Markdown</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                Un entorno libre de distracciones con soporte completo para Markdown. Estructura tus jerarquías, inserta viñetas y da formato premium a tus ideas.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CalendarDays className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Eventos y Tiempos</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                Controla tu agenda con eventos detallados. Asigna ubicaciones, establece rangos de horas o marca días completos para tener tu semana planificada.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Resúmenes IA Automatizados</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                Deja que Gemini IA trabaje para ti. Tus notas largas se analizan automáticamente extrayendo un resumen inteligente de la información clave.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <LinkIcon className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Relaciones Simétricas</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                Conecta los puntos. Vincula la nota de una reunión al evento del calendario, y asigna tareas pendientes extraídas directamente a ese mismo evento.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-12 h-12 bg-teal-50 dark:bg-teal-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Tag className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Etiquetas de Sistema Limitless</h3>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm">
                Clasifica absolutamente todo. Crea etiquetas con cualquier color y aplícalas a tareas, notas o eventos para filtrar tu vida personal y profesional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white dark:bg-[#050505]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">OrganizaT</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Iniciar sesión</Link>
            <Link href="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Registro</Link>
          </div>
          <p className="text-gray-400 dark:text-gray-600 text-sm">
            © {new Date().getFullYear()} OrganizaT. Software de uso libre.
          </p>
        </div>
      </footer>
    </div>
  );
}
