import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { requestOtp, verifyOtp } from "@/api/auth";
import { getApiErrorStatus, isNetworkError } from "@/api/errors";
import Button from "@/components/ui/Button";
import OtpInput from "@/components/ui/OtpInput";
import Screen from "@/components/ui/Screen";
import useAuthStore from "@/stores/authStore";
import useSettingsStore from "@/stores/settingsStore";
import { isCompleteOtp } from "@/utils/helper";

export default function VerifyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { email = "", resendAfter = "60" } = useLocalSearchParams<{
    email?: string;
    resendAfter?: string;
  }>();
  const language = useSettingsStore((state) => state.language);
  const setSession = useAuthStore((state) => state.setSession);

  const [code, setCode] = useState("");
  const [hasError, setHasError] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(Number(resendAfter) || 60);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const verify = useMutation({
    mutationFn: (value: string) => verifyOtp(email, value, language),
    onSuccess: ({ user }) => setSession(user),
    onError: (error) => {
      setHasError(true);
      setCode("");
      Toast.show({
        type: "error",
        text1: isNetworkError(error)
          ? t("common.networkError")
          : getApiErrorStatus(error) === 429
            ? t("auth.tooManyRequests")
            : t("auth.invalidCode"),
      });
    },
  });

  const resend = useMutation({
    mutationFn: () => requestOtp(email, language),
    onSuccess: (result) => {
      setSecondsLeft(result.resendAfterSeconds);
      Toast.show({ type: "success", text1: t("auth.codeSent") });
    },
    onError: () => Toast.show({ type: "error", text1: t("common.somethingWrong") }),
  });

  const onChange = (value: string) => {
    setHasError(false);
    setCode(value);
    if (isCompleteOtp(value) && !verify.isPending) {
      verify.mutate(value);
    }
  };

  return (
    <Screen edges={["top"]} showBack>
      <View className="flex-1 px-6 pt-4 pb-6 gap-6">
        <View className="gap-2">
          <Text className="h1">{t("auth.codeTitle")}</Text>
          <Text className="p">{t("auth.codeSubtitle", { email })}</Text>
        </View>

        <OtpInput value={code} onChange={onChange} hasError={hasError} />

        <View className="flex-row justify-between">
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text className="text-sm font-semibold text-muted">{t("auth.changeEmail")}</Text>
          </Pressable>
          <Pressable
            disabled={secondsLeft > 0 || resend.isPending}
            onPress={() => resend.mutate()}
            hitSlop={8}
          >
            <Text
              className={`text-sm font-semibold ${secondsLeft > 0 ? "text-muted" : "text-primary"}`}
            >
              {secondsLeft > 0
                ? t("auth.resendIn", { seconds: secondsLeft })
                : t("auth.resend")}
            </Text>
          </Pressable>
        </View>

        <View className="flex-1" />
        <Button
          testID="verify-code"
          label={t("auth.verify")}
          size="lg"
          fullWidth
          disabled={!isCompleteOtp(code)}
          loading={verify.isPending}
          onPress={() => verify.mutate(code)}
        />
      </View>
    </Screen>
  );
}
