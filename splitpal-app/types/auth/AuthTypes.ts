import type { AppLanguage, CurrencyCode } from "@/types/common/CommonTypes";

export type UserData = {
  id: string;
  email: string;
  name: string;
  locale: AppLanguage;
  defaultCurrency: CurrencyCode;
  notificationsEnabled: boolean;
  profileCompleted: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type RequestOtpResponse = {
  message: string;
  expiresInSeconds: number;
  resendAfterSeconds: number;
};

export type VerifyOtpResponse = AuthTokens & {
  user: UserData;
  isNewUser: boolean;
};

export type UpdateUserRequest = Partial<
  Pick<UserData, "name" | "locale" | "defaultCurrency" | "notificationsEnabled">
>;
