export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-organiza-tb.vercel.app/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  email: string;
  full_name: string;
  avatar: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  avatar?: string;
}

export interface UpdateAvatarResponse {
  message: string;
  avatar: string;
}

export const authService = {
  async register(data: RegisterRequest): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Error al registrar usuario');
    }
  },

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error en las credenciales o en el servidor');
    }

    return response.json();
  },

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al renovar la sesión');
    }

    return response.json();
  },

  async updateAvatar(token: string, avatar: string): Promise<UpdateAvatarResponse> {
    const response = await fetch(`${API_BASE_URL}/users/avatar`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ avatar }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al actualizar el avatar');
    }

    return response.json();
  },

  async changePassword(token: string, password: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Error al cambiar la contraseña');
    }

    const raw = await response.text();
    if (!raw) {
      return { message: 'Contraseña actualizada exitosamente' };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { message: 'Contraseña actualizada exitosamente' };
    }
  },

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/password/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Error al solicitar recuperación de contraseña');
    }

    const raw = await response.text();
    if (!raw) {
      return { message: 'Se ha enviado un correo con instrucciones para restablecer tu contraseña.' };
    }
    try {
      return JSON.parse(raw);
    } catch {
      return { message: 'Se ha enviado un correo con instrucciones para restablecer tu contraseña.' };
    }
  },
};
