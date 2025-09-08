import axios from 'axios';

export interface User {
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Axios default base URL'i ayarla
axios.defaults.baseURL = API_URL;

export const authService = {
  async login(request: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/api/auth/login`, request);
    const { token, username, email } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ username, email }));
    return response.data;
  },

  async register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/api/auth/register`, request);
    const { token, username, email } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ username, email }));
    return response.data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // Axios interceptor kurulumu
  setupAxiosInterceptors() {
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
};
