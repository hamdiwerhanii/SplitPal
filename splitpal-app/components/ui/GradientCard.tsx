import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

const GRADIENTS = {
  primary: ["#10B981", "#0D9488", "#0F766E"],
  negative: ["#F97316", "#E11D48", "#BE123C"],
  neutral: ["#334155", "#1E293B", "#0F172A"],
} as const;

type GradientCardProps = {
  tone?: keyof typeof GRADIENTS;
  children: ReactNode;
  className?: string;
};

export default function GradientCard({
  tone = "primary",
  children,
  className = "",
}: GradientCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(450).springify().damping(18)}
      className={`rounded-3xl overflow-hidden ${className}`}
      style={{ boxShadow: "0 12px 28px -12px rgba(13, 148, 136, 0.45)" }}
    >
      <LinearGradient
        colors={GRADIENTS[tone]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 20 }}
      >
        <View
          pointerEvents="none"
          className="absolute -top-12 -right-10 w-44 h-44 rounded-full bg-white/10"
        />
        <View
          pointerEvents="none"
          className="absolute -bottom-16 -left-8 w-40 h-40 rounded-full bg-white/5"
        />
        {children}
      </LinearGradient>
    </Animated.View>
  );
}
