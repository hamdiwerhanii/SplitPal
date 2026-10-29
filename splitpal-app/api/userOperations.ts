import type { UpdateUserRequest, UserData } from "@/types/auth/AuthTypes";
import API from "./client";

export const getMe = async (): Promise<UserData> => {
  const { data } = await API.get<UserData>("/user/me");
  return data;
};

export const updateMe = async (body: UpdateUserRequest): Promise<UserData> => {
  const { data } = await API.patch<UserData>("/user/me", body);
  return data;
};

export const registerPushToken = async (token: string): Promise<void> => {
  await API.post("/user/me/push-tokens", { token });
};

export const unregisterPushToken = async (token: string): Promise<void> => {
  await API.delete("/user/me/push-tokens", { data: { token } });
};
