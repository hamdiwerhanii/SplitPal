import type { RequestOtpResponse, VerifyOtpResponse } from "@/types/auth/AuthTypes";
import API from "./client";
import { clearTokens, getRefreshToken, setTokens } from "./tokenStore";
import type { AppLanguage } from "@/types/common/CommonTypes";

export const requestOtp = async (
  email: string,
  locale: AppLanguage,
): Promise<RequestOtpResponse> => {
  const { data } = await API.post<RequestOtpResponse>("/auth/otp/request", {
    email: email.trim().toLowerCase(),
    locale,
  });
  return data;
};

export const verifyOtp = async (
  email: string,
  code: string,
  locale: AppLanguage,
): Promise<VerifyOtpResponse> => {
  const { data } = await API.post<VerifyOtpResponse>("/auth/otp/verify", {
    email: email.trim().toLowerCase(),
    code,
    locale,
  });
  await setTokens(data.accessToken, data.refreshToken);
  return data;
};

export const logout = async (pushToken?: string | null): Promise<void> => {
  try {
    const refreshToken = await getRefreshToken();
    await API.post("/auth/logout", {
      ...(refreshToken ? { refreshToken } : {}),
      ...(pushToken ? { pushToken } : {}),
    });
  } finally {
    await clearTokens();
  }
};
