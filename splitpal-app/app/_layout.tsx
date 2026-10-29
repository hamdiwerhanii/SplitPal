import "@/global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { setSessionExpiredHandler } from "@/api/client";
import { AuthProvider } from "@/components/context/AuthContext";
import { toastConfig } from "@/components/ui/toastConfig";
import { useThemeColors } from "@/constants/theme";
import { applyLayoutDirection, initI18n } from "@/i18n";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import useAuthStore from "@/stores/authStore";
import useSettingsStore from "@/stores/settingsStore";

void SplashScreen.preventAutoHideAsync();

setSessionExpiredHandler(() => useAuthStore.getState().clearSession());

function RootNavigator() {
  const colors = useThemeColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const profileCompleted = useAuthStore((state) => !!state.user?.profileCompleted);
  const isReady = isAuthenticated && profileCompleted;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={isAuthenticated && !profileCompleted}>
        <Stack.Screen name="complete-profile" />
      </Stack.Protected>
      <Stack.Protected guard={isReady}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Screen name="join/[code]" />
    </Stack>
  );
}

export default function RootLayout() {
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);
  const language = useSettingsStore((state) => state.language);
  const theme = useSettingsStore((state) => state.theme);
  const { colorScheme, setColorScheme } = useColorScheme();
  const hydrated = authHydrated && settingsHydrated;

  if (hydrated) {
    initI18n(language);
  }

  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  useEffect(() => {
    if (!hydrated) return;
    applyLayoutDirection(language);
    void SplashScreen.hideAsync();
  }, [hydrated, language]);

  if (!hydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReactQueryProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
          <Toast config={toastConfig} topOffset={56} visibilityTime={2500} />
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
        </ReactQueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
