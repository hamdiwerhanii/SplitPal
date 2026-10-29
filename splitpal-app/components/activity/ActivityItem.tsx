import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Avatar from "@/components/ui/Avatar";
import { useDateFormatter, useMoney } from "@/hooks/useMoney";
import type { Activity, ActivityType } from "@/types/activity/ActivityTypes";

const ACTIVITY_KEYS: Record<ActivityType, string> = {
  "group.created": "activity.groupCreated",
  "group.renamed": "activity.groupRenamed",
  "member.joined": "activity.memberJoined",
  "member.left": "activity.memberLeft",
  "expense.created": "activity.expenseCreated",
  "expense.updated": "activity.expenseUpdated",
  "expense.deleted": "activity.expenseDeleted",
  "settlement.created": "activity.settlementCreated",
};

type ActivityItemProps = {
  activity: Activity;
  currentUserId: string;
  index?: number;
};

export default function ActivityItem({ activity, currentUserId, index = 0 }: ActivityItemProps) {
  const { t } = useTranslation();
  const format = useMoney();
  const formatDate = useDateFormatter();

  const nameOf = (person?: { id: string; name: string } | null) =>
    person ? (person.id === currentUserId ? t("common.you") : person.name) : "?";
  const groupName = activity.group?.name ?? activity.data.groupName ?? "";
  const amount =
    activity.data.amount !== undefined && activity.group
      ? format(activity.data.amount, activity.group.currency)
      : null;

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 10) * 40).duration(380)}
      className="flex-row gap-3 px-4 py-3"
    >
      <Avatar id={activity.actor?.id ?? activity.id} name={activity.actor?.name ?? "?"} size={38} />
      <View className="flex-1">
        <Text className="text-[15px] leading-5 text-foreground">
          {t(ACTIVITY_KEYS[activity.type], {
            actor: nameOf(activity.actor),
            target: nameOf(activity.data.targetUser),
            group: groupName,
            description: activity.data.description ?? "",
          })}
        </Text>
        <View className="flex-row items-center gap-2 mt-0.5">
          {amount ? <Text className="text-sm font-semibold text-foreground">{amount}</Text> : null}
          <Text className="text-xs text-muted">{formatDate(activity.createdAt, true)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}
