'use client';

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';

import HomeSidebar from '@/components/Home/HomeSidebar';
import HomeHeader from '@/components/Home/HomeHeader';
import CreateItemModal from '@/components/CreateItemModal';
import EventModal from '@/components/EventModal';

import { apiClient } from '@/services/api.client';
import { User } from '@/services/auth.service';
import { Event, eventsService } from '@/services/events.service';
import { Tag, tagsService } from '@/services/tags.service';
import { TASKS_MAX_PAGE_LIMIT, Task, taskService } from '@/services/task.service';

type CalendarViewMode = 'month' | 'week';
type CreateTab = 'task' | 'note';
type CalendarItemType = 'task' | 'event';

interface CalendarItem {
  id: string;
  type: CalendarItemType;
  title: string;
  dateKey: string;
  href: string;
  timeLabel: string;
  detailLabel: string;
  isCompleted?: boolean;
}

interface TooltipState {
  item: CalendarItem;
  left: number;
  top: number;
  mobile: boolean;
  viewMode: CalendarViewMode;
}

const weekdayShort = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toDateKey = (date: Date) => date.toLocaleDateString('sv');

const getTaskDateKey = (dueDate: string | null) => {
  if (!dueDate) return null;
  return dueDate.includes('T') ? dueDate.split('T')[0] : dueDate;
};

const getEventDateKey = (dateString: string) => new Date(dateString).toLocaleDateString('sv');

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const getWeekStart = (date: Date) => {
  const base = new Date(date);
  const day = base.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + offset);
  base.setHours(0, 0, 0, 0);
  return base;
};

const getMonthGridStart = (date: Date) => {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  return getWeekStart(monthStart);
};

const formatDateKey = (dateKey: string, options: Intl.DateTimeFormatOptions) =>
  parseDateKey(dateKey).toLocaleDateString('es-MX', options);

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString('es-MX', {
    month: 'long',
    year: 'numeric',
  });

const formatWeekLabel = (weekStart: Date) => {
  const weekEnd = addDays(weekStart, 6);
  const startLabel = weekStart.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
  const endLabel = weekEnd.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `Semana ${startLabel} — ${endLabel}`;
};

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const fetchCalendarTasksByTab = async (tab: 'pending' | 'completed') => {
  const allTasks: Task[] = [];
  let cursor: string | null | undefined = null;

  while (true) {
    const result = await taskService.getTasks({
      view: 'tasks',
      tab,
      limit: TASKS_MAX_PAGE_LIMIT,
      cursor: cursor ?? undefined,
    });

    allTasks.push(...result.tasks);

    if (!result.has_more || !result.next_cursor) {
      break;
    }

    cursor = result.next_cursor;
  }

  return allTasks;
};

const getTooltipPlacement = (target: HTMLElement, viewMode: CalendarViewMode) => {
  const rect = target.getBoundingClientRect();
  const mobile = window.innerWidth < 768;

  if (mobile) {
    return {
      left: 0,
      top: 0,
      mobile: true,
      viewMode,
    };
  }

  const padding = 16;
  const width = viewMode === 'month' ? 320 : 288;
  const estimatedHeight = 300;

  if (viewMode === 'month') {
    const nextLeft = clamp(rect.left + rect.width / 2 - width / 2, padding, window.innerWidth - width - padding);
    const belowTop = rect.bottom + 12;
    const aboveTop = rect.top - estimatedHeight - 12;

    return {
      left: nextLeft,
      top: belowTop + estimatedHeight <= window.innerHeight - padding
        ? belowTop
        : clamp(aboveTop, padding, window.innerHeight - estimatedHeight - padding),
      mobile: false,
      viewMode,
    };
  }

  const rightAlignedLeft = rect.right + 16;
  const leftAlignedLeft = rect.left - width - 16;
  const centeredLeft = clamp(rect.left + rect.width / 2 - width / 2, padding, window.innerWidth - width - padding);

  let nextLeft = centeredLeft;

  if (rightAlignedLeft + width <= window.innerWidth - padding) {
    nextLeft = rightAlignedLeft;
  } else if (leftAlignedLeft >= padding) {
    nextLeft = leftAlignedLeft;
  }

  return {
    left: nextLeft,
    top: clamp(rect.top - 24, padding, window.innerHeight - estimatedHeight - padding),
    mobile: false,
    viewMode,
  };
};

const getTaskTimeLabel = (task: Task) => {
  if (!task.due_date || !task.due_date.includes('T')) {
    return task.is_completed ? 'Completada' : 'Pendiente';
  }

  return task.is_completed ? `Lista • ${formatTime(task.due_date)}` : `Vence • ${formatTime(task.due_date)}`;
};

const getEventTimeLabel = (event: Event, dateKey: string) => {
  const startKey = getEventDateKey(event.start_time);
  const endKey = getEventDateKey(event.end_time);

  if (event.is_all_day) {
    if (startKey === endKey) return 'Todo el día';
    if (dateKey === startKey) return 'Inicia hoy';
    if (dateKey === endKey) return 'Cierra hoy';
    return 'En curso';
  }

  if (startKey === endKey) {
    return `${formatTime(event.start_time)} — ${formatTime(event.end_time)}`;
  }

  if (dateKey === startKey) return `Desde ${formatTime(event.start_time)}`;
  if (dateKey === endKey) return `Hasta ${formatTime(event.end_time)}`;
  return 'En curso';
};

export default function CalendarPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('sidebar_open');
    if (stored !== null) {
      return stored === 'true';
    }
    return window.innerWidth >= 768;
  });

  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toDateKey(new Date()));
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<CreateTab>('task');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('sidebar_open', String(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data', error);
      }
      return;
    }

    router.push('/login');
  }, [router]);

  const visibleRange = useMemo(() => {
    if (viewMode === 'week') {
      const startDate = getWeekStart(anchorDate);
      const endDate = addDays(startDate, 6);
      return {
        startDate,
        endDate,
        startKey: toDateKey(startDate),
        endKey: toDateKey(endDate),
      };
    }

    const startDate = getMonthGridStart(anchorDate);
    const endDate = addDays(startDate, 41);
    return {
      startDate,
      endDate,
      startKey: toDateKey(startDate),
      endKey: toDateKey(endDate),
    };
  }, [anchorDate, viewMode]);

  const visibleDays = useMemo(() => {
    const totalDays = viewMode === 'week' ? 7 : 42;
    return Array.from({ length: totalDays }, (_, index) => addDays(visibleRange.startDate, index));
  }, [viewMode, visibleRange.startDate]);

  const loadTags = useCallback(async () => {
    try {
      const tagsData = await tagsService.getTags();
      setTags(tagsData);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }, []);

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const [pendingTasks, completedTasks, eventsData] = await Promise.all([
        fetchCalendarTasksByTab('pending'),
        fetchCalendarTasksByTab('completed'),
        eventsService.getEvents({
          start_date: visibleRange.startKey,
          end_date: visibleRange.endKey,
        }),
      ]);

      const filteredTasks = [...pendingTasks, ...completedTasks].filter((task) => {
        const dateKey = getTaskDateKey(task.due_date);
        return Boolean(dateKey && dateKey >= visibleRange.startKey && dateKey <= visibleRange.endKey);
      });

      const filteredEvents = eventsData.filter((event) => {
        const startKey = getEventDateKey(event.start_time);
        const endKey = getEventDateKey(event.end_time);
        return endKey >= visibleRange.startKey && startKey <= visibleRange.endKey;
      });

      setTasks(filteredTasks);
      setEvents(filteredEvents);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      setErrorMessage('Error al cargar el calendario');
    } finally {
      setLoading(false);
    }
  }, [visibleRange.endKey, visibleRange.startKey]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  useEffect(() => {
    if (!user) return;
    void loadCalendarData();
  }, [loadCalendarData, user]);

  useEffect(() => {
    setTooltip(null);
  }, [anchorDate, selectedDateKey, viewMode]);

  useEffect(() => {
    if (!tooltip) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTooltip(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tooltip]);

  const calendarItems = useMemo<CalendarItem[]>(() => {
    const taskItems = tasks.flatMap<CalendarItem>((task) => {
      const dateKey = getTaskDateKey(task.due_date);
      if (!dateKey) return [];

      return [{
        id: task.id,
        type: 'task',
        title: task.title,
        dateKey,
        href: `/tasks/${task.id}?from=calendar`,
        timeLabel: getTaskTimeLabel(task),
        detailLabel: task.is_completed ? 'Tarea completada' : 'Abrir detalle de tarea',
        isCompleted: task.is_completed,
      }];
    });

    const eventItems = events.flatMap<CalendarItem>((event) => {
      const startKey = getEventDateKey(event.start_time);
      const endKey = getEventDateKey(event.end_time);
      const firstVisibleKey = startKey < visibleRange.startKey ? visibleRange.startKey : startKey;
      const lastVisibleKey = endKey > visibleRange.endKey ? visibleRange.endKey : endKey;
      const items: CalendarItem[] = [];

      let cursor = parseDateKey(firstVisibleKey);
      const endCursor = parseDateKey(lastVisibleKey);

      while (toDateKey(cursor) <= toDateKey(endCursor)) {
        const dateKey = toDateKey(cursor);
        items.push({
          id: event.id,
          type: 'event',
          title: event.title,
          dateKey,
          href: `/events/${event.id}?from=calendar`,
          timeLabel: getEventTimeLabel(event, dateKey),
          detailLabel: 'Abrir detalle del evento',
        });
        cursor = addDays(cursor, 1);
      }

      return items;
    });

    return [...taskItems, ...eventItems];
  }, [events, tasks, visibleRange.endKey, visibleRange.startKey]);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();

    calendarItems.forEach((item) => {
      const current = map.get(item.dateKey) ?? [];
      current.push(item);
      map.set(item.dateKey, current);
    });

    map.forEach((items, key) => {
      const sorted = [...items].sort((left, right) => {
        const leftRank = left.type === 'task' ? (left.isCompleted ? 3 : 1) : 2;
        const rightRank = right.type === 'task' ? (right.isCompleted ? 3 : 1) : 2;

        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }

        return left.title.localeCompare(right.title);
      });
      map.set(key, sorted);
    });

    return map;
  }, [calendarItems]);

  const selectedDateItems = itemsByDate.get(selectedDateKey) ?? [];
  const selectedPendingTasks = selectedDateItems.filter((item) => item.type === 'task' && !item.isCompleted).length;
  const selectedCompletedTasks = selectedDateItems.filter((item) => item.type === 'task' && item.isCompleted).length;
  const selectedEvents = selectedDateItems.filter((item) => item.type === 'event').length;

  const handleLogout = () => {
    apiClient.logout();
    router.push('/login');
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDateKey(toDateKey(date));

    if (viewMode === 'month' && date.getMonth() !== anchorDate.getMonth()) {
      setAnchorDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const handleShiftRange = (direction: 'previous' | 'next') => {
    const amount = direction === 'previous' ? -1 : 1;

    setAnchorDate((current) => {
      if (viewMode === 'week') {
        return addDays(current, amount * 7);
      }

      return new Date(current.getFullYear(), current.getMonth() + amount, 1);
    });
  };

  const handleGoToToday = () => {
    const today = new Date();
    setAnchorDate(today);
    setSelectedDateKey(toDateKey(today));
  };

  const handleOpenCreate = (tab: CreateTab) => {
    setCreateModalTab(tab);
    setIsCreateModalOpen(true);
  };

  const handleOpenTooltip = (item: CalendarItem, target: HTMLElement) => {
    setSelectedDateKey(item.dateKey);

    const placement = getTooltipPlacement(target, viewMode);
    setTooltip({
      item,
      ...placement,
    });
  };

  const handleDayKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>, day: Date) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    handleSelectDate(day);
  };

  const handleToggleTask = async (item: CalendarItem) => {
    if (item.type !== 'task') return;

    try {
      setTogglingTaskId(item.id);
      setErrorMessage(null);
      await taskService.updateTask(item.id, { is_completed: !item.isCompleted });

      setTasks((current) =>
        current.map((task) =>
          task.id === item.id
            ? {
              ...task,
              is_completed: !task.is_completed,
            }
            : task
        )
      );

      setTooltip((current) => {
        if (!current || current.item.id !== item.id || current.item.type !== 'task') {
          return current;
        }

        return {
          ...current,
          item: {
            ...current.item,
            isCompleted: !current.item.isCompleted,
            timeLabel: !current.item.isCompleted ? 'Completada' : 'Pendiente',
            detailLabel: !current.item.isCompleted ? 'Tarea completada' : 'Abrir detalle de tarea',
          },
        };
      });
    } catch (error) {
      console.error('Error updating task from calendar:', error);
      setErrorMessage('No pude actualizar el estado de la tarea desde el calendario');
    } finally {
      setTogglingTaskId(null);
    }
  };

  const calendarLabel = viewMode === 'month'
    ? formatMonthLabel(anchorDate)
    : formatWeekLabel(getWeekStart(anchorDate));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <div className="flex">
        <HomeSidebar
          tags={tags}
          user={user}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 p-4 md:p-8 transition-all duration-300">
          <div className="mx-auto flex max-w-7xl flex-col gap-8">
            <HomeHeader
              userName={user?.full_name || 'Usuario'}
              onNewItemClick={() => handleOpenCreate('task')}
              onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              createButtonLabel="Nueva Tarea"
              defaultTab="task"
            />

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] dark:border-gray-800 dark:bg-[#0f1117]">
              <div className="border-b border-gray-200 px-5 py-5 dark:border-gray-800 md:px-6">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
                        <Calendar className="h-3.5 w-3.5" />
                        vista viva
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        tareas y eventos en una sola capa
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                        fecha activa
                      </p>
                      <h2 className="text-2xl font-black tracking-tight text-gray-950 dark:text-white md:text-3xl">
                        {formatDateKey(selectedDateKey, {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </h2>
                      <p className="max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
                        {selectedDateItems.length === 0
                          ? 'No hay movimiento para este día. Podés usarlo como punto de partida para capturar una tarea o dejar una nota.'
                          : `Tenés ${selectedPendingTasks} tareas pendientes, ${selectedCompletedTasks} tareas cerradas y ${selectedEvents} eventos en esta fecha.`}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                        <span className="h-2 w-2 rounded-full bg-white dark:bg-slate-900" />
                        tarea pendiente
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        tarea completada
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        evento
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:w-[21rem] xl:grid-cols-1">
                    <button
                      type="button"
                      onClick={() => handleOpenCreate('task')}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-left text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">Fecha seleccionada</p>
                        <p className="text-sm font-bold">Agregar tarea</p>
                      </div>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEventModalOpen(true)}
                      className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-amber-900 transition-transform hover:-translate-y-0.5 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-70">Fecha seleccionada</p>
                        <p className="text-sm font-bold">Agregar evento</p>
                      </div>
                      <CalendarDays className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6 px-5 py-5 md:px-6 md:py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('month')}
                      className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors ${viewMode === 'month'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                    >
                      Mes
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('week')}
                      className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors ${viewMode === 'week'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
                        }`}
                    >
                      Semana
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleShiftRange('previous')}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      anterior
                    </button>
                    <button
                      type="button"
                      onClick={handleGoToToday}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sky-50 px-4 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/50"
                    >
                      <CalendarDays className="h-4 w-4" />
                      hoy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftRange('next')}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-900"
                    >
                      siguiente
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-800 dark:bg-[#0b0d12]">
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-500 dark:text-gray-400">
                    ventana activa
                  </p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-gray-950 dark:text-white">
                    {calendarLabel}
                  </h3>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-gray-200 px-4 py-12 text-sm font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                    Cargando mapa temporal...
                  </div>
                ) : (
                  <>
                    {viewMode === 'month' ? (
                      <div className="overflow-x-auto pb-2">
                        <div className="min-w-[56rem] space-y-3">
                          <div className="grid grid-cols-7 gap-3">
                            {weekdayShort.map((day) => (
                              <div
                                key={day}
                                className="px-2 text-xs font-bold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400"
                              >
                                {day}
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-3">
                            {visibleDays.map((day) => {
                              const dateKey = toDateKey(day);
                              const items = itemsByDate.get(dateKey) ?? [];
                              const isSelected = dateKey === selectedDateKey;
                              const isCurrentMonth = day.getMonth() === anchorDate.getMonth();
                              const isToday = dateKey === toDateKey(new Date());
                              const visibleItems = items.slice(0, 3);
                              const hiddenCount = items.length - visibleItems.length;

                              return (
                                <div
                                  key={dateKey}
                                  onClick={() => handleSelectDate(day)}
                                  onKeyDown={(event) => handleDayKeyDown(event, day)}
                                  role="button"
                                  tabIndex={0}
                                  className={`min-h-[10rem] rounded-[1.6rem] border p-3 text-left transition-all ${isSelected
                                    ? 'border-sky-300 bg-sky-50/80 dark:border-sky-700 dark:bg-sky-950/20'
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-[#131722] dark:hover:border-gray-700 dark:hover:bg-[#151a27]'
                                    } ${!isCurrentMonth ? 'opacity-55' : ''}`}
                                >
                                  <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                                        {formatDateKey(dateKey, { weekday: 'short' })}
                                      </p>
                                      <div className="mt-1 flex items-center gap-2">
                                        <span className={`text-lg font-black ${isToday ? 'text-sky-600 dark:text-sky-300' : 'text-gray-950 dark:text-white'}`}>
                                          {formatDateKey(dateKey, { day: 'numeric' })}
                                        </span>
                                        {isToday && (
                                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                                            hoy
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {items.length > 0 && (
                                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                                        {items.length}
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    {visibleItems.map((item) => (
                                      <button
                                        type="button"
                                        key={`${item.type}-${item.id}-${item.dateKey}`}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleOpenTooltip(item, event.currentTarget);
                                        }}
                                        className={`flex min-h-11 w-full items-start gap-2 rounded-2xl border px-3 py-2 text-left transition-transform hover:-translate-y-0.5 ${item.type === 'task'
                                          ? item.isCompleted
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-200'
                                            : 'border-slate-200 bg-slate-900 text-white dark:border-slate-700 dark:bg-slate-800'
                                          : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-100'
                                          }`}
                                      >
                                        <span className="mt-0.5 shrink-0">
                                          {item.type === 'task' ? (
                                            item.isCompleted ? <CheckCheck className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />
                                          ) : (
                                            <Calendar className="h-4 w-4" />
                                          )}
                                        </span>
                                        <span className="min-w-0">
                                          <span className="block truncate text-sm font-semibold">{item.title}</span>
                                          <span className={`mt-0.5 block text-xs ${item.type === 'task' && !item.isCompleted ? 'text-white/70 dark:text-slate-300' : 'opacity-80'}`}>
                                            {item.timeLabel}
                                          </span>
                                        </span>
                                      </button>
                                    ))}

                                    {hiddenCount > 0 && (
                                      <div className="rounded-2xl border border-dashed border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                        + {hiddenCount} más en este día
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
                        {visibleDays.map((day) => {
                          const dateKey = toDateKey(day);
                          const items = itemsByDate.get(dateKey) ?? [];
                          const isSelected = dateKey === selectedDateKey;
                          const isToday = dateKey === toDateKey(new Date());

                          return (
                            <div
                              key={dateKey}
                              onClick={() => handleSelectDate(day)}
                              onKeyDown={(event) => handleDayKeyDown(event, day)}
                              role="button"
                              tabIndex={0}
                              className={`rounded-[1.6rem] border p-4 text-left transition-all ${isSelected
                                ? 'border-sky-300 bg-sky-50/70 dark:border-sky-700 dark:bg-sky-950/20'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-[#131722] dark:hover:border-gray-700 dark:hover:bg-[#151a27]'
                                }`}
                            >
                              <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                                    {formatDateKey(dateKey, { weekday: 'long' })}
                                  </p>
                                  <h4 className="mt-1 text-lg font-black text-gray-950 dark:text-white">
                                    {formatDateKey(dateKey, { day: 'numeric', month: 'short' })}
                                  </h4>
                                </div>
                                {isToday && (
                                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                                    hoy
                                  </span>
                                )}
                              </div>

                              <div className="space-y-2">
                                {items.length === 0 ? (
                                  <div className="rounded-2xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400 dark:border-gray-700 dark:text-gray-500">
                                    Día limpio.
                                  </div>
                                ) : (
                                  items.map((item) => (
                                    <button
                                      type="button"
                                      key={`${item.type}-${item.id}-${item.dateKey}`}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleOpenTooltip(item, event.currentTarget);
                                      }}
                                      className={`flex min-h-11 w-full items-start gap-2 rounded-2xl border px-3 py-3 text-left transition-transform hover:-translate-y-0.5 ${item.type === 'task'
                                        ? item.isCompleted
                                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-200'
                                          : 'border-slate-200 bg-slate-900 text-white dark:border-slate-700 dark:bg-slate-800'
                                        : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-100'
                                        }`}
                                    >
                                      <span className="mt-0.5 shrink-0">
                                        {item.type === 'task' ? (
                                          item.isCompleted ? <CheckCheck className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />
                                        ) : (
                                          <Calendar className="h-4 w-4" />
                                        )}
                                      </span>
                                      <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold">{item.title}</span>
                                        <span className={`mt-0.5 block text-xs ${item.type === 'task' && !item.isCompleted ? 'text-white/70 dark:text-slate-300' : 'opacity-80'}`}>
                                          {item.timeLabel}
                                        </span>
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      {tooltip && (
        <>
          <button
            type="button"
            aria-label="Cerrar tooltip"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setTooltip(null)}
          />

          <div
            className={`fixed z-50 rounded-[1.75rem] border border-gray-200 bg-white shadow-[0_28px_80px_-36px_rgba(15,23,42,0.6)] dark:border-gray-800 dark:bg-[#11151f] ${tooltip.mobile ? 'inset-x-4 bottom-4' : tooltip.viewMode === 'month' ? 'w-[20rem]' : 'w-[18rem]'}`}
            style={tooltip.mobile ? undefined : { left: tooltip.left, top: tooltip.top }}
          >
            <div className="border-b border-gray-200 bg-gray-50/80 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/60">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">
                    {tooltip.item.type === 'task' ? 'tarea' : 'evento'}
                  </p>
                  <h3 className="mt-1 truncate text-lg font-black tracking-tight text-gray-950 dark:text-white">
                    {tooltip.item.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {formatDateKey(tooltip.item.dateKey, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setTooltip(null)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-900 dark:hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 px-4 py-4">
              <div className={`rounded-2xl border px-3 py-3 text-sm ${tooltip.item.type === 'task'
                ? tooltip.item.isCompleted
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200'
                : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-100'
                }`}>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4" />
                  <span className="font-semibold">{tooltip.item.timeLabel}</span>
                </div>
              </div>

              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => router.push(tooltip.item.href)}
                  className="inline-flex min-h-11 items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-gray-200"
                >
                  {tooltip.item.detailLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>

                {tooltip.item.type === 'task' && (
                  <button
                    type="button"
                    onClick={() => void handleToggleTask(tooltip.item)}
                    disabled={togglingTaskId === tooltip.item.id}
                    className={`inline-flex min-h-11 items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${tooltip.item.isCompleted
                      ? 'border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100 dark:hover:bg-amber-900/35'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100 dark:hover:bg-emerald-900/35'
                      }`}
                  >
                    <span>{tooltip.item.isCompleted ? 'Marcar como no completada' : 'Marcar como completada'}</span>
                    {togglingTaskId === tooltip.item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          void Promise.all([loadTags(), loadCalendarData()]);
          setIsCreateModalOpen(false);
        }}
        initialTab={createModalTab}
        disableTabs={true}
        initialSelectedDate={selectedDateKey}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onEventSaved={() => {
          setIsEventModalOpen(false);
          void loadCalendarData();
        }}
      />
    </div>
  );
}
