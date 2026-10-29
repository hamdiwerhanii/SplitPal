import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import type { ToastConfig, ToastConfigParams } from "react-native-toast-message";

const ToastCard = ({
  text1,
  text2,
  icon,
  color,
}: ToastConfigParams<unknown> & {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) => (
  <View className="w-[92%] flex-row items-center gap-3 rounded-2xl px-4 py-3 bg-surface border border-border shadow-lg">
    <Ionicons name={icon} size={22} color={color} />
    <View className="flex-1">
      <Text className="text-foreground font-semibold" numberOfLines={2}>
        {text1}
      </Text>
      {text2 ? (
        <Text className="text-muted text-sm mt-0.5" numberOfLines={2}>
          {text2}
        </Text>
      ) : null}
    </View>
  </View>
);

export const toastConfig: ToastConfig = {
  success: (props) => <ToastCard {...props} icon="checkmark-circle" color="#10B981" />,
  error: (props) => <ToastCard {...props} icon="alert-circle" color="#EF4444" />,
  info: (props) => <ToastCard {...props} icon="cloud-upload-outline" color="#0EA5E9" />,
};
