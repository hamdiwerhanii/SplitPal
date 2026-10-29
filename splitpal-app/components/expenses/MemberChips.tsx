import { Pressable, ScrollView, Text } from "react-native";
import Avatar from "@/components/ui/Avatar";

type Member = { id: string; name: string };

type MemberChipsProps = {
  members: Member[];
  value: string;
  onChange: (id: string) => void;
  currentUserId: string;
  youLabel: string;
};

export default function MemberChips({
  members,
  value,
  onChange,
  currentUserId,
  youLabel,
}: MemberChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {members.map((member) => {
        const selected = member.id === value;
        return (
          <Pressable
            key={member.id}
            onPress={() => onChange(member.id)}
            accessibilityState={{ selected }}
            className={`flex-row items-center gap-2 ps-1 pe-3 py-1 rounded-full border ${
              selected ? "bg-primary-soft border-primary" : "bg-surface border-border"
            }`}
          >
            <Avatar id={member.id} name={member.name} size={26} />
            <Text className={`text-sm font-medium ${selected ? "text-positive" : "text-foreground"}`}>
              {member.id === currentUserId ? youLabel : member.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
