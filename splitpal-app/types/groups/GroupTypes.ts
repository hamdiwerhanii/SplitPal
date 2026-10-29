import type { CurrencyCode } from "@/types/common/CommonTypes";
export type GroupSummary = {
  id: string;
  name: string;
  currency: CurrencyCode;
  memberCount: number;
  myBalance: number;
  lastActivityAt: string;
};

export type GroupMember = {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  active: boolean;
};

export type GroupDetail = Omit<GroupSummary, "myBalance"> & {
  inviteCode: string;
  inviteUrl: string;
  createdBy: string;
  createdAt: string;
  members: GroupMember[];
};

export type InvitePreview = {
  id: string;
  name: string;
  currency: CurrencyCode;
  memberCount: number;
  isMember: boolean;
};

export type CreateGroupRequest = {
  name: string;
  currency: CurrencyCode;
};
