import Ionicons from "@expo/vector-icons/Ionicons";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Text, View } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { useThemeColors } from "@/constants/theme";
import Button from "./Button";

export function LoadingState() {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

type EmptyStateProps = {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function EmptyState({ emoji, title, subtitle, action }: EmptyStateProps) {
  return (
    <Animated.View entering={FadeIn.duration(400)} className="items-center justify-center px-8 py-16 gap-3">
      <Animated.View
        entering={ZoomIn.delay(120).springify().damping(12)}
        className="w-24 h-24 rounded-full bg-primary-soft items-center justify-center mb-2"
      >
        <Text className="text-5xl">{emoji}</Text>
      </Animated.View>
      <Text className="text-xl font-bold text-foreground text-center">{title}</Text>
      {subtitle ? <Text className="p text-center">{subtitle}</Text> : null}
      {action ? <View className="mt-3 w-full">{action}</View> : null}
    </Animated.View>
  );
}

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View className="items-center justify-center px-8 py-16 gap-3">
      <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
      <Text className="text-lg font-bold text-foreground text-center">
        {t("common.somethingWrong")}
      </Text>
      <Text className="p text-center">{message ?? t("common.loadFailed")}</Text>
      {onRetry ? (
        <Button label={t("common.retry")} variant="outline" onPress={onRetry} className="mt-2 self-center" />
      ) : null}
    </View>
  );
}
