import { AxiosError } from "axios";
import type { ApiErrorBody } from "@/types/common/CommonTypes";

export const isNetworkError = (error: unknown): boolean =>
  error instanceof AxiosError && !error.response;

export const getApiErrorCode = (error: unknown): string | undefined => {
  if (error instanceof AxiosError) {
    return (error.response?.data as ApiErrorBody | undefined)?.code;
  }
  return undefined;
};

export const getApiErrorStatus = (error: unknown): number | undefined =>
  error instanceof AxiosError ? error.response?.status : undefined;

export const getApiErrorMessage = (error: unknown): string | undefined => {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as ApiErrorBody | undefined)?.message;
    return Array.isArray(message) ? message.join(", ") : message;
  }
  return error instanceof Error ? error.message : undefined;
};
