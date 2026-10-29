import { ComponentRef, useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { OTP_LENGTH } from "@/constants/options";
import { sanitizeOtpInput } from "@/utils/helper";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  hasError?: boolean;
  autoFocus?: boolean;
};

export default function OtpInput({
  value,
  onChange,
  hasError = false,
  autoFocus = true,
}: OtpInputProps) {
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");

  return (
    <Pressable onPress={() => inputRef.current?.focus()} accessibilityRole="none">
      <View className="flex-row justify-between" style={{ direction: "ltr" }}>
        {digits.map((digit, index) => {
          const isActive = index === Math.min(value.length, OTP_LENGTH - 1);
          return (
            <View
              key={index}
              className={`w-12 h-14 rounded-xl border-2 items-center justify-center bg-surface ${
                hasError
                  ? "border-negative"
                  : isActive
                    ? "border-primary"
                    : "border-border"
              }`}
            >
              <Text className="text-2xl font-bold text-foreground">{digit}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        testID="otp-input"
        value={value}
        onChangeText={(text) => onChange(sanitizeOtpInput(text))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        autoFocus={autoFocus}
        caretHidden
        className="absolute opacity-0 w-full h-full"
      />
    </Pressable>
  );
}
