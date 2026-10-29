import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { isNetworkError } from "@/api/errors";
import { updateMe } from "@/api/userOperations";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import Screen from "@/components/ui/Screen";
import { ProfileFormValues, profileSchema } from "@/features/auth/schema/profileSchema";
import useAuthStore from "@/stores/authStore";
import useSettingsStore from "@/stores/settingsStore";

export default function CompleteProfileScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const language = useSettingsStore((state) => state.language);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const save = useMutation({
    mutationFn: ({ name }: ProfileFormValues) => updateMe({ name: name.trim(), locale: language }),
    onSuccess: setUser,
    onError: (error) =>
      Toast.show({
        type: "error",
        text1: isNetworkError(error) ? t("common.networkError") : t("common.somethingWrong"),
      }),
  });

  return (
    <Screen edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="flex-1 px-6 pt-10 pb-6 gap-6">
          <Text className="text-5xl">👋</Text>
          <View className="gap-2">
            <Text className="h1">{t("auth.profileTitle")}</Text>
            <Text className="p">{t("auth.profileSubtitle")}</Text>
          </View>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <FormInput
                testID="name-input"
                label={t("auth.nameLabel")}
                icon="person-outline"
                placeholder={t("auth.namePlaceholder")}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                autoFocus
                autoCapitalize="words"
                maxLength={60}
                error={errors.name?.message ? t(errors.name.message) : undefined}
              />
            )}
          />
          <View className="flex-1" />
          <Button
            testID="finish-profile"
            label={t("auth.finish")}
            size="lg"
            fullWidth
            loading={save.isPending}
            onPress={handleSubmit((values) => save.mutate(values))}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
