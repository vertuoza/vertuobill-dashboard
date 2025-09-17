export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface Client {
  id: string;
  societe_name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  // Compteurs
  factures_count: number;
  contacts_count: number;
  entreprises_count: number;
  factures_fournisseurs_count: number;
  // Legal unit status
  has_legal_unit: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: keyof Client;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
