// PLACE THIS FILE IN: frontend/lib/config.ts

export const getBackendUrl = () => {
  // 1. If we are in Production (Vercel), this variable MUST be set in Vercel Settings
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }

  // 2. Fallback for Local Development
  // This will strictly be used if the above variable is missing
  return "http://127.0.0.1:8000";
};

export const API_BASE_URL = getBackendUrl();
