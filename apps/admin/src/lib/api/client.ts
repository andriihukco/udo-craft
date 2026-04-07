/**
 * API Client
 * Centralized client for making API requests with error handling and retry logic
 */

import { ApiResponse, PaginatedResponse, LeadResponse, DashboardMetrics } from './types';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication token
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Make HTTP request with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || {
            code: 'UNKNOWN_ERROR',
            message: 'An unknown error occurred',
            statusCode: response.status,
          },
        };
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
          statusCode: 0,
        },
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ========== Leads Endpoints ==========

  /**
   * Get all leads with pagination
   */
  async getLeads(
    page: number = 1,
    pageSize: number = 20,
    status?: string,
    search?: string
  ): Promise<ApiResponse<PaginatedResponse<LeadResponse>>> {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('pageSize', pageSize.toString());
    if (status) params.set('status', status);
    if (search) params.set('search', search);

    return this.get<PaginatedResponse<LeadResponse>>(`/leads?${params}`);
  }

  /**
   * Get a specific lead
   */
  async getLead(id: string): Promise<ApiResponse<LeadResponse>> {
    return this.get<LeadResponse>(`/leads/${id}`);
  }

  /**
   * Create a new lead
   */
  async createLead(data: {
    customer_data: {
      name: string;
      email: string;
      phone?: string;
      company?: string;
      social_channel?: string;
    };
    notes?: string;
  }): Promise<ApiResponse<LeadResponse>> {
    return this.post<LeadResponse>('/leads', data);
  }

  /**
   * Update a lead
   */
  async updateLead(
    id: string,
    data: {
      status?: string;
      customer_data?: Record<string, unknown>;
      notes?: string;
    }
  ): Promise<ApiResponse<LeadResponse>> {
    return this.patch<LeadResponse>(`/leads/${id}`, data);
  }

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<ApiResponse<{ id: string }>> {
    return this.delete<{ id: string }>(`/leads/${id}`);
  }

  // ========== Analytics Endpoints ==========

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    return this.get<DashboardMetrics>('/analytics/dashboard');
  }
}

// Create singleton instance
export const apiClient = new ApiClient();
