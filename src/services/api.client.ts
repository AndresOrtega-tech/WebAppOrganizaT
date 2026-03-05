import { authService, API_BASE_URL, TASKS_API_BASE_URL } from './auth.service';

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private processQueue(error: unknown, token: string | null = null) {
    this.failedQueue.forEach(prom => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  async fetchWithAuth<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (typeof window === 'undefined') {
      // Server-side (if any) or build time
      const res = await fetch(`${this.baseUrl}${endpoint}`, options);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Error en la petición');
      }
      const text = await res.text();
      return (text ? JSON.parse(text) : null) as T;
    }

    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(() => {
            return this.fetchWithAuth(endpoint, options);
          });
        }

        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          this.logout();
          throw new Error('Sesión expirada');
        }

        this.isRefreshing = true;

        try {
          const data = await authService.refreshToken(refreshToken);
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) {
            localStorage.setItem('refresh_token', data.refresh_token);
          }
          this.processQueue(null, data.access_token);
          
          // Retry original request
          return this.fetchWithAuth<T>(endpoint, options);
        } catch (err) {
          this.processQueue(err, null);
          this.logout();
          throw err;
        } finally {
          this.isRefreshing = false;
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.detail || errorData.message || 'Error en la petición';
        
        if (typeof errorMessage !== 'string') {
          if (Array.isArray(errorMessage)) {
             errorMessage = errorMessage.map((e: { msg?: string } & Record<string, unknown>) => e.msg || JSON.stringify(e)).join(', ');
          } else {
             errorMessage = JSON.stringify(errorMessage);
          }
        }
        
        throw new Error(errorMessage);
      }

      // Check if response has content
      const text = await response.text();
      return (text ? JSON.parse(text) : null) as T;
    } catch (error) {
      throw error;
    }
  }

  // Helper methods
  async get<T = unknown>(endpoint: string, params?: Record<string, string | boolean | undefined | number>): Promise<T> {
    let url = endpoint;
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                searchParams.append(key, String(value));
            }
        });
        const queryString = searchParams.toString();
        if (url.includes('?')) {
            url += `&${queryString}`;
        } else {
            url += `?${queryString}`;
        }
    }
    return await this.fetchWithAuth<T>(url, { method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body: unknown): Promise<T> {
    const result = await this.fetchWithAuth<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return result;
  }

  async put<T = unknown>(endpoint: string, body: unknown): Promise<T> {
    const result = await this.fetchWithAuth<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return result;
  }
  
  async patch<T = unknown>(endpoint: string, body: unknown): Promise<T> {
    const result = await this.fetchWithAuth<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return result;
  }

  async deleteWithBody<T = unknown>(endpoint: string, body: unknown): Promise<T> {
    const result = await this.fetchWithAuth<T>(endpoint, {
      method: 'DELETE',
      body: JSON.stringify(body),
    });
    return result;
  }

  async delete<T = unknown>(endpoint: string): Promise<T> {
    const result = await this.fetchWithAuth<T>(endpoint, { method: 'DELETE' });
    return result;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export const tasksApiClient = new ApiClient(TASKS_API_BASE_URL);
