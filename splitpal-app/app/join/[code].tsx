import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import useAuthStore from "@/stores/authStore";

export default function JoinLinkScreen() {
  const { code = "" } = useLocalSearchParams<{ code?: string }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const profileCompleted = useAuthStore((state) => !!state.user?.profileCompleted);
  const inviteCode = code.toUpperCase();

  useEffect(() => {
    if (!isAuthenticated || !profileCompleted) {
      useAuthStore.getState().setPendingInviteCode(inviteCode);
    }
  }, [isAuthenticated, profileCompleted, inviteCode]);

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }
  if (!profileCompleted) {
    return <Redirect href="/complete-profile" />;
  }
  return <Redirect href={{ pathname: "/groups/join", params: { code: inviteCode } }} />;
}
