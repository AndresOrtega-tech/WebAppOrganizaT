import { API_BASE_URL } from './auth.service';
import { apiClient } from './api.client';
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
  due_date?: string;
  show_overdue?: boolean;
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
  async getTasks(filters?: TaskFilters): Promise<Task[]> {
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
      // Note: due_date and show_overdue are handled client-side below
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/tasks/${queryString ? `?${queryString}` : ''}`;

    const data = await apiClient.fetch<any[]>(url);
    let tasks = data.map(mapTaskResponse);

    // Client-side filtering for dates
    if (filters) {
      const todayStr = new Date().toLocaleDateString('sv');

      tasks = tasks.filter((task: Task) => {
        // Extract YYYY-MM-DD from task due date (which might be ISO)
        const taskDateStr = task.due_date ? task.due_date.split('T')[0] : null;

        // If a specific date is selected
        if (filters.due_date) {
          // If filtering by specific date, DO NOT show tasks without date
          if (!taskDateStr) return false;

          if (filters.show_overdue) {
            // Show everything up to selected date (Backlog + Day)
            return taskDateStr <= filters.due_date;
          } else {
            // Show ONLY selected date
            return taskDateStr === filters.due_date;
          }
        } 
        
        // No specific date selected
        if (!filters.show_overdue) {
          // Don't show overdue (past tasks)
          // If task has no date, it is NOT overdue, so we show it (unless user implies strict date filtering here too?)
          // Assuming "si filtra alguna fecha" refers mainly to the explicit date picker.
          // However, to be safe with "o asi", if strictly hiding overdue, we keep "no date" as they are effectively "future/pending".
          if (!taskDateStr) return true;
          
          return taskDateStr >= todayStr;
        }

        // Default: Show all
        return true;
      });
    }

    return tasks;
  },

  async getTaskById(id: string): Promise<Task> {
    const params = new URLSearchParams();
    params.append('select', '*,task_tags(tags(*)),task_notes(notes(id,title,content)),reminders_data(*)');
    const queryString = params.toString();

    const data = await apiClient.fetch<any>(`${API_BASE_URL}/tasks/${id}?${queryString}`);
    return mapTaskResponse(data);
  },

  async createTask(taskData: CreateTaskDTO): Promise<Task> {
    const data = await apiClient.fetch<Task>(`${API_BASE_URL}/tasks/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    return data;
  },

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const data = await apiClient.fetch<any>(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    return mapTaskResponse(data);
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  async assignTagsToTask(taskId: string, tagIds: string[]): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/tasks/tags`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task_id: taskId, tag_ids: tagIds }),
    });
  },

  async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/tasks/${taskId}/tags/${tagId}`, {
      method: 'DELETE',
    });
  },

  async linkNoteToTask(taskId: string, noteId: string): Promise<void> {
    const url = `${API_BASE_URL}/tasks/notes`;
    await apiClient.fetch<void>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task_id: taskId, note_id: noteId }),
    });
  },

  async unlinkNoteFromTask(taskId: string, noteId: string): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/tasks/${taskId}/notes/${noteId}`, {
      method: 'DELETE',
    });
  },
};
