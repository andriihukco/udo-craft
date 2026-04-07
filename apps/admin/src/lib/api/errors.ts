/**
 * API Error Handling
 * Standardized error responses and error classes
 */

import { NextResponse } from 'next/server';
import { ApiResponse, ApiError } from './types';

export class ApiException extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

export class NotFoundError extends ApiException {
  constructor(resource: string, id?: string) {
    super(404, 'NOT_FOUND', `${resource} not found${id ? ` (${id})` : ''}`);
  }
}

export class UnauthorizedError extends ApiException {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export class ForbiddenError extends ApiException {
  constructor(message = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
  }
}

export class ValidationError extends ApiException {
  constructor(message: string, details?: Record<string, unknown>) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class ConflictError extends ApiException {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export class RateLimitError extends ApiException {
  constructor(retryAfter?: number) {
    super(429, 'RATE_LIMIT', 'Too many requests', retryAfter ? { retryAfter } : undefined);
  }
}

export class InternalServerError extends ApiException {
  constructor(message = 'Internal server error') {
    super(500, 'INTERNAL_SERVER_ERROR', message);
  }
}

/**
 * Create standardized API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: ApiError
): ApiResponse<T> {
  return {
    success,
    data,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    },
  };
}

/**
 * Create error response
 */
export function createErrorResponse(exception: ApiException): ApiResponse {
  return createApiResponse(false, undefined, {
    code: exception.code,
    message: exception.message,
    details: exception.details,
    statusCode: exception.statusCode,
  });
}

/**
 * Handle API errors and return standardized response
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof ApiException) {
    return NextResponse.json(createErrorResponse(error), {
      status: error.statusCode,
    });
  }

  if (error instanceof Error) {
    const internalError = new InternalServerError(error.message);
    return NextResponse.json(createErrorResponse(internalError), {
      status: 500,
    });
  }

  const unknownError = new InternalServerError();
  return NextResponse.json(createErrorResponse(unknownError), {
    status: 500,
  });
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verify user authentication.
 * Note: per-route permission checks are enforced at middleware level (src/middleware.ts).
 */
export async function verifyAuth(request: Request): Promise<string> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);
  
  if (!token) {
    throw new UnauthorizedError('Missing token');
  }

  // Token validation would happen here with Supabase
  // For now, we just verify it exists
  return token;
}

