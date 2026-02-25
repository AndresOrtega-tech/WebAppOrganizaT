import { apiClient } from './api.client';
import type { Task, Tag } from './task.service';
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
  tags?: Tag[];
  tasks?: Task[];
  notes?: Note[];
}

export interface EventRelatedData {
  tags: Tag[];
  tasks: Task[];
  notes: Note[];
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
  async getEvents(filters?: EventFilters): Promise<Event[]> {
    const params = new URLSearchParams();
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const queryString = params.toString();
    const url = `/events/${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<Event[]>(url);
  },

  async getEventById(eventId: string): Promise<Event> {
    return apiClient.get<Event>(`/events/${eventId}`);
  },

  async getEventRelations(eventId: string): Promise<EventRelatedData> {
    return apiClient.get<EventRelatedData>(`/events/${eventId}/related`);
  },

  async createEvent(event: CreateEventRequest): Promise<Event> {
    return apiClient.post<Event>('/events/', event);
  },

  async updateEvent(eventId: string, event: Partial<CreateEventRequest>): Promise<Event> {
    return apiClient.patch<Event>(`/events/${eventId}`, event);
  },

  async deleteEvent(eventId: string): Promise<void> {
    return apiClient.delete(`/events/${eventId}`);
  },

  async assignTagsToEvent(eventId: string, tagIds: string[]): Promise<void> {
    // La nueva API acepta body: { tag_id: string } uno a uno.
    if (tagIds.length === 0) return;
    await Promise.all(
      tagIds.map(tagId => apiClient.post(`/events/${eventId}/tags`, { tag_id: tagId }))
    );
  },

  async removeTagFromEvent(eventId: string, tagId: string): Promise<void> {
    return apiClient.delete(`/events/${eventId}/tags/${tagId}`);
  },

  // Manejo directo con apiClient hacia las nuevas rutas unificadas de relations
  async linkTaskToEvent(eventId: string, taskId: string): Promise<void> {
    await apiClient.post('/relations/task-event', {
      task_id: taskId,
      event_id: eventId,
    });
  },

  async unlinkTaskFromEvent(eventId: string, taskId: string): Promise<void> {
    await apiClient.deleteWithBody('/relations/task-event', {
      task_id: taskId,
      event_id: eventId,
    });
  },

  async linkNoteToEvent(eventId: string, noteId: string): Promise<void> {
    await apiClient.post('/relations/note-event', {
      note_id: noteId,
      event_id: eventId,
    });
  },

  async unlinkNoteFromEvent(eventId: string, noteId: string): Promise<void> {
    await apiClient.deleteWithBody('/relations/note-event', {
      note_id: noteId,
      event_id: eventId,
    });
  },
};
