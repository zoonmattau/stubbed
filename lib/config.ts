// Configuration validation and API key management

export interface ConfigValidation {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

interface ApiConfig {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
  sportsDbApiKey: string | undefined;
  apiTennisKey: string | undefined;
}

function getConfig(): ApiConfig {
  return {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    sportsDbApiKey: process.env.EXPO_PUBLIC_SPORTSDB_API_KEY,
    apiTennisKey: process.env.EXPO_PUBLIC_APITENNIS_KEY,
  };
}

/**
 * Validates all required configuration values at startup
 */
export function validateConfig(): ConfigValidation {
  const config = getConfig();
  const warnings: string[] = [];
  const errors: string[] = [];

  // Required: Supabase configuration
  if (!config.supabaseUrl) {
    errors.push('EXPO_PUBLIC_SUPABASE_URL is not set');
  } else if (!config.supabaseUrl.startsWith('https://')) {
    errors.push('EXPO_PUBLIC_SUPABASE_URL must be a valid HTTPS URL');
  }

  if (!config.supabaseAnonKey) {
    errors.push('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set');
  } else if (config.supabaseAnonKey.length < 100) {
    warnings.push('EXPO_PUBLIC_SUPABASE_ANON_KEY appears to be invalid (too short)');
  }

  // Optional: Sports APIs (will fall back to free tier or limited functionality)
  if (!config.sportsDbApiKey || config.sportsDbApiKey === '3') {
    warnings.push('EXPO_PUBLIC_SPORTSDB_API_KEY not set - using free tier (limited access)');
  }

  if (!config.apiTennisKey) {
    warnings.push('EXPO_PUBLIC_APITENNIS_KEY not set - tennis features will be limited');
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Log configuration status (for debugging)
 */
export function logConfigStatus(): void {
  const validation = validateConfig();

  if (validation.errors.length > 0) {
    console.error('[Config] Configuration errors:');
    validation.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (validation.warnings.length > 0 && __DEV__) {
    console.warn('[Config] Configuration warnings:');
    validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (validation.isValid) {
    if (__DEV__) {
      console.log('[Config] Configuration validated successfully');
    }
  }
}

/**
 * Check if a specific API is configured
 */
export function isApiConfigured(api: 'supabase' | 'sportsdb' | 'apitennis'): boolean {
  const config = getConfig();

  switch (api) {
    case 'supabase':
      return Boolean(config.supabaseUrl && config.supabaseAnonKey);
    case 'sportsdb':
      return Boolean(config.sportsDbApiKey && config.sportsDbApiKey !== '3');
    case 'apitennis':
      return Boolean(config.apiTennisKey);
    default:
      return false;
  }
}

/**
 * Get API status for display in settings/debug screens
 */
export function getApiStatus(): Record<string, { configured: boolean; tier: string }> {
  const config = getConfig();

  return {
    supabase: {
      configured: Boolean(config.supabaseUrl && config.supabaseAnonKey),
      tier: config.supabaseUrl ? 'Connected' : 'Not configured',
    },
    sportsdb: {
      configured: Boolean(config.sportsDbApiKey && config.sportsDbApiKey !== '3'),
      tier: !config.sportsDbApiKey || config.sportsDbApiKey === '3' ? 'Free' : 'Paid',
    },
    apitennis: {
      configured: Boolean(config.apiTennisKey),
      tier: config.apiTennisKey ? 'Active' : 'Not configured',
    },
  };
}
