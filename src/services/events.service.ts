import { API_BASE_URL } from './auth.service';
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

export const eventsService = {
  async updateEvent(eventId: string, event: Partial<CreateEventRequest>): Promise<Event> {
    const response = await apiClient.fetch<Event>(`${API_BASE_URL}/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    return response;
  },
  async deleteEvent(eventId: string): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/events/${eventId}`, {
      method: 'DELETE',
    });
  },
  async linkTaskToEvent(eventId: string, taskId: string): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/events/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_id: eventId, task_id: taskId }),
    });
  },
  async unlinkTaskFromEvent(eventId: string, taskId: string): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/events/${eventId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },
  async linkNoteToEvent(eventId: string, noteId: string): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/events/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_id: eventId, note_id: noteId }),
    });
  },
  async unlinkNoteFromEvent(eventId: string, noteId: string): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/events/${eventId}/notes/${noteId}`, {
      method: 'DELETE',
    });
  },
  async getEventById(eventId: string): Promise<Event> {
    const response = await apiClient.fetch<Event>(`${API_BASE_URL}/events/${eventId}`, {
      method: 'GET',
    });

    return response;
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
    const url = `${API_BASE_URL}/events/${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.fetch<Event[]>(url, {
      method: 'GET',
    });

    return response;
  },
  async createEvent(event: CreateEventRequest): Promise<Event> {
    const response = await apiClient.fetch<Event>(`${API_BASE_URL}/events/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    return response;
  },
};
