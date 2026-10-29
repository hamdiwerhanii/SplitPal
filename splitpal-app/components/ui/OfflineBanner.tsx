import Ionicons from "@expo/vector-icons/Ionicons";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { useThemeColors } from "@/constants/theme";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

type OfflineBannerProps = {
  pendingCount: number;
  onSync: () => void;
};

export default function OfflineBanner({ pendingCount, onSync }: OfflineBannerProps) {
  const { t } = useTranslation();
  const { isOffline } = useNetworkStatus();
  const colors = useThemeColors();

  if (!isOffline && pendingCount === 0) {
    return null;
  }

  return (
    <View className="mx-4 mb-2 flex-row items-center gap-2 rounded-xl px-3 py-2 bg-surface border border-border">
      <Ionicons
        name={isOffline ? "cloud-offline-outline" : "sync-outline"}
        size={18}
        color={colors.muted}
      />
      <Text className="flex-1 text-sm text-muted">
        {isOffline ? t("common.offline") : t("common.pendingSync", { count: pendingCount })}
      </Text>
      {!isOffline && pendingCount > 0 ? (
        <Pressable onPress={onSync} hitSlop={8}>
          <Text className="text-sm font-semibold text-primary">{t("common.syncNow")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
