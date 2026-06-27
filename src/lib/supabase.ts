import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/*
 * Supabase client management.
 *
 * Configuration priority:
 *   1. Hardcoded project credentials (default — works on every device)
 *   2. Vite env vars  VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 *   3. localStorage   finflow-supabase-config  (runtime override via Setup screen)
 */

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

const CONFIG_KEY = 'finflow-supabase-config';

// ---- Hardcoded project credentials (global default) ----
const HARDCODED_URL = 'https://xymvqphxiqyreuaoahxn.supabase.co';
const HARDCODED_KEY = 'sb_publishable_TUwGpwJIyWKz-k027s7fDg_KR90dZSn';

let client: SupabaseClient | null = null;
let clientConfig: SupabaseConfig | null = null;

// Controls whether auth tokens persist in localStorage (true) or
// sessionStorage (false = cleared when tab closes).
let persistInLocalStorage = true;

const authStorage = {
  getItem: (key: string): string | null =>
    localStorage.getItem(key) ?? sessionStorage.getItem(key),
  setItem: (key: string, value: string): void => {
    if (persistInLocalStorage) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export function getSupabaseConfig(): SupabaseConfig | null {
  // 1. Hardcoded default (works on every device)
  if (HARDCODED_URL && HARDCODED_KEY) {
    return { url: HARDCODED_URL, anonKey: HARDCODED_KEY };
  }
  // 2. env vars
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (envUrl && envKey && !envUrl.includes('your-') && !envUrl.includes('placeholder')) {
    return { url: envUrl, anonKey: envKey };
  }
  // 3. localStorage (runtime override)
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SupabaseConfig>;
      if (parsed.url && parsed.anonKey) return { url: parsed.url, anonKey: parsed.anonKey };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
 localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, anonKey }));
  // Force client re-creation on next getSupabase() call.
  client = null;
  clientConfig = null;
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(CONFIG_KEY);
  client = null;
  clientConfig = null;
}

/**
 * Set whether the *next* auth session should persist across browser restarts.
 * Call this right before signIn.
 */
export function setSessionPersistence(persistent: boolean): void {
  persistInLocalStorage = persistent;
}

export function getSupabase(): SupabaseClient {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase is not configured. Please set up your project.');
  }
  if (!client || clientConfig?.url !== config.url) {
    client = createClient(config.url, config.anonKey, {
      auth: {
        storage: authStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    clientConfig = config;
  }
  return client;
}
