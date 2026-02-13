import { apiClient } from './api.client';
import { UpdateAvatarResponse } from './auth.service';

export const userService = {
  async updateAvatar(avatar: string): Promise<UpdateAvatarResponse> {
    return await apiClient.patch<UpdateAvatarResponse>('/users/avatar', { avatar });
  },

  async changePassword(password: string): Promise<{ message: string }> {
    return await apiClient.patch<{ message: string }>('/users/password', { password });
  }
};
