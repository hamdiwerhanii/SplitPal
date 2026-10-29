import type {
  CreateGroupRequest,
  GroupDetail,
  GroupSummary,
  InvitePreview,
} from "@/types/groups/GroupTypes";
import API from "./client";

export const getGroups = async (): Promise<GroupSummary[]> => {
  const { data } = await API.get<GroupSummary[]>("/groups");
  return data;
};

export const getGroup = async (groupId: string): Promise<GroupDetail> => {
  const { data } = await API.get<GroupDetail>(`/groups/${groupId}`);
  return data;
};

export const createGroup = async (
  body: CreateGroupRequest,
): Promise<GroupDetail> => {
  const { data } = await API.post<GroupDetail>("/groups", body);
  return data;
};

export const renameGroup = async (
  groupId: string,
  name: string,
): Promise<GroupDetail> => {
  const { data } = await API.patch<GroupDetail>(`/groups/${groupId}`, { name });
  return data;
};

export const previewInvite = async (
  inviteCode: string,
): Promise<InvitePreview> => {
  const { data } = await API.get<InvitePreview>(
    `/groups/invites/${encodeURIComponent(inviteCode)}`,
  );
  return data;
};

export const joinGroup = async (inviteCode: string): Promise<GroupDetail> => {
  const { data } = await API.post<GroupDetail>("/groups/join", { inviteCode });
  return data;
};

export const leaveGroup = async (groupId: string): Promise<void> => {
  await API.post(`/groups/${groupId}/leave`);
};

export const regenerateInvite = async (
  groupId: string,
): Promise<Pick<GroupDetail, "inviteCode" | "inviteUrl">> => {
  const { data } = await API.post<Pick<GroupDetail, "inviteCode" | "inviteUrl">>(
    `/groups/${groupId}/invite/regenerate`,
  );
  return data;
};
