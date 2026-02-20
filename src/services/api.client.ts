import { authService, API_BASE_URL } from './auth.service';

class ApiClient {
  private isRefreshing = false;
  private failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];
  private cache = new Map<string, { expiry: number; data: unknown; inflight?: Promise<unknown> }>();
  private defaultTTL = 15000;

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
        const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
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
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    const cacheKey = url;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > now && cached.data !== undefined) {
      this.revalidate(cacheKey, url);
      return Promise.resolve(cached.data as T);
    }
    if (cached?.inflight) {
      return cached.inflight as Promise<T>;
    }
    const inflight = this.fetchWithAuth<T>(url, { method: 'GET' }).then((data) => {
      this.cache.set(cacheKey, { expiry: Date.now() + this.defaultTTL, data });
      return data;
    }).finally(() => {
      const entry = this.cache.get(cacheKey);
      if (entry) this.cache.set(cacheKey, { expiry: entry.expiry, data: entry.data });
    });
    // Store placeholder with no valid expiry so subsequent calls await inflight
    this.cache.set(cacheKey, { expiry: 0, data: cached?.data, inflight });
    return inflight;
  }

  async post<T = unknown>(endpoint: string, body: unknown): Promise<T> {
    const result = await this.fetchWithAuth<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    this.cache.clear();
    return result;
  }

  async put<T = unknown>(endpoint: string, body: unknown): Promise<T> {
    const result = await this.fetchWithAuth<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    this.cache.clear();
    return result;
  }
  
  async patch<T = unknown>(endpoint: string, body: unknown): Promise<T> {
    const result = await this.fetchWithAuth<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    this.cache.clear();
    return result;
  }

  async delete<T = unknown>(endpoint: string): Promise<T> {
    const result = await this.fetchWithAuth<T>(endpoint, { method: 'DELETE' });
    this.cache.clear();
    return result;
  }

  private async revalidate(cacheKey: string, url: string) {
    if (this.cache.get(cacheKey)?.inflight) return;
    const inflight = this.fetchWithAuth(url, { method: 'GET' }).then((data) => {
      this.cache.set(cacheKey, { expiry: Date.now() + this.defaultTTL, data });
      return data;
    }).finally(() => {
      const entry = this.cache.get(cacheKey);
      if (entry) this.cache.set(cacheKey, { expiry: entry.expiry, data: entry.data });
    });
    const entry = this.cache.get(cacheKey);
    // Keep expiry 0 when we only have inflight to avoid serving undefined data
    this.cache.set(cacheKey, { expiry: entry?.data !== undefined ? (entry?.expiry || Date.now() + this.defaultTTL) : 0, data: entry?.data, inflight });
  }
}

export const apiClient = new ApiClient();
