import * as Updates from "expo-updates";
import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { DevSettings, I18nManager, Platform } from "react-native";
import type { AppLanguage } from "@/types/common/CommonTypes";
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

const i18n = createInstance();

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
} as const;

export const LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

export const isRTL = (language: AppLanguage) => language === "ar";

export const initI18n = (language: AppLanguage) => {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  }
  return i18n;
};

export const applyLayoutDirection = (language: AppLanguage): boolean => {
  const rtl = isRTL(language);

  if (Platform.OS === "web") {
    if (typeof document !== "undefined") {
      document.documentElement.dir = rtl ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
    return false;
  }

  I18nManager.allowRTL(rtl);
  if (I18nManager.isRTL === rtl) {
    return false;
  }
  I18nManager.forceRTL(rtl);
  return true;
};

export const reloadApp = async () => {
  try {
    await Updates.reloadAsync();
  } catch {
    DevSettings.reload();
  }
};

export default i18n;
