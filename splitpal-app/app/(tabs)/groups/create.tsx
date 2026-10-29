import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { isNetworkError } from "@/api/errors";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import Screen from "@/components/ui/Screen";
import { GroupFormValues, groupSchema } from "@/features/groups/schema/groupSchema";
import { useCreateGroup } from "@/hooks/useGroups";
import useAuthStore from "@/stores/authStore";
import type { CurrencyCode } from "@/types/common/CommonTypes";
import { SUPPORTED_CURRENCIES } from "@/constants/options";

export default function CreateGroupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const defaultCurrency = useAuthStore((state) => state.user?.defaultCurrency ?? "TND");
  const createGroup = useCreateGroup();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "", currency: defaultCurrency },
  });

  const onSubmit = (values: GroupFormValues) =>
    createGroup.mutate(
      { name: values.name.trim(), currency: values.currency as CurrencyCode },
      {
        onSuccess: (group) => {
          Toast.show({ type: "success", text1: t("createGroup.created") });
          router.replace({ pathname: "/groups/[groupId]", params: { groupId: group.id } });
        },
        onError: (error) =>
          Toast.show({
            type: "error",
            text1: isNetworkError(error) ? t("common.networkError") : t("common.somethingWrong"),
          }),
      },
    );

  return (
    <Screen title={t("createGroup.title")} showBack>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pb-8 gap-6">
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <FormInput
              testID="group-name-input"
              label={t("createGroup.nameLabel")}
              icon="people-outline"
              placeholder={t("createGroup.namePlaceholder")}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              maxLength={60}
              autoFocus
              error={errors.name?.message ? t(errors.name.message) : undefined}
            />
          )}
        />
        <View className="gap-2">
          <Text className="label">{t("createGroup.currencyLabel")}</Text>
          <Controller
            control={control}
            name="currency"
            render={({ field }) => (
              <View className="flex-row flex-wrap gap-2">
                {SUPPORTED_CURRENCIES.map((currency) => {
                  const selected = field.value === currency;
                  return (
                    <Pressable
                      key={currency}
                      onPress={() => field.onChange(currency)}
                      accessibilityState={{ selected }}
                      className={`px-4 py-2 rounded-full border ${
                        selected ? "bg-primary-soft border-primary" : "bg-surface border-border"
                      }`}
                    >
                      <Text
                        className={`font-semibold ${selected ? "text-positive" : "text-foreground"}`}
                      >
                        {currency}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />
        </View>
        <Button
          testID="submit-group"
          label={t("createGroup.submit")}
          size="lg"
          fullWidth
          loading={createGroup.isPending}
          onPress={handleSubmit(onSubmit)}
        />
      </ScrollView>
    </Screen>
  );
}
