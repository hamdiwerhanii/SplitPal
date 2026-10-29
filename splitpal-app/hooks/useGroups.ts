import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createGroup,
  getGroup,
  getGroups,
  joinGroup,
  leaveGroup,
  previewInvite,
  regenerateInvite,
  renameGroup,
} from "@/api/groupOperations";
import { invalidateGroupData } from "@/libs/invalidate";
import { queryKeys } from "@/libs/queryKeys";
import type { CreateGroupRequest } from "@/types/groups/GroupTypes";

export const useGroups = () =>
  useQuery({ queryKey: queryKeys.groups.list(), queryFn: getGroups });

export const useGroup = (groupId: string) =>
  useQuery({
    queryKey: queryKeys.groups.detail(groupId),
    queryFn: () => getGroup(groupId),
    enabled: !!groupId,
  });

export const useInvitePreview = (inviteCode: string | null) =>
  useQuery({
    queryKey: queryKeys.groups.invite(inviteCode ?? ""),
    queryFn: () => previewInvite(inviteCode!),
    enabled: !!inviteCode,
    retry: false,
    gcTime: 0,
  });

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGroupRequest) => createGroup(body),
    onSuccess: (group) => {
      queryClient.setQueryData(queryKeys.groups.detail(group.id), group);
      void invalidateGroupData(queryClient);
    },
  });
};

export const useJoinGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inviteCode: string) => joinGroup(inviteCode),
    onSuccess: (group) => {
      queryClient.setQueryData(queryKeys.groups.detail(group.id), group);
      void invalidateGroupData(queryClient, group.id);
    },
  });
};

export const useRenameGroup = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => renameGroup(groupId, name),
    onSuccess: (group) => {
      queryClient.setQueryData(queryKeys.groups.detail(groupId), group);
      void invalidateGroupData(queryClient);
    },
  });
};

export const useRegenerateInvite = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => regenerateInvite(groupId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) }),
  });
};

export const useLeaveGroup = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => leaveGroup(groupId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.groups.detail(groupId) });
      void invalidateGroupData(queryClient);
    },
  });
};
