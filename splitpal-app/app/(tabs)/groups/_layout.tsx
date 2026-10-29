import { Stack } from "expo-router";
import { useThemeColors } from "@/constants/theme";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function GroupsLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="create" options={{ presentation: "modal" }} />
      <Stack.Screen name="join" options={{ presentation: "modal" }} />
      <Stack.Screen name="[groupId]/index" />
      <Stack.Screen name="[groupId]/add-expense" options={{ presentation: "modal" }} />
      <Stack.Screen name="[groupId]/expenses/[expenseId]/index" />
      <Stack.Screen name="[groupId]/expenses/[expenseId]/edit" options={{ presentation: "modal" }} />
      <Stack.Screen name="[groupId]/balances" />
      <Stack.Screen name="[groupId]/settle-up" />
      <Stack.Screen name="[groupId]/settings" />
    </Stack>
  );
}
