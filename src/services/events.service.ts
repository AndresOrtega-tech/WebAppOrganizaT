import { apiClient } from './api.client';
import type { Task } from './task.service';
import type { Note } from './notes.service';

export interface Reminder {
  value: number;
  unit: string;
}

export interface ReminderData {
  id: string;
  remind_at: string;
  status: string;
}

export interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  is_all_day: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  reminders_data: ReminderData[];
  has_reminder: boolean;
  tasks?: Task[];
  notes?: Note[];
}

export interface CreateEventRequest {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  is_all_day: boolean;
  reminders?: Reminder[] | null;
}

export interface EventFilters {
  start_date?: string;
  end_date?: string;
}

interface EventApiResponse extends Omit<Event, 'tasks' | 'notes'> {
  tasks?: Task[];
  notes?: Note[];
  [key: string]: unknown;
}

const mapEventResponse = (data: unknown): Event => {
  const d = data as EventApiResponse;
  return {
    ...d,
    tasks: d.tasks || [],
    notes: d.notes || [],
    reminders_data: d.reminders_data || [],
  };
};

export const eventsService = {
  async updateEvent(eventId: string, event: Partial<CreateEventRequest>): Promise<Event> {
    const data = await apiClient.patch(`/events/${eventId}`, event);
    return mapEventResponse(data);
  },

  async deleteEvent(eventId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}`);
  },

  async linkTaskToEvent(eventId: string, taskId: string): Promise<void> {
    await apiClient.post('/events/tasks', { event_id: eventId, task_id: taskId });
  },

  async unlinkTaskFromEvent(eventId: string, taskId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/tasks/${taskId}`);
  },

  async linkNoteToEvent(eventId: string, noteId: string): Promise<void> {
    await apiClient.post('/events/notes', { event_id: eventId, note_id: noteId });
  },

  async unlinkNoteFromEvent(eventId: string, noteId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/notes/${noteId}`);
  },

  async getEventById(eventId: string): Promise<Event> {
    const data = await apiClient.get(`/events/${eventId}`);
    return mapEventResponse(data);
  },

  async getEvents(filters?: EventFilters): Promise<Event[]> {
    const params = new URLSearchParams();

    if (filters?.start_date) {
      params.append('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params.append('end_date', filters.end_date);
    }

    const queryString = params.toString();
    const url = `/events/${queryString ? `?${queryString}` : ''}`;
    const data = await apiClient.get(url);
    return (data as unknown[]).map(mapEventResponse);
  },

  async createEvent(event: CreateEventRequest): Promise<Event> {
    const data = await apiClient.post('/events/', event);
    return mapEventResponse(data);
  },
};
