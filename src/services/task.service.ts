import { API_BASE_URL } from './auth.service';

export interface Tag {
  name: string;
  color: string;
  id: string;
  user_id: string;
  icon: string | null;
  created_at: string;
}

export interface Task {
  title: string;
  description: string;
  due_date: string | null;
  has_reminder: boolean;
  is_completed: boolean;
  id: string;
  user_id: string;
  calendar_event_id: string;
  media_url: string | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export const taskService = {
  async getTasks(token: string): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/tasks/`, {
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

    return response.json();
  },

  async getTaskById(token: string, id: string): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
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

    return response.json();
  },

  async createTask(token: string, taskData: Partial<Task>): Promise<Task> {
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

    return response.json();
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
};
