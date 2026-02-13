import { authService } from './auth.service';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const apiClient = {
  async fetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const accessToken = localStorage.getItem('access_token');
    
    // Preparar headers con el token actual
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Primera petición
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Manejo de error 401 (Unauthorized)
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');

      if (!refreshToken) {
        // No hay refresh token, cerrar sesión
        apiClient.logout();
        throw new Error('Unauthorized');
      }

      try {
        // Intentar renovar el token
        const newTokens = await authService.refreshToken(refreshToken);
        
        // Guardar nuevos tokens
        localStorage.setItem('access_token', newTokens.access_token);
        localStorage.setItem('refresh_token', newTokens.refresh_token);
        if (newTokens.user) {
          localStorage.setItem('user', JSON.stringify(newTokens.user));
        }

        // Reintentar petición original con el nuevo token
        headers['Authorization'] = `Bearer ${newTokens.access_token}`;
        response = await fetch(url, {
          ...options,
          headers,
        });

      } catch (refreshError) {
        // Si falla la renovación, cerrar sesión
        console.error('Error refreshing token:', refreshError);
        apiClient.logout();
        throw new Error('Session expired');
      }
    }

    if (!response.ok) {
      // Si sigue fallando (u otro error), lanzar excepción
      if (response.status === 401) {
        apiClient.logout();
        throw new Error('Unauthorized');
      }
      
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // Ignorar si no es JSON
      }

      const errorMessage = errorData?.detail || errorData?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    // Retornar JSON
    // Nota: Algunas APIs pueden devolver 204 No Content, manejar eso si es necesario
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};
