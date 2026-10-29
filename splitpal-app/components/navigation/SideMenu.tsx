import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  I18nManager,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";
import { useThemeColors } from "@/constants/theme";
import useAuthStore from "@/stores/authStore";
import { menuSections, type MenuItem } from "./menuConfig";

const MENU_WIDTH = Dimensions.get("window").width * 0.8;
const ANIM_OPEN = 280;
const ANIM_CLOSE = 220;

type SideMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function SideMenu({ isOpen, onClose }: SideMenuProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const user = useAuthStore((state) => state.user);
  const [visible, setVisible] = useState(isOpen);
  if (isOpen && !visible) {
    setVisible(true);
  }

  const hiddenOffset = I18nManager.isRTL ? MENU_WIDTH : -MENU_WIDTH;
  const translateX = useSharedValue(hiddenOffset);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateX.set(withTiming(0, { duration: ANIM_OPEN, easing: Easing.out(Easing.cubic) }));
      overlayOpacity.set(withTiming(1, { duration: ANIM_OPEN }));
      return;
    }
    translateX.set(withTiming(hiddenOffset, { duration: ANIM_CLOSE, easing: Easing.in(Easing.cubic) }));
    overlayOpacity.set(withTiming(0, { duration: ANIM_CLOSE }));
    const timer = setTimeout(() => setVisible(false), ANIM_CLOSE);
    return () => clearTimeout(timer);
  }, [isOpen, hiddenOffset, translateX, overlayOpacity]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  if (!visible) return null;

  const isActive = (item: MenuItem) => pathname.startsWith(item.href);

  const navigate = (item: MenuItem) => {
    onClose();
    if (!isActive(item)) router.replace(item.href);
  };

  const confirmLogout = async () => {
    onClose();
    await useAuthStore.getState().logout();
  };

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      <Pressable
        className="absolute inset-0"
        onPress={onClose}
        accessibilityLabel={t("common.closeMenu")}
      >
        <Animated.View className="absolute inset-0 bg-black/40" style={overlayStyle} />
      </Pressable>

      <Animated.View
        className="absolute top-0 bottom-0 start-0 bg-surface px-3 border-e border-border"
        style={[{ width: MENU_WIDTH, paddingTop: insets.top + 12 }, panelStyle]}
      >
        <View className="px-3 pb-6">
          <Logo />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {menuSections.map((section, index) => (
            <View key={index} className="mb-4 gap-1">
              {section.titleKey ? (
                <Text className="label px-3 mb-1">{t(section.titleKey)}</Text>
              ) : null}
              {section.items.map((item) => {
                const active = isActive(item);
                return (
                  <Pressable
                    key={item.key}
                    testID={`menu-${item.key}`}
                    onPress={() => navigate(item)}
                    className={`flex-row items-center gap-3 px-3 py-3 rounded-xl ${
                      active ? "bg-primary-soft" : "active:bg-surface-muted"
                    }`}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={active ? colors.primary : colors.foreground}
                    />
                    <Text
                      className={`text-base ${active ? "font-semibold text-positive" : "text-foreground"}`}
                    >
                      {t(item.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>

        <View
          className="border-t border-border pt-4 gap-3"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {user ? (
            <View className="flex-row items-center gap-3 px-3">
              <Avatar id={user.id} name={user.name} size={36} />
              <View className="flex-1">
                <Text numberOfLines={1} className="text-base font-semibold text-foreground">
                  {user.name}
                </Text>
                <Text numberOfLines={1} className="text-xs text-muted">
                  {user.email}
                </Text>
              </View>
            </View>
          ) : null}
          <Pressable
            onPress={() => void confirmLogout()}
            className="flex-row items-center gap-3 px-3 py-3 rounded-xl active:bg-surface-muted"
          >
            <Ionicons name="log-out-outline" size={22} color={colors.negative} />
            <Text className="text-base text-negative">{t("settings.logout")}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
