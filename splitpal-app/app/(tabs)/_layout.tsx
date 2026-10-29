import Ionicons from "@expo/vector-icons/Ionicons";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import SideMenu from "@/components/navigation/SideMenu";
import Logo from "@/components/ui/Logo";
import { useThemeColors } from "@/constants/theme";
import { useOutboxSync } from "@/hooks/useOutboxSync";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import useAuthStore from "@/stores/authStore";

export const unstable_settings = {
  initialRouteName: "groups",
};

export default function MainLayout() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const [menuOpen, setMenuOpen] = useState(false);
  const pendingInviteCode = useAuthStore((state) => state.pendingInviteCode);

  useOutboxSync();
  usePushNotifications();

  useEffect(() => {
    if (!pendingInviteCode) return;
    useAuthStore.getState().setPendingInviteCode(null);
    router.push({ pathname: "/groups/join", params: { code: pendingInviteCode } });
  }, [pendingInviteCode, router]);

  return (
    <View className="flex-1 bg-background">
      <Stack
        screenOptions={{
          header: () => (
            <SafeAreaView edges={["top"]} className="bg-background">
              <View className="flex-row items-center justify-between px-4 h-14">
                <Logo />
                <Pressable
                  testID="open-menu"
                  onPress={() => setMenuOpen(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.openMenu")}
                  className="w-10 h-10 rounded-xl items-center justify-center bg-surface border border-border"
                >
                  <Ionicons name="menu" size={22} color={colors.foreground} />
                </Pressable>
              </View>
            </SafeAreaView>
          ),
          contentStyle: { backgroundColor: colors.background },
          animation: "none",
        }}
      >
        <Stack.Screen name="groups" />
        <Stack.Screen name="activity" />
        <Stack.Screen name="settings" />
      </Stack>

      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
