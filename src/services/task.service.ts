import { API_BASE_URL } from './auth.service';
import { Note } from './notes.service';

export interface Tag {
  name: string;
  color: string;
  id: string;
  user_id: string;
  icon: string | null;
  created_at: string;
}

export interface Reminder {
  value: number;
  unit: string;
}

export type TaskPriority = 'baja' | 'media' | 'alta';

export interface ReminderData {
  id: string;
  remind_at: string;
  status: string;
}

export interface Task {
  title: string;
  description: string;
  due_date: string | null;
  is_completed: boolean;
  priority: TaskPriority;
  // reminders: Reminder[] | null; // Removed in favor of reminders_data in response
  reminders_data: ReminderData[];
  has_reminder: boolean;
  id: string;
  user_id: string;
  calendar_event_id: string;
  media_url: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
  notes: Note[];
}

export interface CreateTaskDTO {
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  priority: TaskPriority;
  reminders: Reminder[] | null;
}

export interface TaskFilters {
  is_completed?: boolean;
  tag_ids?: string[];
  sort_by?: 'updated_at' | 'due_date';
  order?: 'asc' | 'desc';
}

const mapTaskResponse = (data: any): Task => {
  return {
    ...data,
    notes: data.notes || (data.task_notes?.map((tn: any) => tn.notes) || []),
    tags: data.tags || (data.task_tags?.map((tt: any) => tt.tags) || []),
    reminders_data: data.reminders_data || data.reminders || [],
  };
};

export const taskService = {
  async getTasks(token: string, filters?: TaskFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    
    // Add select to fetch relations
    params.append('select', '*,task_tags(tags(*)),task_notes(notes(id,title,content)),reminders_data(*)');
    
    if (filters) {
      if (filters.is_completed !== undefined) {
        params.append('is_completed', String(filters.is_completed));
      }
      if (filters.sort_by) {
        params.append('sort_by', filters.sort_by);
      }
      if (filters.order) {
        params.append('order', filters.order);
      }
      if (filters.tag_ids && filters.tag_ids.length > 0) {
        filters.tag_ids.forEach(id => params.append('tag_ids', id));
      }
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/tasks/${queryString ? `?${queryString}` : ''}`;

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
      throw new Error('Error fetching tasks');
    }

    const data = await response.json();
    return data.map(mapTaskResponse);
  },

  async getTaskById(token: string, id: string): Promise<Task> {
    const params = new URLSearchParams();
    params.append('select', '*,task_tags(tags(*)),task_notes(notes(id,title,content)),reminders_data(*)');
    const queryString = params.toString();

    const response = await fetch(`${API_BASE_URL}/tasks/${id}?${queryString}`, {
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
      throw new Error('Error fetching task details');
    }

    const data = await response.json();
    return mapTaskResponse(data);
  },

  async createTask(token: string, taskData: CreateTaskDTO): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error creating task');
    }

    return response.json();
  },

  async updateTask(token: string, id: string, taskData: Partial<Task>): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error updating task');
    }

    const data = await response.json();
    return mapTaskResponse(data);
  },

  async deleteTask(token: string, id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
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
      throw new Error('Error deleting task');
    }
  },

  async assignTagsToTask(token: string, taskId: string, tagIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ task_id: taskId, tag_ids: tagIds }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      throw new Error('Error assigning tags to task');
    }
  },

  async removeTagFromTask(token: string, taskId: string, tagId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/tags/${tagId}`, {
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
      throw new Error('Error removing tag from task');
    }
  },

  async linkNoteToTask(token: string, taskId: string, noteId: string): Promise<void> {
    const url = `${API_BASE_URL}/tasks/notes`;
    console.log('Linking note to task at:', url, { task_id: taskId, note_id: noteId });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ task_id: taskId, note_id: noteId }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      const errorText = await response.text();
      console.error('Error linking note to task:', response.status, errorText);
      throw new Error(`Error linking note to task: ${response.status} ${errorText}`);
    }
  },

  async unlinkNoteFromTask(token: string, taskId: string, noteId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/notes/${noteId}`, {
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
      throw new Error('Error unlinking note from task');
    }
  },
};
