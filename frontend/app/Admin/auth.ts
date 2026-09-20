import { API_BASE_URL } from "../config";

// Access tokens are session-scoped; refresh tokens remain in an HttpOnly cookie.
const ACCESS_TOKEN_KEY = "access_token";

export type TokenClaims = {
  sub: string;
  role?: string;
  exp?: number;
};

// Read the JWT without treating its client-side claims as trusted authorization.
export function getAccessToken(): string | null {
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function storeAccessToken(token: string): void {
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function refreshAccessToken(): Promise<string | null> {
  const response = await fetch(`${API_BASE_URL}/users/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    clearAccessToken();
    return null;
  }
  const result: { access_token: string } = await response.json();
  storeAccessToken(result.access_token);
  return result.access_token;
}

export function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Retry one protected request after rotating an expired access token.
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const request = () =>
    fetch(input, {
      ...init,
      credentials: "include",
      headers: { ...init.headers, ...authHeaders() },
    });

  const response = await request();
  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();
  return refreshedToken ? request() : response;
}

// Decode the payload so the UI can choose the correct post-login destination.
export function getTokenClaims(): TokenClaims | null {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return null;
    const base64Payload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = base64Payload.padEnd(
      base64Payload.length + ((4 - (base64Payload.length % 4)) % 4),
      "=",
    );
    return JSON.parse(window.atob(paddedPayload)) as TokenClaims;
  } catch {
    return null;
  }
}

export function isTokenExpired(claims: TokenClaims | null): boolean {
  return Boolean(claims?.exp && claims.exp * 1000 <= Date.now());
}
