

import { createClient } from '@supabase/supabase-js';

// Use the project ID from our config file to construct the URL
const projectId = 'vhofgqmmovjtcnakowlv';
const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2ZncW1tb3ZqdGNuYWtvd2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzM3MzYsImV4cCI6MjA1MjE0OTczNn0.-kse7xq6jQtuOjEWym-9PKCB8Emjv_IMeGi52ciuGtk';

// Get the current environment
const getEnvironment = () => {
  const hostname = window.location.hostname;
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'development';
  }
  if (hostname.includes('vercel.app')) {
    // Check if it's a preview deployment
    if (hostname.includes('-git-') || hostname.includes('-pr-')) {
      return 'preview';
    }
  }
  return 'production';
};

// Get the current URL for redirect
const getRedirectTo = () => {
  // Get the complete current URL or fallback to the site URL
  return typeof window !== 'undefined' ? window.location.href : 'https://resumealchemist.qwizai.com';
};

console.log('Current environment:', getEnvironment());

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
    // Only sending minimal headers to avoid CORS issues
    // The x-environment header is added only to regular API calls, not Edge functions
    headers: {
      'x-environment': getEnvironment(),
    },
  },
  // Custom fetch function to handle Edge Functions differently
  fetch: (url, options) => {
    const isEdgeFunction = url.includes('/functions/v1/');
    
    if (isEdgeFunction) {
      // For Edge Functions, only include essential headers to avoid CORS issues
      if (options?.headers) {
        const headers = new Headers(options.headers);
        
        // Remove the x-environment header for Edge Function calls
        if (headers.has('x-environment')) {
          headers.delete('x-environment');
        }
        
        // Update the options with the modified headers
        options.headers = headers;
      }
    }
    
    return fetch(url, options);
  }
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

// import { createClient } from '@supabase/supabase-js';

// // Use the project ID from our config file to construct the URL
// const projectId = 'vhofgqmmovjtcnakowlv';
// const supabaseUrl = `https://${projectId}.supabase.co`;
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZob2ZncW1tb3ZqdGNuYWtvd2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzM3MzYsImV4cCI6MjA1MjE0OTczNn0.-kse7xq6jQtuOjEWym-9PKCB8Emjv_IMeGi52ciuGtk';

// // Get the current environment
// const getEnvironment = () => {
//   const hostname = window.location.hostname;
//   if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
//     return 'development';
//   }
//   if (hostname.includes('vercel.app')) {
//     // Check if it's a preview deployment
//     if (hostname.includes('-git-') || hostname.includes('-pr-')) {
//       return 'preview';
//     }
//   }
//   return 'production';
// };

// // Get the current URL for redirect
// const getRedirectTo = () => {
//   // Get the complete current URL or fallback to the site URL
//   return typeof window !== 'undefined' ? window.location.href : 'https://resumealchemist.qwizai.com';
// };

// console.log('Current environment:', getEnvironment());

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   auth: {
//     flowType: 'pkce',
//     detectSessionInUrl: true,
//     autoRefreshToken: true,
//     persistSession: true,
//     storage: {
//       getItem: (key) => {
//         try {
//           const value = localStorage.getItem(key);
//           return value ? JSON.parse(value) : null;
//         } catch (error) {
//           console.error('Error reading from localStorage:', error);
//           return null;
//         }
//       },
//       setItem: (key, value) => {
//         try {
//           localStorage.setItem(key, JSON.stringify(value));
//         } catch (error) {
//           console.error('Error writing to localStorage:', error);
//         }
//       },
//       removeItem: (key) => {
//         try {
//           localStorage.removeItem(key);
//         } catch (error) {
//           console.error('Error removing from localStorage:', error);
//         }
//       },
//     },
//   },
//   global: {
//     // We'll leave the headers in but not send them for specific function calls that have CORS issues
//     headers: {
//       'x-application-name': 'resume-alchemist',
//       'x-environment': getEnvironment(), // Add environment to headers
//     },
//   },
// });

// // Helper function for login with dynamic redirect
// export const signInWithProvider = async (provider: 'google' | 'linkedin_oidc') => {
//   return supabase.auth.signInWithOAuth({
//     provider,
//     options: {
//       redirectTo: getRedirectTo(),
//       queryParams: {
//         prompt: 'consent'
//       }
//     },
//   });
// };
