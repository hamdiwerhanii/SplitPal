import { useMutation } from "@tanstack/react-query";
import Constants from "expo-constants";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { unregisterPushToken, updateMe } from "@/api/userOperations";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import Screen from "@/components/ui/Screen";
import SegmentedControl from "@/components/ui/SegmentedControl";
import { useThemeColors } from "@/constants/theme";
import { useLanguage } from "@/hooks/useLanguage";
import { LANGUAGES } from "@/i18n";
import useAuthStore from "@/stores/authStore";
import useOutboxStore from "@/stores/outboxStore";
import useSettingsStore from "@/stores/settingsStore";
import type { UpdateUserRequest } from "@/types/auth/AuthTypes";
import type { AppLanguage, ThemePreference } from "@/types/common/CommonTypes";
import { SUPPORTED_CURRENCIES } from "@/constants/options";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="label px-1">{title}</Text>
      <View className="rounded-2xl bg-surface border border-border p-4 gap-4">{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const outboxCount = useOutboxStore((state) => state.items.length);
  const { language, changeLanguage } = useLanguage();
  const [name, setName] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: (body: UpdateUserRequest) => updateMe(body),
    onSuccess: (updated) => {
      setUser(updated);
      Toast.show({ type: "success", text1: t("settings.saved") });
    },
    onError: () => Toast.show({ type: "error", text1: t("common.somethingWrong") }),
  });

  const toggleNotifications = (enabled: boolean) => {
    update.mutate({ notificationsEnabled: enabled });
    const token = useSettingsStore.getState().pushToken;
    if (!enabled && token) {
      void unregisterPushToken(token).catch(() => undefined);
    }
  };

  const confirmLogout = () =>
    Alert.alert(
      t("settings.logoutConfirm"),
      outboxCount > 0 ? t("settings.logoutPending", { count: outboxCount }) : undefined,
      [
        { text: t("common.cancel"), style: "cancel" },
        { text: t("settings.logout"), style: "destructive", onPress: () => void logout() },
      ],
    );

  if (!user) return null;
  const currentName = name ?? user.name;

  return (
    <Screen title={t("settings.title")}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pb-10 gap-6">
        <View className="items-center gap-2 py-2">
          <Avatar id={user.id} name={user.name} size={72} />
          <Text className="text-lg font-bold text-foreground">{user.name}</Text>
          <Text className="text-sm text-muted">{user.email}</Text>
        </View>

        <Section title={t("settings.profile")}>
          <FormInput
            label={t("settings.name")}
            value={currentName}
            onChangeText={setName}
            maxLength={60}
          />
          {name !== null && name.trim() && name.trim() !== user.name ? (
            <Button
              label={t("common.save")}
              size="sm"
              loading={update.isPending}
              onPress={() =>
                update.mutate({ name: name.trim() }, { onSuccess: () => setName(null) })
              }
            />
          ) : null}
        </Section>

        <Section title={t("settings.preferences")}>
          <View className="gap-2">
            <Text className="label">{t("settings.language")}</Text>
            <SegmentedControl<AppLanguage>
              value={language}
              onChange={(next) => void changeLanguage(next)}
              options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
            />
          </View>
          <View className="gap-2">
            <Text className="label">{t("settings.theme")}</Text>
            <SegmentedControl<ThemePreference>
              value={theme}
              onChange={setTheme}
              options={[
                { value: "system", label: t("settings.themeSystem") },
                { value: "light", label: t("settings.themeLight") },
                { value: "dark", label: t("settings.themeDark") },
              ]}
            />
          </View>
          <View className="gap-2">
            <Text className="label">{t("settings.currency")}</Text>
            <View className="flex-row flex-wrap gap-2">
              {SUPPORTED_CURRENCIES.map((currency) => {
                const selected = user.defaultCurrency === currency;
                return (
                  <Pressable
                    key={currency}
                    onPress={() => update.mutate({ defaultCurrency: currency })}
                    className={`px-3 py-1.5 rounded-full border ${
                      selected ? "bg-primary-soft border-primary" : "border-border"
                    }`}
                  >
                    <Text className={`text-sm font-semibold ${selected ? "text-positive" : "text-foreground"}`}>
                      {currency}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text className="text-base text-foreground">{t("settings.notifications")}</Text>
              <Text className="text-xs text-muted">{t("settings.notificationsHint")}</Text>
            </View>
            <Switch
              value={user.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </Section>

        <Button label={t("settings.logout")} variant="danger" fullWidth onPress={confirmLogout} />
        <Text className="text-center text-xs text-muted">
          {t("settings.version", { version: Constants.expoConfig?.version ?? "1.0.0" })}
        </Text>
      </ScrollView>
    </Screen>
  );
}
