import { ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import PressableScale from "./PressableScale";
import { useThemeColors } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  testID?: string;
};

const containerClass: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-primary-soft",
  outline: "border border-border bg-surface",
  ghost: "bg-transparent",
  danger: "bg-negative",
};

const labelClass: Record<ButtonVariant, string> = {
  primary: "text-white dark:text-[#052E21]",
  secondary: "text-positive",
  outline: "text-foreground",
  ghost: "text-primary",
  danger: "text-white",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-3 py-2 rounded-lg",
  md: "px-4 py-3 rounded-xl",
  lg: "px-5 py-4 rounded-2xl",
};

const textSize: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-base",
};

export default function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  leftIcon,
  fullWidth = false,
  className = "",
  testID,
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === "primary" ? colors.onPrimary : variant === "danger" ? "#FFFFFF" : colors.primary;

  return (
    <PressableScale
      testID={testID}
      disabled={isDisabled}
      haptic={variant === "primary"}
      onPress={isDisabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={variant === "primary" ? { boxShadow: "0 8px 20px -10px rgba(13, 148, 136, 0.6)" } : undefined}
      className={[
        "flex-row items-center justify-center gap-2",
        containerClass[variant],
        sizeClass[size],
        fullWidth ? "w-full" : "self-start",
        isDisabled ? "opacity-50" : "",
        className,
      ].join(" ")}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <Text
            numberOfLines={1}
            className={`font-semibold ${labelClass[variant]} ${textSize[size]}`}
          >
            {label}
          </Text>
        </>
      )}
    </PressableScale>
  );
}
