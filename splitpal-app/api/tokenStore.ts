import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const isWeb = Platform.OS === "web";
const hasWebStorage = () => isWeb && typeof window !== "undefined";

let memoryAccessToken: string | null = null;

const read = async (key: string): Promise<string | null> => {
  if (isWeb) {
    return hasWebStorage() ? window.localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
};

const write = async (key: string, value: string): Promise<void> => {
  if (isWeb) {
    if (hasWebStorage()) window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
};

const remove = async (key: string): Promise<void> => {
  if (isWeb) {
    if (hasWebStorage()) window.localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
};

export const getAccessToken = async (): Promise<string | null> => {
  if (memoryAccessToken) return memoryAccessToken;
  memoryAccessToken = await read(ACCESS_TOKEN_KEY);
  return memoryAccessToken;
};

export const getRefreshToken = (): Promise<string | null> =>
  read(REFRESH_TOKEN_KEY);

export const setTokens = async (
  accessToken: string,
  refreshToken: string,
): Promise<void> => {
  memoryAccessToken = accessToken;
  await write(ACCESS_TOKEN_KEY, accessToken);
  await write(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = async (): Promise<void> => {
  memoryAccessToken = null;
  await remove(ACCESS_TOKEN_KEY);
  await remove(REFRESH_TOKEN_KEY);
};
