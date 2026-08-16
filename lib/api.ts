"use client";

import { clearAuthSession, getAccessToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

function redirectToLoginOnUnauthorized() {
  if (typeof window === "undefined") {
    return;
  }

  clearAuthSession();

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (options.auth !== false) {
    const token = getAccessToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) {
      redirectToLoginOnUnauthorized();
    }

    const message =
      data?.message instanceof Array
        ? data.message.join(", ")
        : data?.message || "Request failed";
    throw new Error(message);
  }

  return data as T;
}

export type LoginResponse =
  | {
      status: "2FA_REQUIRED";
      method?: "AUTH_APP" | "OTP";
      twoFactorToken: string;
      expiresInSeconds: number;
      devOtp?: string;
    }
  | {
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        role: string;
      };
    };

export type PhoneOtpResponse = {
  status: "PHONE_OTP_SENT";
  loginOtpToken: string;
  expiresInSeconds: number;
  devOtp?: string;
};
