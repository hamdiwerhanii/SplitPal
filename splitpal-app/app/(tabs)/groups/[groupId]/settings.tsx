import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { getApiErrorCode } from "@/api/errors";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import FormInput from "@/components/ui/FormInput";
import Screen from "@/components/ui/Screen";
import { ErrorState, LoadingState } from "@/components/ui/StateViews";
import {
  useGroup,
  useLeaveGroup,
  useRegenerateInvite,
  useRenameGroup,
} from "@/hooks/useGroups";
import useAuthStore from "@/stores/authStore";

export default function GroupSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const userId = useAuthStore((state) => state.user?.id ?? "");
  const group = useGroup(groupId);
  const rename = useRenameGroup(groupId);
  const regenerate = useRegenerateInvite(groupId);
  const leave = useLeaveGroup(groupId);
  const [name, setName] = useState<string | null>(null);

  if (group.isPending) {
    return (
      <Screen showBack>
        <LoadingState />
      </Screen>
    );
  }
  if (!group.data) {
    return (
      <Screen showBack>
        <ErrorState onRetry={() => void group.refetch()} />
      </Screen>
    );
  }

  const data = group.data;
  const currentName = name ?? data.name;
  const canRename = currentName.trim().length > 0 && currentName.trim() !== data.name;

  const copyCode = async () => {
    await Clipboard.setStringAsync(data.inviteCode);
    Toast.show({ type: "success", text1: t("group.inviteCopied") });
  };

  const confirmLeave = () =>
    Alert.alert(t("group.leave"), t("group.leaveConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("group.leave"),
        style: "destructive",
        onPress: () =>
          leave.mutate(undefined, {
            onSuccess: () => {
              Toast.show({ type: "success", text1: t("group.left") });
              router.dismissTo("/groups");
            },
            onError: (error) =>
              Toast.show({
                type: "error",
                text1:
                  getApiErrorCode(error) === "BALANCE_NOT_SETTLED"
                    ? t("group.leaveBlocked")
                    : t("common.somethingWrong"),
              }),
          }),
      },
    ]);

  return (
    <Screen title={t("group.manage")} showBack>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-4 pb-10 gap-6">
        <View className="gap-3">
          <FormInput
            label={t("group.rename")}
            value={currentName}
            onChangeText={setName}
            maxLength={60}
          />
          {canRename ? (
            <Button
              label={t("common.save")}
              size="sm"
              loading={rename.isPending}
              onPress={() =>
                rename.mutate(currentName.trim(), {
                  onSuccess: () => {
                    setName(null);
                    Toast.show({ type: "success", text1: t("group.renamed") });
                  },
                })
              }
            />
          ) : null}
        </View>

        <View className="gap-3 p-4 rounded-2xl bg-surface border border-border">
          <Text className="label">{t("join.codeLabel")}</Text>
          <Pressable onPress={() => void copyCode()} accessibilityRole="button">
            <Text
              selectable
              className="text-3xl font-extrabold tracking-[6px] text-foreground text-center"
              style={{ writingDirection: "ltr" }}
            >
              {data.inviteCode}
            </Text>
          </Pressable>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button label={t("common.copy")} variant="outline" fullWidth size="sm" onPress={() => void copyCode()} />
            </View>
            <View className="flex-1">
              <Button
                label={t("common.share")}
                variant="secondary"
                fullWidth
                size="sm"
                onPress={() =>
                  void Share.share({
                    message: t("group.inviteMessage", {
                      name: data.name,
                      url: data.inviteUrl,
                      code: data.inviteCode,
                    }),
                  })
                }
              />
            </View>
          </View>
          <Button
            label={t("group.newInvite")}
            variant="ghost"
            size="sm"
            fullWidth
            loading={regenerate.isPending}
            onPress={() =>
              regenerate.mutate(undefined, {
                onSuccess: ({ inviteCode }) =>
                  Toast.show({
                    type: "success",
                    text1: t("group.newInviteDone", { code: inviteCode }),
                  }),
              })
            }
          />
        </View>

        <View className="gap-2">
          <Text className="label">{t("group.members")}</Text>
          <View className="rounded-2xl bg-surface border border-border">
            {data.members.map((member, index) => (
              <View
                key={member.id}
                className={`flex-row items-center gap-3 px-4 py-3 ${index > 0 ? "border-t border-border" : ""} ${
                  member.active ? "" : "opacity-50"
                }`}
              >
                <Avatar id={member.id} name={member.name} size={36} />
                <View className="flex-1">
                  <Text className="text-base text-foreground">
                    {member.id === userId ? `${member.name} (${t("common.you")})` : member.name}
                  </Text>
                  <Text className="text-xs text-muted">{member.email}</Text>
                </View>
                {!member.active ? (
                  <Text className="text-xs text-muted">{t("group.memberLeft")}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <Button
          label={t("group.leave")}
          variant="danger"
          fullWidth
          loading={leave.isPending}
          onPress={confirmLeave}
        />
      </ScrollView>
    </Screen>
  );
}
