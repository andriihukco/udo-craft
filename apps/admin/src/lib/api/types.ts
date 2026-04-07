/**
 * API Response Types
 * Standardized response format for all API endpoints
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Request validation types
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Common query parameters
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Lead types
 */
export interface LeadCreateRequest {
  customer_data: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    social_channel?: string;
  };
  notes?: string;
}

export interface LeadUpdateRequest {
  status?: 'new' | 'in_progress' | 'production' | 'completed' | 'archived';
  customer_data?: Partial<LeadCreateRequest['customer_data']>;
  notes?: string;
}

export interface LeadResponse {
  id: string;
  status: string;
  customer_data: Record<string, unknown>;
  total_amount_cents: number;
  created_at: string;
  updated_at: string;
  item_count?: number;
  total_quantity?: number;
}

/**
 * Order Item types
 */
export interface OrderItemCreateRequest {
  product_id: string;
  size: string;
  color: string;
  quantity: number;
  custom_print_url?: string;
  mockup_url?: string;
  technical_metadata?: {
    offset_top_mm: number;
    print_size_mm: [number, number];
  };
}

export interface OrderItemUpdateRequest {
  size?: string;
  color?: string;
  quantity?: number;
  custom_print_url?: string;
  mockup_url?: string;
  technical_metadata?: {
    offset_top_mm: number;
    print_size_mm: [number, number];
  };
}

export interface OrderItemResponse {
  id: string;
  lead_id: string;
  product_id: string;
  size: string;
  color: string;
  quantity: number;
  custom_print_url?: string;
  mockup_url?: string;
  technical_metadata?: {
    offset_top_mm: number;
    print_size_mm: [number, number];
  };
  created_at: string;
  updated_at: string;
}

/**
 * Product types
 */
export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  base_price_cents: number;
  images: Record<string, unknown>;
  is_customizable: boolean;
  available_sizes: string[];
  created_at: string;
  updated_at: string;
  zone_count?: number;
}

/**
 * Analytics types
 */
export interface DashboardMetrics {
  totalRevenue: number;
  totalRevenueToday: number;
  totalRevenueYesterday: number;
  totalOrders: number;
  totalOrdersToday: number;
  totalOrdersYesterday: number;
  paidRevenue: number;
  paidRevenueYesterday: number;
  completedOrders: number;
  completedOrdersYesterday: number;
  sessions: number;
  sessionsToday: number;
  sessionsYesterday: number;
  forms: number;
  formsToday: number;
  formsYesterday: number;
  clients: number;
  clientsToday: number;
  clientsYesterday: number;
  itemsSold: number;
  conversionRate: number;
  conversionRateYesterday: number;
  avgOrderValue: number;
  avgOrderValueYesterday: number;
}
