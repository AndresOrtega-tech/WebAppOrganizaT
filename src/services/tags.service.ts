import { API_BASE_URL } from './auth.service';
import { apiClient } from './api.client';

export interface Tag {
  name: string;
  color: string;
  id: string;
  user_id: string;
  icon: string | null;
  created_at: string;
}

export interface CreateTagRequest {
  name: string;
  color: string;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
}

export const tagsService = {
  async getTags(): Promise<Tag[]> {
    const response = await apiClient.fetch<Tag[]>(`${API_BASE_URL}/tags/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response;
  },

  async createTag(data: CreateTagRequest): Promise<Tag> {
    const response = await apiClient.fetch<Tag>(`${API_BASE_URL}/tags/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response;
  },

  async updateTag(id: string, data: UpdateTagRequest): Promise<Tag> {
    const response = await apiClient.fetch<Tag>(`${API_BASE_URL}/tags/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response;
  },

  async deleteTag(id: string): Promise<void> {
    await apiClient.fetch<void>(`${API_BASE_URL}/tags/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};
