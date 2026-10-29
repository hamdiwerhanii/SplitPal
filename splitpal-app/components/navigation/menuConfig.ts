import type Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

export type MenuItem = {
  key: string;
  href: "/groups" | "/activity" | "/settings";
  labelKey: string;
  icon: ComponentProps<typeof Ionicons>["name"];
};

export type MenuSection = {
  titleKey?: string;
  items: MenuItem[];
};

export const menuSections: MenuSection[] = [
  {
    items: [
      { key: "groups", href: "/groups", labelKey: "tabs.groups", icon: "people-outline" },
      { key: "activity", href: "/activity", labelKey: "tabs.activity", icon: "time-outline" },
    ],
  },
  {
    titleKey: "settings.preferences",
    items: [
      { key: "settings", href: "/settings", labelKey: "tabs.settings", icon: "settings-outline" },
    ],
  },
];
