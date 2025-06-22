import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "67d215eee247587cfc436f56", 
  requiresAuth: true // Ensure authentication is required for all operations
});
