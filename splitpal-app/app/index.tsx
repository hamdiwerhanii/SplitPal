import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/ui/Button";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center gap-6">
        <View className="w-20 h-20 rounded-3xl bg-primary items-center justify-center">
          <Text className="text-4xl">💸</Text>
        </View>
        <View className="self-start rounded-full px-3 py-1.5 bg-primary-soft">
          <Text className="text-sm font-semibold text-positive">{t("welcome.badge")}</Text>
        </View>
        <Text className="text-4xl font-extrabold leading-[44px] text-foreground">
          {t("welcome.title")}
        </Text>
        <Text className="p leading-6">{t("welcome.subtitle")}</Text>
      </View>
      <View className="px-6 pb-6">
        <Button
          testID="get-started"
          label={t("welcome.getStarted")}
          size="lg"
          fullWidth
          onPress={() => router.push("/login")}
        />
      </View>
    </SafeAreaView>
  );
}
