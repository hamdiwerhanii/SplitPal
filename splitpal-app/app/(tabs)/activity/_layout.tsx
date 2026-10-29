import { Stack } from "expo-router";
import { useThemeColors } from "@/constants/theme";

export default function ActivityLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
