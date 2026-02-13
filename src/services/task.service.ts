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

type TaskApiResponse = Omit<Task, 'tags' | 'notes' | 'reminders_data'> & {
  tags?: Tag[];
  notes?: Note[];
  task_tags?: Array<{ tags: Tag }>;
  task_notes?: Array<{ notes: Note }>;
  reminders_data?: ReminderData[];
  reminders?: ReminderData[];
};

const mapTaskResponse = (data: TaskApiResponse): Task => {
  return {
    ...data,
    notes: data.notes || (data.task_notes?.map((tn) => tn.notes) || []),
    tags: data.tags || (data.task_tags?.map((tt) => tt.tags) || []),
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
    const url = `/tasks/${queryString ? `?${queryString}` : ''}`;

    const data = await apiClient.get(url);
    let tasks = (data as TaskApiResponse[]).map(mapTaskResponse);

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

    const data = await apiClient.get(`/tasks/${id}?${queryString}`);
    return mapTaskResponse(data as TaskApiResponse);
  },

  async createTask(taskData: CreateTaskDTO): Promise<Task> {
    const data = await apiClient.post('/tasks/', taskData);
    return mapTaskResponse(data as TaskApiResponse);
  },

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const data = await apiClient.patch(`/tasks/${id}`, taskData);
    return mapTaskResponse(data as TaskApiResponse);
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async assignTagsToTask(taskId: string, tagIds: string[]): Promise<void> {
    await apiClient.post('/tasks/tags', { task_id: taskId, tag_ids: tagIds });
  },

  async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}/tags/${tagId}`);
  },

  async linkNoteToTask(taskId: string, noteId: string): Promise<void> {
    await apiClient.post('/tasks/notes', { task_id: taskId, note_id: noteId });
  },

  async unlinkNoteFromTask(taskId: string, noteId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}/notes/${noteId}`);
  },
};
