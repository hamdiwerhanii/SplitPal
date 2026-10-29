import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export function Skeleton({ className = "" }: { className?: string }) {
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    opacity.set(withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    ));
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style} className={`rounded-2xl bg-surface-muted ${className}`} />;
}

export function SkeletonList({ rows = 5, withHero = false }: { rows?: number; withHero?: boolean }) {
  return (
    <View className="px-4 gap-3 pt-2" accessibilityRole="progressbar">
      {withHero ? <Skeleton className="h-28 mb-2 rounded-3xl" /> : null}
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} className="flex-row items-center gap-3 p-4 rounded-2xl bg-surface border border-border">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-3/5 rounded-md" />
            <Skeleton className="h-3 w-2/5 rounded-md" />
          </View>
        </View>
      ))}
    </View>
  );
}
