// Logger utility - logs are disabled in production
// This prevents console output from cluttering the production app

const isDev = __DEV__;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

function createLogger(prefix?: string): Logger {
  const formatMessage = (level: LogLevel, args: unknown[]): unknown[] => {
    if (prefix) {
      return [`[${prefix}]`, ...args];
    }
    return args;
  };

  return {
    debug: (...args: unknown[]) => {
      if (isDev) {
        console.log(...formatMessage('debug', args));
      }
    },
    info: (...args: unknown[]) => {
      if (isDev) {
        console.log(...formatMessage('info', args));
      }
    },
    warn: (...args: unknown[]) => {
      // Warnings are shown in both dev and prod
      console.warn(...formatMessage('warn', args));
    },
    error: (...args: unknown[]) => {
      // Errors are always shown
      console.error(...formatMessage('error', args));
    },
  };
}

// Default logger
export const logger = createLogger();

// Create namespaced loggers for specific modules
export const authLogger = createLogger('Auth');
export const apiLogger = createLogger('API');
export const sportsDbLogger = createLogger('SportsDB');
export const tennisLogger = createLogger('Tennis');
export const configLogger = createLogger('Config');

export { createLogger };
