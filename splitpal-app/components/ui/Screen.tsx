import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { I18nManager, Pressable, Text, View } from "react-native";
import { Edge, SafeAreaView } from "react-native-safe-area-context";
import { useThemeColors } from "@/constants/theme";

type ScreenProps = {
  title?: string;
  showBack?: boolean;
  right?: ReactNode;
  edges?: Edge[];
  children: ReactNode;
};

export default function Screen({
  title,
  showBack = false,
  right,
  edges = [],
  children,
}: ScreenProps) {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background">
      {title || showBack || right ? (
        <View className="flex-row items-center px-4 h-14 gap-2">
          {showBack ? (
            <Pressable
              onPress={() => (router.canGoBack() ? router.back() : router.replace("/groups"))}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Back"
              className="w-10 h-10 rounded-full items-center justify-center active:bg-surface-muted"
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={colors.foreground}
                style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }}
              />
            </Pressable>
          ) : null}
          <Text
            numberOfLines={1}
            className={`flex-1 text-foreground font-bold ${showBack ? "text-lg" : "text-2xl"}`}
          >
            {title}
          </Text>
          {right}
        </View>
      ) : null}
      {children}
    </SafeAreaView>
  );
}
