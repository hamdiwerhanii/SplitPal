import { zodResolver } from "@hookform/resolvers/zod";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { getApiErrorStatus, isNetworkError } from "@/api/errors";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import Screen from "@/components/ui/Screen";
import { useThemeColors } from "@/constants/theme";
import { JoinFormValues, joinSchema } from "@/features/groups/schema/groupSchema";
import { useInvitePreview, useJoinGroup } from "@/hooks/useGroups";
import { extractInviteCode } from "@/utils/helper";

export default function JoinGroupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [lookupCode, setLookupCode] = useState<string | null>(
    code ? extractInviteCode(code) : null,
  );

  const preview = useInvitePreview(lookupCode);
  const join = useJoinGroup();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { inviteCode: code ? extractInviteCode(code) : "" },
  });

  const openGroup = (groupId: string) =>
    router.replace({ pathname: "/groups/[groupId]", params: { groupId } });

  const onJoin = () => {
    if (!lookupCode) return;
    join.mutate(lookupCode, {
      onSuccess: (group) => {
        Toast.show({ type: "success", text1: t("join.joined", { name: group.name }) });
        openGroup(group.id);
      },
      onError: (error) =>
        Toast.show({
          type: "error",
          text1: isNetworkError(error) ? t("common.networkError") : t("join.invalid"),
        }),
    });
  };

  const notFound = preview.isError && getApiErrorStatus(preview.error) === 404;

  return (
    <Screen title={t("join.title")} showBack>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pb-8 gap-5">
        <Controller
          control={control}
          name="inviteCode"
          render={({ field }) => (
            <FormInput
              testID="invite-code-input"
              label={t("join.codeLabel")}
              icon="key-outline"
              placeholder={t("join.codePlaceholder")}
              value={field.value}
              onChangeText={(text) => {
                field.onChange(extractInviteCode(text));
                setLookupCode(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={60}
              error={
                errors.inviteCode?.message
                  ? t(errors.inviteCode.message)
                  : notFound
                    ? t("join.invalid")
                    : undefined
              }
            />
          )}
        />

        {!lookupCode ? (
          <Button
            testID="lookup-invite"
            label={t("join.lookup")}
            fullWidth
            onPress={handleSubmit((values) => setLookupCode(values.inviteCode))}
          />
        ) : preview.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : preview.data ? (
          <View className="items-center gap-3 p-6 rounded-3xl bg-surface border border-border">
            <Text className="text-sm text-muted">{t("join.aboutToJoin")}</Text>
            <Avatar id={preview.data.id} name={preview.data.name} size={64} />
            <Text className="text-xl font-bold text-foreground">{preview.data.name}</Text>
            <Text className="text-sm text-muted">
              {t("groups.members", { count: preview.data.memberCount })} · {preview.data.currency}
            </Text>
            {preview.data.isMember ? (
              <>
                <Text className="text-sm text-muted">{t("join.alreadyMember")}</Text>
                <Button
                  label={t("join.open")}
                  fullWidth
                  onPress={() => openGroup(preview.data.id)}
                />
              </>
            ) : (
              <Button
                testID="confirm-join"
                label={t("join.submit")}
                fullWidth
                loading={join.isPending}
                onPress={onJoin}
              />
            )}
          </View>
        ) : preview.isError && !notFound ? (
          <Button label={t("common.retry")} variant="outline" fullWidth onPress={() => void preview.refetch()} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
