import axios, { AxiosError, create, InternalAxiosRequestConfig } from "axios";
import type { AuthTokens } from "@/types/auth/AuthTypes";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./tokenStore";

export const getApiBaseUrl = () => {
  const configured = (process.env.EXPO_PUBLIC_BACKEND_URL || "").trim();
  const normalized = (configured || "http://localhost:5000").replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
};

const API = create({
  baseURL: getApiBaseUrl(),
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

const AUTH_ENDPOINTS = ["/auth/otp/request", "/auth/otp/verify", "/auth/refresh"];

let refreshPromise: Promise<string> | null = null;
let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredHandler = (handler: () => void) => {
  onSessionExpired = handler;
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  const { data } = await axios.post<AuthTokens>(
    `${getApiBaseUrl()}/auth/refresh`,
    { refreshToken },
    { timeout: 15_000 },
  );
  await setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
};

API.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;

    const isAuthCall = AUTH_ENDPOINTS.some((path) =>
      original?.url?.includes(path),
    );

    if (error.response?.status !== 401 || !original || original._retry || isAuthCall) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const accessToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${accessToken}`;
      return API(original);
    } catch (refreshError) {
      const isRejected =
        refreshError instanceof AxiosError
          ? refreshError.response?.status === 401
          : true;
      if (isRejected) {
        await clearTokens();
        onSessionExpired?.();
      }
      return Promise.reject(refreshError);
    }
  },
);

export default API;
