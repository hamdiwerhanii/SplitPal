import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentRef, Ref } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import { useThemeColors } from "@/constants/theme";

type FormInputProps = TextInputProps & {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  suffix?: string;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export default function FormInput({
  label,
  icon,
  error,
  suffix,
  ref,
  ...props
}: FormInputProps) {
  const colors = useThemeColors();
  const hasError = Boolean(error);

  return (
    <View>
      {label ? <Text className="label mb-2">{label}</Text> : null}
      <View
        className={`flex-row items-center rounded-xl px-3 h-12 border bg-surface ${
          hasError ? "border-negative" : "border-border"
        }`}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={20}
            color={hasError ? colors.negative : colors.muted}
          />
        ) : null}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.muted}
          className="flex-1 h-12 mx-2 text-base text-foreground"
          {...props}
        />
        {suffix ? <Text className="text-muted font-medium">{suffix}</Text> : null}
      </View>
      {hasError ? (
        <Text className="text-negative text-sm mt-1.5">{error}</Text>
      ) : null}
    </View>
  );
}
