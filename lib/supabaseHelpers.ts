// Supabase helper utilities for response validation and error handling

import { PostgrestError, PostgrestSingleResponse, PostgrestResponse } from '@supabase/supabase-js';

/**
 * Result type for Supabase operations
 */
export interface SupabaseResult<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * Validates a Supabase single response and returns a typed result
 */
export function validateSingleResponse<T>(
  response: PostgrestSingleResponse<T>,
  options?: {
    /** Allow null/undefined data (e.g., when record doesn't exist) */
    allowEmpty?: boolean;
    /** Custom error message prefix */
    errorPrefix?: string;
  }
): SupabaseResult<T | null> {
  const { allowEmpty = false, errorPrefix = 'Database error' } = options || {};

  if (response.error) {
    // PGRST116 = "no rows returned" - often expected (e.g., new user without profile)
    if (response.error.code === 'PGRST116' && allowEmpty) {
      return { success: true, data: null };
    }

    return {
      success: false,
      data: null,
      error: formatError(response.error, errorPrefix),
    };
  }

  if (!response.data && !allowEmpty) {
    return {
      success: false,
      data: null,
      error: `${errorPrefix}: No data returned`,
    };
  }

  return { success: true, data: response.data };
}

/**
 * Validates a Supabase array response and returns a typed result
 */
export function validateArrayResponse<T>(
  response: PostgrestResponse<T>,
  options?: {
    /** Custom error message prefix */
    errorPrefix?: string;
  }
): SupabaseResult<T[]> {
  const { errorPrefix = 'Database error' } = options || {};

  if (response.error) {
    return {
      success: false,
      data: [],
      error: formatError(response.error, errorPrefix),
    };
  }

  return { success: true, data: response.data || [] };
}

/**
 * Validates an RPC response and returns a typed result
 */
export function validateRpcResponse<T>(
  response: { data: T | null; error: PostgrestError | null },
  options?: {
    /** Default value if data is null */
    defaultValue?: T;
    /** Custom error message prefix */
    errorPrefix?: string;
  }
): SupabaseResult<T> {
  const { defaultValue, errorPrefix = 'RPC error' } = options || {};

  if (response.error) {
    return {
      success: false,
      data: defaultValue as T,
      error: formatError(response.error, errorPrefix),
    };
  }

  if (response.data === null && defaultValue !== undefined) {
    return { success: true, data: defaultValue };
  }

  if (response.data === null) {
    return {
      success: false,
      data: undefined as T,
      error: `${errorPrefix}: No data returned`,
    };
  }

  return { success: true, data: response.data };
}

/**
 * Format a PostgrestError into a user-friendly message
 */
function formatError(error: PostgrestError, prefix: string): string {
  // Map common Supabase error codes to friendly messages
  const errorMessages: Record<string, string> = {
    'PGRST116': 'Record not found',
    'PGRST204': 'No content',
    '23505': 'A record with this value already exists',
    '23503': 'Related record not found',
    '42501': 'Permission denied',
    '42P01': 'Table not found',
    'PGRST301': 'Request timed out',
  };

  const friendlyMessage = errorMessages[error.code || ''];
  if (friendlyMessage) {
    return `${prefix}: ${friendlyMessage}`;
  }

  return `${prefix}: ${error.message}`;
}

/**
 * Checks if an error is a "not found" error (PGRST116)
 */
export function isNotFoundError(error: PostgrestError | null): boolean {
  return error?.code === 'PGRST116';
}

/**
 * Checks if an error is a duplicate key error (23505)
 */
export function isDuplicateError(error: PostgrestError | null): boolean {
  return error?.code === '23505';
}

/**
 * Checks if an error is a permission error (42501)
 */
export function isPermissionError(error: PostgrestError | null): boolean {
  return error?.code === '42501';
}

/**
 * Wrapper for executing Supabase queries with standardized error handling
 */
export async function safeQuery<T>(
  queryFn: () => Promise<PostgrestSingleResponse<T>>,
  options?: {
    allowEmpty?: boolean;
    errorPrefix?: string;
  }
): Promise<SupabaseResult<T | null>> {
  try {
    const response = await queryFn();
    return validateSingleResponse(response, options);
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Wrapper for executing Supabase array queries with standardized error handling
 */
export async function safeArrayQuery<T>(
  queryFn: () => Promise<PostgrestResponse<T>>,
  options?: {
    errorPrefix?: string;
  }
): Promise<SupabaseResult<T[]>> {
  try {
    const response = await queryFn();
    return validateArrayResponse(response, options);
  } catch (error) {
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
