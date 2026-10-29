import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { SUPPORTED_LANGUAGES } from "@/constants/options";
import type { AppLanguage, ThemePreference } from "@/types/common/CommonTypes";

const detectDeviceLanguage = (): AppLanguage => {
  const code = getLocales()[0]?.languageCode ?? "en";
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(code)
    ? (code as AppLanguage)
    : "en";
};

type SettingsState = {
  language: AppLanguage;
  theme: ThemePreference;
  pushToken: string | null;
  hasHydrated: boolean;
  setLanguage: (language: AppLanguage) => void;
  setTheme: (theme: ThemePreference) => void;
  setPushToken: (token: string | null) => void;
};

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: detectDeviceLanguage(),
      theme: "system",
      pushToken: null,
      hasHydrated: false,
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      setPushToken: (pushToken) => set({ pushToken }),
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ language, theme, pushToken }) => ({
        language,
        theme,
        pushToken,
      }),
      onRehydrateStorage: () => () => {
        useSettingsStore.setState({ hasHydrated: true });
      },
    },
  ),
);

export default useSettingsStore;
