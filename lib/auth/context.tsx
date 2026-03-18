'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase, getSessionToken } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  company_name: string | null;
  company_tax_code: string | null;
  position: string | null;
  avatar_url: string | null;
  account_status: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    metadata: { full_name: string; phone?: string }
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    console.log('[AuthContext] Fetching profile for userId:', userId);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, phone, company_name, company_tax_code, position, avatar_url, account_status, role')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] Profile fetch error:', error);
      } else if (data) {
        console.log('[AuthContext] Profile loaded successfully:', {
          email: data.email,
          role: data.role,
          account_status: data.account_status
        });
        setProfile(data);
      } else {
        console.warn('[AuthContext] No profile found for userId:', userId);
      }
    } catch (err) {
      console.error('[AuthContext] Profile fetch exception:', err);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchProfile(s.user.id); // MUST await before setLoading(false)
      }
      setLoading(false); // Only mark done after profile is loaded
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        (async () => {
          await fetchProfile(s.user.id);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: { full_name: string; phone?: string }
  ) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.full_name,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Merge guest chat history if applicable
    if (authData.user) {
      try {
        // Get guest email from localStorage
        const guestEmail = typeof window !== 'undefined'
          ? localStorage.getItem('chatbot_guest_email')
          : null;

        // Get current session token
        const guestSessionToken = getSessionToken();

        // If guest email matches signup email, merge chat history
        if (guestEmail === email && guestSessionToken) {
          console.log('Merging guest chat history for email:', email);

          // Update all messages from this session to belong to the new user
          const { error: updateError } = await supabase
            .from('chat_messages')
            .update({ user_id: authData.user.id })
            .eq('session_id', guestSessionToken)
            .is('user_id', null);

          if (updateError) {
            console.error('Failed to merge chat history:', updateError);
          } else {
            console.log('Successfully merged chat history');
          }

          // Clear guest data from localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('chatbot_guest_email');
            localStorage.removeItem('chatbot_email_collected');
            localStorage.removeItem('chatbot_question_count');
          }
        }
      } catch (mergeError) {
        console.error('Error during chat history merge:', mergeError);
        // Don't fail signup if merge fails - it's non-critical
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dat-lai-mat-khau`,
    });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { error: error.message };
    }
    return { error: null };
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, isAdmin, signIn, signUp, signOut, refreshProfile, resetPasswordForEmail, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
