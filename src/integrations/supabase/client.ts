
import { createClient } from '@supabase/supabase-js';

// Use the project ID from our config file to construct the URL
const projectId = 'vhofgqmmovjtcnakowlv';
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2ZncW1tb3ZqdGNuYWtvd2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzM3MzYsImV4cCI6MjA1MjE0OTczNn0.-kse7xq6jQtuOjEWym-9PKCB8Emjv_IMeGi52ciuGtk';

// Get the current environment
export const getEnvironment = () => {
  // Check if window is defined (client-side)
  if (typeof window === 'undefined') return 'development';
  
  const hostname = window.location.hostname;
  
  console.log(`Detecting environment from hostname: ${hostname}`);
  
  // Production domains
  if (hostname.includes('resumealchemist.com') || hostname.includes('resumealchemist.qwizai.com')) {
    return 'production';
  }
  
  // Local development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'development';
  }
  
  // Staging
  if (hostname.includes('staging.resumealchemist')) {
    return 'staging';
  }
  
  // Vercel preview deployments
  if (hostname.includes('vercel.app')) {
    if (hostname.includes('-git-') || hostname.includes('-pr-')) {
      return 'preview';
    }
  }
  
  // Default to staging for safety
  return 'staging';
};

// Get the current URL for redirect
const getRedirectTo = () => {
  // Get the complete current URL or fallback to the site URL
  return typeof window !== 'undefined' ? window.location.href : 'https://resumealchemist.qwizai.com';
};

// Create the Supabase client with customized configuration
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
          // console.error('Error reading from localStorage:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          // console.error('Error writing to localStorage:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          // console.error('Error removing from localStorage:', error);
        }
      },
    },
  },
  global: {
    // Only sending minimal headers to avoid CORS issues
    headers: {
      'x-environment': getEnvironment(),
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
