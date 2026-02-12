import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function generateSessionToken(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function getSessionToken(): string {
  if (typeof window === 'undefined') return generateSessionToken();

  let token = localStorage.getItem('chat_session_token');
  if (!token) {
    token = generateSessionToken();
    localStorage.setItem('chat_session_token', token);
  }
  return token;
}
