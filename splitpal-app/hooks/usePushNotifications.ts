import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { registerPushToken } from "@/api/userOperations";
import useAuthStore from "@/stores/authStore";
import useSettingsStore from "@/stores/settingsStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getProjectId = (): string | undefined =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

export const getExpoPushToken = async (): Promise<string | null> => {
  const projectId = getProjectId();
  if (Platform.OS === "web" || !Device.isDevice || !projectId) {
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "SplitPal",
      importance: AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const granted =
    current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) {
    return null;
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
};

const groupIdFrom = (response: Notifications.NotificationResponse | null | undefined) => {
  const groupId = response?.notification.request.content.data?.groupId;
  return typeof groupId === "string" ? groupId : null;
};

export const usePushNotifications = () => {
  const router = useRouter();
  const ready = useAuthStore(
    (state) => state.isAuthenticated && !!state.user?.profileCompleted,
  );
  const notificationsEnabled = useAuthStore(
    (state) => state.user?.notificationsEnabled ?? true,
  );
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledResponse = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !notificationsEnabled) return;
    let cancelled = false;

    getExpoPushToken()
      .then(async (token) => {
        if (!token || cancelled) return;
        await registerPushToken(token);
        useSettingsStore.getState().setPushToken(token);
      })
      .catch((error: unknown) => {
        console.warn("[push] registration skipped", error);
      });

    return () => {
      cancelled = true;
    };
  }, [ready, notificationsEnabled]);

  useEffect(() => {
    if (!ready || !lastResponse) return;
    const id = lastResponse.notification.request.identifier;
    const groupId = groupIdFrom(lastResponse);
    if (groupId && handledResponse.current !== id) {
      handledResponse.current = id;
      router.push({ pathname: "/groups/[groupId]", params: { groupId } });
    }
  }, [ready, lastResponse, router]);
};
