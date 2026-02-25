import { tasksApiClient } from './api.client';
import { Tag } from './tags.service';
import type { Task } from './task.service';

export interface Note {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  is_archived: boolean;
  user_id: string;
  media_url: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  tasks?: Task[];
  events?: Array<{ id: string; title: string; start_time: string }>;
}

export interface NoteFilters {
  is_archived?: boolean;
  tag_ids?: string[];
  sort_by?: 'updated_at' | 'created_at';
  order?: 'asc' | 'desc';
}

export interface CreateNoteRequest {
  title: string;
  content: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  is_archived?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapNoteResponse = (data: any): Note => {
  return {
    ...data,
    tags: data.tags || [],
  };
};

export const notesService = {
  async updateNote(noteId: string, note: Partial<UpdateNoteRequest>): Promise<Note> {
    const data = await tasksApiClient.patch(`/notes/${noteId}`, note);
    return mapNoteResponse(data);
  },

  async deleteNote(noteId: string): Promise<void> {
    await tasksApiClient.delete(`/notes/${noteId}`);
  },

  async createNote(note: CreateNoteRequest): Promise<Note> {
    const data = await tasksApiClient.post('/notes/', note);
    return mapNoteResponse(data);
  },

  async getNoteById(noteId: string): Promise<Note> {
    const data = await tasksApiClient.get(`/notes/${noteId}`);
    return mapNoteResponse(data);
  },

  async getNotes(filters?: NoteFilters): Promise<Note[]> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.is_archived !== undefined) {
        params.append('is_archived', String(filters.is_archived));
      }
      if (filters.tag_ids && filters.tag_ids.length > 0) {
        filters.tag_ids.forEach(id => params.append('tag_ids', id));
      }
      if (filters.sort_by) {
        params.append('sort_by', filters.sort_by);
      }
      if (filters.order) {
        params.append('order', filters.order);
      }
    }

    const queryString = params.toString();
    const url = `/notes/${queryString ? `?${queryString}` : ''}`;

    const data = await tasksApiClient.get(url);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map(mapNoteResponse);
  },

  async assignTagsToNote(noteId: string, tagIds: string[]): Promise<void> {
    for (const tagId of tagIds) {
      await tasksApiClient.post(`/notes/${noteId}/tags`, { tag_id: tagId });
    }
  },

  async removeTagFromNote(noteId: string, tagId: string): Promise<void> {
    await tasksApiClient.delete(`/notes/${noteId}/tags/${tagId}`);
  },

  async updateNoteSummary(noteId: string, summary: string | null): Promise<Note> {
    const data = await tasksApiClient.patch(`/notes/${noteId}/summary`, { summary });
    return mapNoteResponse(data);
  },

  async getNoteRelations(noteId: string): Promise<{
    tags: Tag[];
    tasks: Task[];
    events: Array<{ id: string; title: string, start_time: string }>;
  }> {
    const data = await tasksApiClient.get(`/notes/${noteId}/related`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as any;
  },
};
