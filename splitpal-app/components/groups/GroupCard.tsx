import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { I18nManager, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Avatar from "@/components/ui/Avatar";
import PressableScale from "@/components/ui/PressableScale";
import { useThemeColors } from "@/constants/theme";
import { useMoney } from "@/hooks/useMoney";
import type { GroupSummary } from "@/types/groups/GroupTypes";

type GroupCardProps = {
  group: GroupSummary;
  index?: number;
};

export default function GroupCard({ group, index = 0 }: GroupCardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const format = useMoney();
  const colors = useThemeColors();

  const balanceLabel =
    group.myBalance > 0
      ? t("groups.youAreOwed")
      : group.myBalance < 0
        ? t("groups.youOwe")
        : t("groups.settled");
  const tone =
    group.myBalance > 0 ? "text-positive" : group.myBalance < 0 ? "text-negative" : "text-muted";
  const chip =
    group.myBalance > 0
      ? "bg-primary-soft"
      : group.myBalance < 0
        ? "bg-negative/10"
        : "bg-surface-muted";

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 60).duration(420).springify().damping(18)}>
      <PressableScale
        testID={`group-card-${group.name}`}
        haptic
        onPress={() =>
          router.push({ pathname: "/groups/[groupId]", params: { groupId: group.id } })
        }
        className="flex-row items-center gap-3 p-4 rounded-3xl bg-surface border border-border"
        style={{ boxShadow: "0 6px 20px -12px rgba(15, 23, 42, 0.18)" }}
      >
        <Avatar id={group.id} name={group.name} size={50} />
        <View className="flex-1 gap-1">
          <Text numberOfLines={1} className="text-base font-bold text-foreground">
            {group.name}
          </Text>
          <Text className="text-xs text-muted">
            {t("groups.members", { count: group.memberCount })} · {group.currency}
          </Text>
        </View>
        <View className={`items-end rounded-2xl px-3 py-1.5 ${chip}`}>
          <Text className={`text-[11px] font-medium ${tone}`}>{balanceLabel}</Text>
          {group.myBalance !== 0 ? (
            <Text className={`text-sm font-extrabold ${tone}`}>
              {format(Math.abs(group.myBalance), group.currency)}
            </Text>
          ) : null}
        </View>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.muted}
          style={{ transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }] }}
        />
      </PressableScale>
    </Animated.View>
  );
}
