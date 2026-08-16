"use client";

const ACCESS_TOKEN_KEY = "bf_franchise_access_token";
const REFRESH_TOKEN_KEY = "bf_franchise_refresh_token";
const USER_KEY = "bf_franchise_user";

export type AuthUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
};

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function saveAuthSession(input: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, input.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, input.refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(input.user));
}

export function clearAuthSession() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}
