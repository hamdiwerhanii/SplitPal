import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";
import { useThemeColors } from "@/constants/theme";

type IconButtonProps = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  tone?: "default" | "primary" | "danger";
};

export default function IconButton({
  icon,
  onPress,
  label,
  tone = "default",
}: IconButtonProps) {
  const colors = useThemeColors();
  const color =
    tone === "primary" ? colors.primary : tone === "danger" ? colors.negative : colors.foreground;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-10 h-10 rounded-full items-center justify-center bg-surface border border-border active:opacity-70"
    >
      <Ionicons name={icon} size={20} color={color} />
    </Pressable>
  );
}
