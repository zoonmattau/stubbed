// Simple client-side rate limiter to prevent excessive API calls

interface RateLimiterConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimiterState {
  requests: number[];
}

class RateLimiter {
  private state: Map<string, RateLimiterState> = new Map();
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
  }

  /**
   * Check if a request can be made for the given key
   */
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const state = this.getState(key);

    // Remove requests outside the time window
    state.requests = state.requests.filter(
      (timestamp) => now - timestamp < this.config.windowMs
    );

    return state.requests.length < this.config.maxRequests;
  }

  /**
   * Record a request for the given key
   */
  recordRequest(key: string): void {
    const state = this.getState(key);
    state.requests.push(Date.now());
  }

  /**
   * Get time until the next request can be made (in ms)
   */
  getTimeUntilNextRequest(key: string): number {
    const now = Date.now();
    const state = this.getState(key);

    if (state.requests.length < this.config.maxRequests) {
      return 0;
    }

    // Find the oldest request in the window
    const oldestRequest = Math.min(...state.requests);
    const timeUntilOldestExpires = this.config.windowMs - (now - oldestRequest);

    return Math.max(0, timeUntilOldestExpires);
  }

  /**
   * Execute a function with rate limiting
   */
  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (!this.canMakeRequest(key)) {
      const waitTime = this.getTimeUntilNextRequest(key);
      throw new RateLimitError(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
        waitTime
      );
    }

    this.recordRequest(key);
    return fn();
  }

  /**
   * Execute with automatic waiting if rate limited
   */
  async executeWithWait<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (!this.canMakeRequest(key)) {
      const waitTime = this.getTimeUntilNextRequest(key);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.recordRequest(key);
    return fn();
  }

  private getState(key: string): RateLimiterState {
    if (!this.state.has(key)) {
      this.state.set(key, { requests: [] });
    }
    return this.state.get(key)!;
  }

  /**
   * Clear all rate limit state (useful for testing)
   */
  clear(): void {
    this.state.clear();
  }
}

export class RateLimitError extends Error {
  public waitTime: number;

  constructor(message: string, waitTime: number) {
    super(message);
    this.name = 'RateLimitError';
    this.waitTime = waitTime;
  }
}

// Pre-configured rate limiters for different APIs
export const sportsDbRateLimiter = new RateLimiter({
  maxRequests: 30,  // 30 requests
  windowMs: 60000,  // per minute
});

export const tennisApiRateLimiter = new RateLimiter({
  maxRequests: 20,  // 20 requests
  windowMs: 60000,  // per minute
});

export const supabaseRateLimiter = new RateLimiter({
  maxRequests: 100, // 100 requests
  windowMs: 60000,  // per minute
});

export { RateLimiter };
