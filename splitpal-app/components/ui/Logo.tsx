import { Text, View } from "react-native";

export default function Logo({ size = 32 }: { size?: number }) {
  return (
    <View className="flex-row items-center gap-2">
      <View
        className="rounded-xl bg-primary items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Text style={{ fontSize: size * 0.5 }}>💸</Text>
      </View>
      <Text className="text-lg font-extrabold text-foreground">SplitPal</Text>
    </View>
  );
}
