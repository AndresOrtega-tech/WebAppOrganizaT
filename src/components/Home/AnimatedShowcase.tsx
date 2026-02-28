'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckSquare, StickyNote, Link as LinkIcon, Plus } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export default function AnimatedShowcase() {
    const [step, setStep] = useState(0);
    const { theme } = useTheme();

    const captions: Record<number, string> = {
        0: 'Organiza todo en un solo lugar.',
        1: 'Captura tareas en segundos.',
        2: 'Guarda contexto en notas.',
        3: 'Resume con IA lo más importante.',
        4: 'Convierte texto largo en puntos claros.',
        5: 'Vincula notas con tareas.',
        6: 'Todo queda interconectado.'
    };

    // Animation Loop Sequence
    useEffect(() => {
        const sequence = async () => {
            while (true) {
                // Step 0: Blank state
                setStep(0);
                await new Promise((r) => setTimeout(r, 1500));

                // Step 1: User creates a Task
                setStep(1);
                await new Promise((r) => setTimeout(r, 2000));

                // Step 2: User creates a Note and types content
                setStep(2);
                await new Promise((r) => setTimeout(r, 2500));

                // Step 3: Mouse clicks "Resumir con IA"
                setStep(3);
                await new Promise((r) => setTimeout(r, 1500));

                // Step 4: AI generates summary
                setStep(4);
                await new Promise((r) => setTimeout(r, 2500));

                // Step 5: Mouse clicks "Vincular" -> connects Note to Task
                setStep(5);
                await new Promise((r) => setTimeout(r, 1000));

                // Step 6: Visual Confirmation of link 
                setStep(6);
                await new Promise((r) => setTimeout(r, 4500));
            }
        };
        sequence();
    }, []);

    return (
        <div className="relative rounded-2xl lg:rounded-[2rem] border border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/80 backdrop-blur-xl p-2 md:p-4 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent dark:from-[#050505] dark:via-transparent dark:to-transparent z-10 pointer-events-none" />

            {/* Mockup Window Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-900 rounded-t-xl">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="ml-4 flex items-center justify-center flex-1">
                    <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-md w-full max-w-xs flex items-center justify-center">
                        <span className="text-[10px] text-gray-400 font-mono">app.organizat.com</span>
                    </div>
                </div>
            </div>

            {/* Mockup Content / Split View */}
            <div className="aspect-[16/11] md:aspect-[21/9] bg-white dark:bg-[#0A0A0A] rounded-b-xl lg:rounded-b-2xl relative overflow-hidden flex flex-col md:flex-row text-left border-t border-gray-100 dark:border-gray-800">

                {/* Left Column: Tasks */}
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 p-4 shrink-0 flex flex-col gap-4 bg-gray-50/50 dark:bg-[#080808]">
                    <div className="flex items-center justify-between">
                        <h3 className="text-gray-900 dark:text-white font-bold flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-indigo-500" /> Tareas
                        </h3>
                        <div className="w-6 h-6 rounded-md bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                            <Plus className="w-4 h-4" />
                        </div>
                    </div>

                    <div className="flex-1 space-y-3">
                        <AnimatePresence>
                            {step >= 1 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-xl shadow-sm relative overflow-hidden ${step === 1 ? 'ring-2 ring-indigo-500/70 ring-offset-2 ring-offset-gray-50 dark:ring-offset-[#080808]' : ''}`}
                                >
                                    {/* Subtle highlight effect on link */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: step >= 6 ? 1 : 0 }}
                                        className="absolute inset-0 bg-indigo-50 dark:bg-indigo-500/10 pointer-events-none"
                                    />

                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-600 shrink-0 mt-0.5" />
                                        <div className="space-y-2">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Preparar presentación Q3</p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">Vence: Hoy</p>

                                            <AnimatePresence>
                                                {step >= 6 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className={`text-[10px] font-bold px-2 py-1 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-md inline-flex items-center gap-1 border border-indigo-100 dark:border-indigo-500/30 shadow-sm ${step === 6 ? 'ring-2 ring-indigo-500/70 ring-offset-2 ring-offset-gray-50 dark:ring-offset-[#080808]' : ''}`}
                                                    >
                                                        <LinkIcon className="w-3 h-3" /> 1 Nota vinculada
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column: Notes */}
                <div className={`w-full md:w-2/3 p-4 md:p-6 flex flex-col relative bg-white dark:bg-[#0A0A0A] ${step === 2 ? 'ring-2 ring-purple-500/60 ring-offset-2 ring-offset-white dark:ring-offset-[#0A0A0A]' : ''}`}>
                    <AnimatePresence>
                        {step >= 2 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col h-full"
                            >
                                {/* Note Header */}
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <StickyNote className="w-5 h-5 md:w-6 md:h-6 text-amber-500" /> Reunión Q3 🚀
                                    </h3>

                                    <div className="flex gap-2">
                                        <motion.div
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${step === 3 ? 'bg-indigo-600 text-white shadow-md scale-95'
                                                : step >= 4 ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-400 dark:text-indigo-400/50 cursor-not-allowed'
                                                    : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm'
                                                } ${step === 3 || step === 4 ? 'ring-2 ring-indigo-500/70 ring-offset-2 ring-offset-white dark:ring-offset-[#0A0A0A]' : ''} flex items-center gap-1.5`}
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Resumir IA</span>
                                            <span className="sm:hidden">IA</span>
                                        </motion.div>

                                        <motion.div
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${step === 5 ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 scale-95 shadow-md'
                                                : step >= 6 ? 'bg-green-500 text-white border-transparent'
                                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm'
                                                } ${step === 5 ? 'ring-2 ring-gray-900/60 dark:ring-white/60 ring-offset-2 ring-offset-white dark:ring-offset-[#0A0A0A]' : ''} flex items-center gap-1.5`}
                                        >
                                            {step >= 6 ? <CheckSquare className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                                            <span className="hidden sm:inline">{step >= 6 ? 'Vinculado' : 'Vincular Tarea'}</span>
                                            <span className="sm:hidden">{step >= 6 ? '✓' : 'Vincular'}</span>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Note Content */}
                                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 flex-1 relative">
                                    <motion.p
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        Discutimos la estrategia para el próximo trimestre. Necesitamos revisar urgentemente los OKRs generales, actualizar todas las diapositivas de ventas para el pitch del viernes, y agendar una llamada de sincronización con marketing.
                                    </motion.p>

                                    {/* AI Summary Block */}
                                    <AnimatePresence>
                                        {step >= 4 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className={`mt-6 p-4 md:p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/50 shadow-sm relative ${step === 4 ? 'ring-2 ring-indigo-500/60 ring-offset-2 ring-offset-white dark:ring-offset-[#0A0A0A]' : ''}`}
                                            >
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                    <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">Resumen IA</span>
                                                </div>
                                                {step === 4 ? (
                                                    <div className="space-y-2.5 animate-pulse mt-2">
                                                        <div className="h-3 bg-indigo-200/60 dark:bg-indigo-800/60 rounded w-full"></div>
                                                        <div className="h-3 bg-indigo-200/60 dark:bg-indigo-800/60 rounded w-5/6"></div>
                                                        <div className="h-3 bg-indigo-200/60 dark:bg-indigo-800/60 rounded w-4/6"></div>
                                                    </div>
                                                ) : (
                                                    <motion.ul
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="list-disc pl-5 space-y-1.5 text-indigo-950 dark:text-indigo-100 mt-2 font-medium"
                                                    >
                                                        <li>Revisar OKRs generales.</li>
                                                        <li>Actualizar slides de ventas (Pitch Viernes).</li>
                                                        <li>Sincronización con equipo MKT.</li>
                                                    </motion.ul>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Animated Mouse Cursor */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{
                        left: step < 3 ? '72%' : step === 3 ? '62%' : step === 4 ? '62%' : step === 5 ? '84%' : '72%',
                        top: step < 3 ? '22%' : step === 3 ? '18%' : step === 4 ? '18%' : step === 5 ? '18%' : '22%',
                        opacity: 0
                    }}
                    transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                    className="absolute z-50 pointer-events-none hidden"
                    style={{ transformOrigin: 'top left' }}
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-black/20 blur-sm scale-110 rounded-full" />
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            className="relative z-10"
                        >
                            <path
                                d="M5.5 3.5L5.5 18.5L9.5 14.5L13.5 20.5L16.5 18.5L12.5 12.5L18.5 12.5L5.5 3.5Z"
                                fill={theme === 'dark' ? '#FCD34D' : '#1F2937'}
                                stroke={theme === 'dark' ? 'black' : 'white'}
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {(step === 3 || step === 5) && (
                            <motion.div
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{ scale: 4, opacity: 0 }}
                                transition={{ duration: 0.6 }}
                                className="absolute inset-0 border-4 border-blue-500 rounded-full"
                            />
                        )}
                    </div>
                </motion.div>

                <div className="absolute left-4 right-4 bottom-4 z-40 pointer-events-none">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                            className="mx-auto w-fit max-w-full px-4 py-2 rounded-full bg-white/90 dark:bg-gray-900/80 border border-gray-200/70 dark:border-gray-700/60 backdrop-blur text-xs md:text-sm font-semibold text-gray-700 dark:text-gray-200 shadow-sm"
                        >
                            {captions[step] ?? captions[0]}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
