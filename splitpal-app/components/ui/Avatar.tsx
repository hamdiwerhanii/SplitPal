import { Text, View } from "react-native";
import { AVATAR_COLORS } from "@/constants/theme";
import { colorIndexFor, initialsOf } from "@/utils/helper";

type AvatarProps = {
  id: string;
  name: string;
  size?: number;
};

export default function Avatar({ id, name, size = 40 }: AvatarProps) {
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: AVATAR_COLORS[colorIndexFor(id, AVATAR_COLORS.length)],
      }}
    >
      <Text className="font-bold text-white" style={{ fontSize: size * 0.38 }}>
        {initialsOf(name)}
      </Text>
    </View>
  );
}
