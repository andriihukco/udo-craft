/**
 * API Request Validation
 * Centralized validation for all API requests
 */

import { ValidationError } from './types';

export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationException';
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic)
 */
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Validate lead creation request
 */
export function validateLeadCreate(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: 'Request body must be an object',
      code: 'INVALID_TYPE',
    });
    return errors;
  }

  const req = data as Record<string, unknown>;

  // Validate customer_data
  if (!req.customer_data || typeof req.customer_data !== 'object') {
    errors.push({
      field: 'customer_data',
      message: 'customer_data is required and must be an object',
      code: 'REQUIRED',
    });
  } else {
    const customer = req.customer_data as Record<string, unknown>;

    // Validate name
    if (!customer.name || typeof customer.name !== 'string' || customer.name.trim().length === 0) {
      errors.push({
        field: 'customer_data.name',
        message: 'Name is required and must be a non-empty string',
        code: 'REQUIRED',
      });
    } else if (customer.name.length > 255) {
      errors.push({
        field: 'customer_data.name',
        message: 'Name must be less than 255 characters',
        code: 'MAX_LENGTH',
      });
    }

    // Validate email
    if (!customer.email || typeof customer.email !== 'string') {
      errors.push({
        field: 'customer_data.email',
        message: 'Email is required and must be a string',
        code: 'REQUIRED',
      });
    } else if (!validateEmail(customer.email)) {
      errors.push({
        field: 'customer_data.email',
        message: 'Email must be a valid email address',
        code: 'INVALID_FORMAT',
      });
    }

    // Validate phone (optional)
    if (customer.phone && typeof customer.phone === 'string' && !validatePhone(customer.phone)) {
      errors.push({
        field: 'customer_data.phone',
        message: 'Phone must be a valid phone number',
        code: 'INVALID_FORMAT',
      });
    }

    // Validate company (optional)
    if (customer.company && typeof customer.company !== 'string') {
      errors.push({
        field: 'customer_data.company',
        message: 'Company must be a string',
        code: 'INVALID_TYPE',
      });
    }
  }

  // Validate notes (optional)
  if (req.notes && typeof req.notes !== 'string') {
    errors.push({
      field: 'notes',
      message: 'Notes must be a string',
      code: 'INVALID_TYPE',
    });
  }

  return errors;
}

/**
 * Validate lead update request
 */
export function validateLeadUpdate(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: 'Request body must be an object',
      code: 'INVALID_TYPE',
    });
    return errors;
  }

  const req = data as Record<string, unknown>;

  // Validate status (optional)
  if (req.status) {
    const validStatuses = ['new', 'in_progress', 'production', 'completed', 'archived'];
    if (!validStatuses.includes(req.status as string)) {
      errors.push({
        field: 'status',
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        code: 'INVALID_VALUE',
      });
    }
  }

  // Validate customer_data (optional)
  if (req.customer_data) {
    if (typeof req.customer_data !== 'object') {
      errors.push({
        field: 'customer_data',
        message: 'customer_data must be an object',
        code: 'INVALID_TYPE',
      });
    } else {
      const customer = req.customer_data as Record<string, unknown>;

      if (customer.name && typeof customer.name !== 'string') {
        errors.push({
          field: 'customer_data.name',
          message: 'Name must be a string',
          code: 'INVALID_TYPE',
        });
      }

      if (customer.email && !validateEmail(customer.email as string)) {
        errors.push({
          field: 'customer_data.email',
          message: 'Email must be a valid email address',
          code: 'INVALID_FORMAT',
        });
      }

      if (customer.phone && !validatePhone(customer.phone as string)) {
        errors.push({
          field: 'customer_data.phone',
          message: 'Phone must be a valid phone number',
          code: 'INVALID_FORMAT',
        });
      }
    }
  }

  // Validate notes (optional)
  if (req.notes && typeof req.notes !== 'string') {
    errors.push({
      field: 'notes',
      message: 'Notes must be a string',
      code: 'INVALID_TYPE',
    });
  }

  return errors;
}

/**
 * Validate order item creation request
 */
export function validateOrderItemCreate(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data || typeof data !== 'object') {
    errors.push({
      field: 'root',
      message: 'Request body must be an object',
      code: 'INVALID_TYPE',
    });
    return errors;
  }

  const req = data as Record<string, unknown>;

  // Validate product_id
  if (!req.product_id || typeof req.product_id !== 'string') {
    errors.push({
      field: 'product_id',
      message: 'product_id is required and must be a string',
      code: 'REQUIRED',
    });
  }

  // Validate size
  if (!req.size || typeof req.size !== 'string') {
    errors.push({
      field: 'size',
      message: 'size is required and must be a string',
      code: 'REQUIRED',
    });
  }

  // Validate color
  if (!req.color || typeof req.color !== 'string') {
    errors.push({
      field: 'color',
      message: 'color is required and must be a string',
      code: 'REQUIRED',
    });
  }

  // Validate quantity
  if (typeof req.quantity !== 'number' || req.quantity < 1) {
    errors.push({
      field: 'quantity',
      message: 'quantity is required and must be a positive number',
      code: 'INVALID_VALUE',
    });
  }

  return errors;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page?: unknown, pageSize?: unknown): ValidationError[] {
  const errors: ValidationError[] = [];

  if (page !== undefined) {
    if (typeof page !== 'number' || page < 1) {
      errors.push({
        field: 'page',
        message: 'page must be a positive number',
        code: 'INVALID_VALUE',
      });
    }
  }

  if (pageSize !== undefined) {
    if (typeof pageSize !== 'number' || pageSize < 1 || pageSize > 100) {
      errors.push({
        field: 'pageSize',
        message: 'pageSize must be a number between 1 and 100',
        code: 'INVALID_VALUE',
      });
    }
  }

  return errors;
}
