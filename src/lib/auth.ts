import type { User } from '@supabase/supabase-js';
import { getSupabase, setSessionPersistence } from './supabase';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    name: (user.user_metadata?.full_name as string) ||
          (user.email?.split('@')[0] ?? 'User'),
    email: user.email ?? '',
  };
}

/* ------------------------------------------------------------------ */
/*  Email / password auth                                             */
/* ------------------------------------------------------------------ */

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: SessionUser;
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) return { ok: false, error: 'Please enter your name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
    return { ok: false, error: 'Please enter a valid email address.' };
  if (password.length < 6)
    return { ok: false, error: 'Password must be at least 6 characters.' };

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { full_name: cleanName } },
    });
    if (error) return { ok: false, error: translateError(error.message) };
    if (!data.user) return { ok: false, error: 'Registration failed. Please try again.' };
    return { ok: true, user: toSessionUser(data.user) };
  } catch (e) {
    return { ok: false, error: 'Unable to connect. Check your connection and try again.' };
  }
}

export async function signIn(
  email: string,
  password: string,
  stayLoggedIn: boolean,
): Promise<AuthResult> {
  setSessionPersistence(stayLoggedIn);
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { ok: false, error: translateError(error.message) };
    if (!data.user) return { ok: false, error: 'Login failed. Please try again.' };
    return { ok: true, user: toSessionUser(data.user) };
  } catch (e) {
    return { ok: false, error: 'Unable to connect. Check your connection and try again.' };
  }
}

/* ------------------------------------------------------------------ */
/*  Google OAuth                                                      */
/* ------------------------------------------------------------------ */

export async function signInWithGoogle(stayLoggedIn: boolean): Promise<AuthResult> {
  setSessionPersistence(stayLoggedIn);
  try {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: stayLoggedIn ? {} : { prompt: 'consent' },
      },
    });
    if (error) return { ok: false, error: translateError(error.message) };
    // The browser will redirect to Google — no immediate user to return.
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Unable to start Google sign-in. Please try again.' };
  }
}

/* ------------------------------------------------------------------ */
/*  Session management                                                */
/* ------------------------------------------------------------------ */

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getUser();
    return data.user ? toSessionUser(data.user) : null;
  } catch {
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }
}

export function onAuthChange(
  callback: (user: SessionUser | null) => void,
): () => void {
  const supabase = getSupabase();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? toSessionUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}

/* ------------------------------------------------------------------ */

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Incorrect email or password.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'An account with this email already exists.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a moment.';
  if (m.includes('email not confirmed'))
    return 'Please check your inbox and confirm your email before signing in.';
  return msg;
}
