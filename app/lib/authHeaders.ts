import { User } from "@supabase/supabase-js";

/**
 * Generate authenticated headers for API requests
 * @param user - The authenticated Supabase user
 * @returns Headers object with Authorization and Content-Type
 */
export function getAuthHeaders(user: User | null): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (user?.id) {
    headers.Authorization = `Bearer ${user.id}`;
  }

  return headers;
}

/**
 * Create a fetch options object with authenticated headers
 * @param user - The authenticated Supabase user
 * @param method - HTTP method (default: 'GET')
 * @param body - Request body (optional)
 * @returns RequestInit object ready for fetch
 */
export function createAuthFetchOptions(
  user: User | null,
  method: string = "GET",
  body?: BodyInit
): RequestInit {
  const options: RequestInit = {
    method,
    headers: getAuthHeaders(user),
  };

  if (body) {
    options.body = body;
  }

  return options;
}

/**
 * Check if a user is authenticated (has a valid ID)
 * @param user - The Supabase user object
 * @returns boolean indicating if user is authenticated
 */
export function isUserAuthenticated(user: User | null): user is User {
  return user !== null && !!user.id;
}
