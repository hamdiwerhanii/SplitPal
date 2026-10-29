import { useTranslation } from "react-i18next";
import { Alert } from "react-native";
import { updateMe } from "@/api/userOperations";
import { applyLayoutDirection, reloadApp } from "@/i18n";
import useAuthStore from "@/stores/authStore";
import useSettingsStore from "@/stores/settingsStore";
import type { AppLanguage } from "@/types/common/CommonTypes";

export const useLanguage = () => {
  const { t, i18n } = useTranslation();
  const language = useSettingsStore((state) => state.language);

  const changeLanguage = async (next: AppLanguage) => {
    if (next === language) return;

    useSettingsStore.getState().setLanguage(next);
    await i18n.changeLanguage(next);

    if (useAuthStore.getState().isAuthenticated) {
      updateMe({ locale: next })
        .then((user) => useAuthStore.getState().setUser(user))
        .catch(() => undefined);
    }

    if (applyLayoutDirection(next)) {
      Alert.alert(t("settings.restartTitle"), t("settings.restartMessage"), [
        { text: t("settings.restart"), onPress: () => void reloadApp() },
      ]);
    }
  };

  return { language, changeLanguage };
};
