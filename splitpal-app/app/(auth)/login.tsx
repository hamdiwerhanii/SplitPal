import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { requestOtp } from "@/api/auth";
import { getApiErrorStatus, isNetworkError } from "@/api/errors";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import Screen from "@/components/ui/Screen";
import { EmailFormValues, emailSchema } from "@/features/auth/schema/emailSchema";
import useSettingsStore from "@/stores/settingsStore";

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const language = useSettingsStore((state) => state.language);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const send = useMutation({
    mutationFn: ({ email }: EmailFormValues) => requestOtp(email, language),
    onSuccess: (result, { email }) => {
      router.push({
        pathname: "/verify",
        params: { email: email.trim().toLowerCase(), resendAfter: String(result.resendAfterSeconds) },
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: isNetworkError(error)
          ? t("common.networkError")
          : getApiErrorStatus(error) === 429
            ? t("auth.tooManyRequests")
            : t("common.somethingWrong"),
      });
    },
  });

  return (
    <Screen edges={["top"]} showBack>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow px-6 pt-4 pb-6 gap-6"
        >
          <View className="gap-2">
            <Text className="h1">{t("auth.emailTitle")}</Text>
            <Text className="p">{t("auth.emailSubtitle")}</Text>
          </View>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <FormInput
                testID="email-input"
                label={t("auth.emailLabel")}
                icon="mail-outline"
                placeholder={t("auth.emailPlaceholder")}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                autoFocus
                returnKeyType="send"
                onSubmitEditing={() => void handleSubmit((values) => send.mutate(values))()}
                error={errors.email?.message ? t(errors.email.message) : undefined}
              />
            )}
          />
          <View className="flex-1" />
          <Button
            testID="send-code"
            label={t("auth.sendCode")}
            size="lg"
            fullWidth
            loading={send.isPending}
            onPress={handleSubmit((values) => send.mutate(values))}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
