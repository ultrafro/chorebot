// Simple authentication helper
// In a production app, this would use proper JWT tokens, OAuth, etc.

export function authenticateRequest(headers: Headers): {
  isValid: boolean;
  userId?: string;
} {
  const authHeader = headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { isValid: false };
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // Simple token validation - in production, this would verify JWT or similar
  if (!token || token.length < 3) {
    return { isValid: false };
  }

  // For this demo, we'll just use the token as the userId
  return { isValid: true, userId: token };
}

export function createAuthError() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
