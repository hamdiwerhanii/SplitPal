import { useColorScheme } from "nativewind";

export const palette = {
  light: {
    background: "#F6F7F9",
    surface: "#FFFFFF",
    border: "#E2E8F0",
    foreground: "#0F172A",
    muted: "#64748B",
    primary: "#10B981",
    onPrimary: "#FFFFFF",
    positive: "#059669",
    negative: "#DC2626",
  },
  dark: {
    background: "#0B1220",
    surface: "#131C2E",
    border: "#27344D",
    foreground: "#F1F5F9",
    muted: "#94A3B8",
    primary: "#34D399",
    onPrimary: "#052E21",
    positive: "#34D399",
    negative: "#F87171",
  },
} as const;

export type ThemeColors = (typeof palette)["light"] | (typeof palette)["dark"];

export const useThemeColors = (): ThemeColors => {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? palette.dark : palette.light;
};

export const AVATAR_COLORS = [
  "#F97316",
  "#8B5CF6",
  "#0EA5E9",
  "#EC4899",
  "#14B8A6",
  "#EAB308",
  "#6366F1",
  "#EF4444",
];
