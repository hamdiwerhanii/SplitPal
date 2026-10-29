import type { CurrencyCode } from "@/types/common/CommonTypes";
export type ActivityType =
  | "group.created"
  | "group.renamed"
  | "member.joined"
  | "member.left"
  | "expense.created"
  | "expense.updated"
  | "expense.deleted"
  | "settlement.created";

export type Activity = {
  id: string;
  type: ActivityType;
  createdAt: string;
  actor: { id: string; name: string } | null;
  group: { id: string; name: string; currency: CurrencyCode } | null;
  data: {
    description?: string;
    amount?: number;
    groupName?: string;
    targetUser?: { id: string; name: string } | null;
    expense?: string;
  };
};
