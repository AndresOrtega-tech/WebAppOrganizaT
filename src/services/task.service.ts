import { tasksApiClient } from './api.client';
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
  sort_by?: 'updated_at' | 'due_date' | 'priority';
  order?: 'asc' | 'desc';
  due_date?: string;
  show_overdue?: boolean;
  start_date?: string;
  end_date?: string;
  date_field?: 'due_date' | 'updated_at' | 'created_at';
  priority?: TaskPriority;
  view?: 'home' | 'tasks';
  cursor?: string;
  tab?: 'pending' | 'completed';
  limit?: number;
}

export interface PaginatedTasks {
  tasks: Task[];
  next_cursor?: string | null;
  has_more?: boolean;
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
  async getTasks(filters?: TaskFilters): Promise<PaginatedTasks> {
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
      if (filters.priority) {
        params.append('priority', filters.priority);
      }
      if (filters.start_date) {
        params.append('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date);
      }
      if (filters.date_field) {
        params.append('date_field', filters.date_field);
      }
      if (filters.due_date) {
        params.append('due_date', filters.due_date);
      }
      if (filters.show_overdue !== undefined) {
        params.append('show_overdue', String(filters.show_overdue));
      }
      if (filters.view) {
        params.append('view', filters.view);
      }
      if (filters.cursor) {
        params.append('cursor', filters.cursor);
      }
      if (filters.tab) {
        params.append('tab', filters.tab);
      }
      if (filters.limit !== undefined) {
        params.append('limit', String(filters.limit));
      }
    }

    const queryString = params.toString();
    const url = `/tasks/${queryString ? `?${queryString}` : ''}`;

    const data = await tasksApiClient.get<unknown>(url);

    let rawTasks: TaskApiResponse[] = [];
    let nextCursor: string | null | undefined = undefined;
    let hasMore: boolean | undefined = undefined;

    if (Array.isArray(data)) {
      rawTasks = data as TaskApiResponse[];
    } else if (data && typeof data === 'object') {
      const obj = data as { data?: unknown; next_cursor?: string | null; has_more?: boolean };
      if (Array.isArray(obj.data)) {
        rawTasks = obj.data as TaskApiResponse[];
      }
      if (obj.next_cursor !== undefined) {
        nextCursor = obj.next_cursor;
      }
      if (obj.has_more !== undefined) {
        hasMore = obj.has_more;
      }
    }

    let tasks = rawTasks.map(mapTaskResponse);

    // Client-side filtering for dates (legacy flows without view)
    if (filters && !filters.view) {
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

    return {
      tasks,
      next_cursor: nextCursor,
      has_more: hasMore,
    };
  },

  async getTaskById(id: string): Promise<Task> {
    const params = new URLSearchParams();
    params.append('select', '*,task_tags(tags(*)),task_notes(notes(id,title,content)),reminders_data(*)');
    const queryString = params.toString();

    const data = await tasksApiClient.get(`/tasks/${id}?${queryString}`);
    return mapTaskResponse(data as TaskApiResponse);
  },

  async createTask(taskData: CreateTaskDTO): Promise<Task> {
    const data = await tasksApiClient.post('/tasks/', taskData);
    return mapTaskResponse(data as TaskApiResponse);
  },

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const data = await tasksApiClient.patch(`/tasks/${id}`, taskData);
    return mapTaskResponse(data as TaskApiResponse);
  },

  async deleteTask(id: string): Promise<void> {
    await tasksApiClient.delete(`/tasks/${id}`);
  },

  async assignTagsToTask(taskId: string, tagIds: string[]): Promise<void> {
    for (const tagId of tagIds) {
      await tasksApiClient.post(`/tasks/${taskId}/tags`, { tag_id: tagId });
    }
  },

  async removeTagFromTask(taskId: string, tagId: string): Promise<void> {
    await tasksApiClient.delete(`/tasks/${taskId}/tags/${tagId}`);
  },

  async linkNoteToTask(taskId: string, noteId: string): Promise<void> {
    await tasksApiClient.post('/relations/task-note', { task_id: taskId, note_id: noteId });
  },

  async unlinkNoteFromTask(taskId: string, noteId: string): Promise<void> {
    await tasksApiClient.deleteWithBody('/relations/task-note', {
      task_id: taskId,
      note_id: noteId,
    });
  },

  async getTaskRelations(taskId: string): Promise<{
    tags: Tag[];
    notes: Note[];
    events: Array<{ id: string; title: string; description?: string | null }>;
  }> {
    const data = await tasksApiClient.get(`/tasks/${taskId}/related`);
    return data as {
      tags: Tag[];
      notes: Note[];
      events: Array<{ id: string; title: string; description?: string | null }>;
    };
  },
};
