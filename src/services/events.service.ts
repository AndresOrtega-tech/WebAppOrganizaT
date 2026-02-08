import { API_BASE_URL } from './auth.service';
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
  async updateEvent(token: string, eventId: string, event: Partial<CreateEventRequest>): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error updating event');
    }

    return response.json();
  },
  async deleteEvent(token: string, eventId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error deleting event');
    }
  },
  async linkTaskToEvent(token: string, eventId: string, taskId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/events/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ event_id: eventId, task_id: taskId }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error linking task to event');
    }
  },
  async unlinkTaskFromEvent(token: string, eventId: string, taskId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error unlinking task from event');
    }
  },
  async linkNoteToEvent(token: string, eventId: string, noteId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/events/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ event_id: eventId, note_id: noteId }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error linking note to event');
    }
  },
  async unlinkNoteFromEvent(token: string, eventId: string, noteId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}/notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error unlinking note from event');
    }
  },
  async getEventById(token: string, eventId: string): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error loading event');
    }

    return response.json();
  },
  async getEvents(token: string, filters?: EventFilters): Promise<Event[]> {
    const params = new URLSearchParams();

    if (filters?.start_date) {
      params.append('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params.append('end_date', filters.end_date);
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/events/${queryString ? `?${queryString}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error loading events');
    }

    return response.json();
  },
  async createEvent(token: string, event: CreateEventRequest): Promise<Event> {
    const response = await fetch(`${API_BASE_URL}/events/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error creating event');
    }

    return response.json();
  },
};
