// Retry utility for API calls with exponential backoff

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay in milliseconds (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Whether to use exponential backoff (default: true) */
  exponential?: boolean;
  /** Function to determine if an error is retryable */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Callback for each retry attempt */
  onRetry?: (error: unknown, attempt: number, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponential: true,
  shouldRetry: (error) => {
    // By default, retry on network errors and 5xx status codes
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      // Network errors
      if (message.includes('network') || message.includes('fetch')) {
        return true;
      }
      // Server errors (5xx)
      if (message.includes('500') || message.includes('502') ||
          message.includes('503') || message.includes('504')) {
        return true;
      }
      // Rate limiting
      if (message.includes('429') || message.includes('rate limit')) {
        return true;
      }
    }
    return false;
  },
  onRetry: () => {},
};

/**
 * Calculate delay for a retry attempt with exponential backoff and jitter
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  if (!options.exponential) {
    return options.baseDelay;
  }

  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = options.baseDelay * Math.pow(2, attempt);

  // Add jitter (±25%) to prevent thundering herd
  const jitter = exponentialDelay * (0.75 + Math.random() * 0.5);

  // Cap at maxDelay
  return Math.min(jitter, options.maxDelay);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= opts.maxRetries || !opts.shouldRetry(error, attempt)) {
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, opts);
      opts.onRetry(error, attempt + 1, delay);

      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Create a retryable version of a function
 */
export function makeRetryable<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return (...args: TArgs) => withRetry(() => fn(...args), options);
}

/**
 * Retry a fetch request with proper handling
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(url, init);

      // Throw on server errors so they can be retried
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Throw on rate limiting
      if (response.status === 429) {
        throw new Error('Rate limited: 429');
      }

      return response;
    },
    {
      ...options,
      shouldRetry: (error, attempt) => {
        // Use custom shouldRetry if provided
        if (options.shouldRetry) {
          return options.shouldRetry(error, attempt);
        }

        // Default retry logic for fetch
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          return (
            message.includes('network') ||
            message.includes('fetch') ||
            message.includes('server error') ||
            message.includes('rate limit') ||
            message.includes('429')
          );
        }
        return false;
      },
    }
  );
}
