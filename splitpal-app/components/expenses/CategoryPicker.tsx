import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text } from "react-native";
import { CATEGORY_EMOJI } from "@/features/expenses/config/categories";
import { ExpenseCategory } from "@/types/expenses/ExpenseTypes";
import { EXPENSE_CATEGORIES } from "@/constants/options";

type CategoryPickerProps = {
  value: ExpenseCategory;
  onChange: (value: ExpenseCategory) => void;
};

export default function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { t } = useTranslation();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {EXPENSE_CATEGORIES.map((category) => {
        const selected = category === value;
        return (
          <Pressable
            key={category}
            onPress={() => onChange(category)}
            accessibilityState={{ selected }}
            className={`flex-row items-center gap-1.5 px-3 py-2 rounded-full border ${
              selected ? "bg-primary-soft border-primary" : "bg-surface border-border"
            }`}
          >
            <Text>{CATEGORY_EMOJI[category]}</Text>
            <Text
              className={`text-sm font-medium ${selected ? "text-positive" : "text-foreground"}`}
            >
              {t(`categories.${category}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
