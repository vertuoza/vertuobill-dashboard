import axios from 'axios';
import { LoginRequest, AuthResponse, ApiResponse, PaginatedResponse, Client, PaginationParams } from '@dashboard/shared';

// En production, utiliser des URLs relatives (même domaine)
// En développement, utiliser localhost
const API_BASE_URL = import.meta.env.PROD 
  ? '/api'  // URLs relatives en production
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data!;
  },
};

// Clients API
export const clientsApi = {
  getClients: async (params: Partial<PaginationParams> = {}): Promise<PaginatedResponse<Client>> => {
    const response = await api.get<ApiResponse<PaginatedResponse<Client>>>('/clients', { params });
    return response.data.data!;
  },
  
  getClient: async (id: string): Promise<Client> => {
    const response = await api.get<ApiResponse<Client>>(`/clients/${id}`);
    return response.data.data!;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<{
    totalClients: string;
    totalFactures: string;
    totalContacts: string;
    totalEntreprises: string;
    totalFacturesFournisseurs: string;
  }> => {
    const response = await api.get<ApiResponse<{
      totalClients: string;
      totalFactures: string;
      totalContacts: string;
      totalEntreprises: string;
      totalFacturesFournisseurs: string;
    }>>('/dashboard/stats');
    return response.data.data!;
  },
};

export default api;
