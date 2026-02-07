import { API_BASE_URL } from './auth.service';
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
    tasks: data.tasks || (data.note_tasks?.map((nt: any) => nt.tasks) || []),
    tags: data.tags || (data.note_tags?.map((nt: any) => nt.tags) || []),
  };
};

export const notesService = {
  async updateNote(token: string, noteId: string, note: UpdateNoteRequest): Promise<Note> {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(note),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error al actualizar la nota');
    }

    return response.json();
  },

  async deleteNote(token: string, noteId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error al eliminar la nota');
    }
  },

  async createNote(token: string, note: CreateNoteRequest): Promise<Note> {
    const response = await fetch(`${API_BASE_URL}/notes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(note),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error creating note');
    }

    const data = await response.json();
    return mapNoteResponse(data);
  },

  async getNoteById(token: string, noteId: string): Promise<Note> {
    const params = new URLSearchParams();
    params.append('select', '*,note_tags(tags(*)),note_tasks(tasks(id,title))');
    const queryString = params.toString();

    const response = await fetch(`${API_BASE_URL}/notes/${noteId}?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error al obtener la nota');
    }

    const data = await response.json();
    return mapNoteResponse(data);
  },

  async getNotes(token: string, filters?: NoteFilters): Promise<Note[]> {
    const params = new URLSearchParams();
    
    // Add select to fetch relations
    params.append('select', '*,note_tags(tags(*)),note_tasks(tasks(id,title))');

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

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error loading notes');
    }

    const data = await response.json();
    return data.map(mapNoteResponse);
  },

  async assignTagsToNote(token: string, noteId: string, tagIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notes/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ note_id: noteId, tag_ids: tagIds }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error assigning tags to note');
    }
  },

  async removeTagFromNote(token: string, noteId: string, tagId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notes/${noteId}/tags/${tagId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error removing tag from note');
    }
  },
};
