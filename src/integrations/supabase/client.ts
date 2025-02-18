
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Get the current URL for redirect
const getRedirectTo = () => {
  // Use window.location.origin to get the current domain
  return `${window.location.origin}/alchemist-workshop`;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    autoRefreshToken: true,
    persistSession: true,
    storage: {
      // Use local storage to persist the session
      getItem: (key) => {
        try {
          const value = localStorage.getItem(key);
          return value ? JSON.parse(value) : null;
        } catch (error) {
          console.error('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Error removing from localStorage:', error);
        }
      },
    },
  },
  global: {
    headers: {
      'x-application-name': 'resume-alchemist',
    },
  },
});

// Update auth configuration with dynamic redirect
supabase.auth.setSession = async function(...args) {
  const response = await this._getAuthResponse(...args);
  if (response.error) {
    throw response.error;
  }
  
  // Force a session refresh after setting to ensure proper state
  await this.auth.refreshSession();
  return response;
};

// Helper function for login with dynamic redirect
export const signInWithProvider = async (provider: 'google' | 'linkedin_oidc') => {
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getRedirectTo(),
      queryParams: {
        prompt: 'consent'
      }
    },
  });
};
