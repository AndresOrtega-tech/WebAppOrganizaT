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

type NoteApiResponse = Omit<Note, 'tags' | 'tasks'> & {
  tags?: Tag[];
  tasks?: Task[];
  note_tags?: Array<{ tags: Tag }>;
  task_notes?: Array<{ tasks: Task }>;
  note_tasks?: Array<{ tasks: Task }>;
};

const mapNoteResponse = (data: NoteApiResponse): Note => {
  return {
    ...data,
    tasks: data.tasks || data.task_notes?.map((nt) => nt.tasks) || data.note_tasks?.map((nt) => nt.tasks) || [],
    tags: data.tags || (data.note_tags?.map((nt) => nt.tags) || []),
  };
};

export const notesService = {
  async updateNote(noteId: string, note: UpdateNoteRequest): Promise<Note> {
    const data = await apiClient.patch(`/notes/${noteId}`, note);
    return mapNoteResponse(data as NoteApiResponse);
  },

  async deleteNote(noteId: string): Promise<void> {
    await apiClient.delete(`/notes/${noteId}`);
  },

  async createNote(note: CreateNoteRequest): Promise<Note> {
    const data = await apiClient.post('/notes/', note);
    return mapNoteResponse(data as NoteApiResponse);
  },

  async getNoteById(noteId: string): Promise<Note> {
    const params = new URLSearchParams();
    params.append('select', '*,note_tags(tags(*)),task_notes(tasks(id,title,description))');
    const queryString = params.toString();

    const data = await apiClient.get(`/notes/${noteId}?${queryString}`);
    return mapNoteResponse(data as NoteApiResponse);
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
    const url = `/notes/${queryString ? `?${queryString}` : ''}`;

    const data = await apiClient.get(url);
    return (data as NoteApiResponse[]).map(mapNoteResponse);
  },

  async assignTagsToNote(noteId: string, tagIds: string[]): Promise<void> {
    await apiClient.post('/notes/tags', { note_id: noteId, tag_ids: tagIds });
  },

  async removeTagFromNote(noteId: string, tagId: string): Promise<void> {
    await apiClient.delete(`/notes/${noteId}/tags/${tagId}`);
  },
};
