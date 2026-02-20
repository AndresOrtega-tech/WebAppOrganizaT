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
    return await apiClient.get<Tag[]>('/tags/');
  },

  async createTag(data: CreateTagRequest): Promise<Tag> {
    return await apiClient.post<Tag>('/tags/', data);
  },

  async updateTag(id: string, data: UpdateTagRequest): Promise<Tag> {
    return await apiClient.patch<Tag>(`/tags/${id}`, data);
  },

  async deleteTag(id: string): Promise<void> {
    await apiClient.delete<void>(`/tags/${id}`);
  },
};
