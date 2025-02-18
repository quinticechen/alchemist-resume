
import { createClient } from '@supabase/supabase-js';

// Use the project ID from our config file to construct the URL
const projectId = 'vhofgqmmovjtcnakowlv';
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2ZncW1tb3ZqdGNuYWtvd2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzM3MzYsImV4cCI6MjA1MjE0OTczNn0.-kse7xq6jQtuOjEWym-9PKCB8Emjv_IMeGi52ciuGtk';

// Get the current URL for redirect
const getRedirectTo = () => {
  // Get the complete current URL or fallback to the site URL
  return typeof window !== 'undefined' ? window.location.href : 'https://resumealchemist.qwizai.com';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    autoRefreshToken: true,
    persistSession: true,
    storage: {
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
