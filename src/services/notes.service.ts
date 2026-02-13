import { API_BASE_URL } from './auth.service';
import { apiClient } from './api.client';
import { Tag } from './tags.service';
import type { Task } from './task.service';

export interface Note {
  id: string;
  title: string;
  content: string;
  is_archived: boolean;
  user_id: string;
  media_url: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  tasks: Task[];
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

const mapNoteResponse = (data: any): Note => {
  return {
    ...data,
    tasks: data.tasks || data.task_notes?.map((nt: any) => nt.tasks) || data.note_tasks?.map((nt: any) => nt.tasks) || [],
    tags: data.tags || (data.note_tags?.map((nt: any) => nt.tags) || []),
  };
};

export const notesService = {
  async updateNote(noteId: string, note: UpdateNoteRequest): Promise<Note> {
    const data = await apiClient.fetch<any>(`${API_BASE_URL}/notes/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });

    return mapNoteResponse(data);
  },

  async deleteNote(noteId: string): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/notes/${noteId}`, {
      method: 'DELETE',
    });
  },

  async createNote(note: CreateNoteRequest): Promise<Note> {
    const data = await apiClient.fetch<any>(`${API_BASE_URL}/notes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note),
    });

    return mapNoteResponse(data);
  },

  async getNoteById(noteId: string): Promise<Note> {
    const params = new URLSearchParams();
    params.append('select', '*,note_tags(tags(*)),task_notes(tasks(id,title,description))');
    const queryString = params.toString();

    const data = await apiClient.fetch<any>(`${API_BASE_URL}/notes/${noteId}?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return mapNoteResponse(data);
  },

  async getNotes(filters?: NoteFilters): Promise<Note[]> {
    const params = new URLSearchParams();
    
    // Add select to fetch relations
    params.append('select', '*,note_tags(tags(*)),task_notes(tasks(id,title,description))');

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
    const url = `${API_BASE_URL}/notes/${queryString ? `?${queryString}` : ''}`;

    const data = await apiClient.fetch<any[]>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return data.map(mapNoteResponse);
  },

  async assignTagsToNote(noteId: string, tagIds: string[]): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/notes/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ note_id: noteId, tag_ids: tagIds }),
    });
  },

  async removeTagFromNote(noteId: string, tagId: string): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/notes/${noteId}/tags/${tagId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};
