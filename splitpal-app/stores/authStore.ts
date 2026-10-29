import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { logout as apiLogout } from "@/api/auth";
import { getMe } from "@/api/userOperations";
import { getQueryClient } from "@/libs/queryClient";
import type { UserData } from "@/types/auth/AuthTypes";
import useOutboxStore from "./outboxStore";
import useSettingsStore from "./settingsStore";

type AuthState = {
  user: UserData | null;
  isAuthenticated: boolean;
  pendingInviteCode: string | null;
  hasHydrated: boolean;
  setSession: (user: UserData) => void;
  setUser: (user: UserData) => void;
  setPendingInviteCode: (code: string | null) => void;
  validateSession: () => Promise<void>;
  clearSession: () => void;
  logout: () => Promise<void>;
};

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      pendingInviteCode: null,
      hasHydrated: false,
      setSession: (user) => set({ user, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setPendingInviteCode: (pendingInviteCode) => set({ pendingInviteCode }),
      validateSession: async () => {
        if (!get().isAuthenticated) return;
        try {
          set({ user: await getMe() });
        } catch {
          return;
        }
      },
      clearSession: () => {
        getQueryClient().clear();
        useOutboxStore.getState().clear();
        set({ user: null, isAuthenticated: false });
      },
      logout: async () => {
        await apiLogout(useSettingsStore.getState().pushToken).catch(
          () => undefined,
        );
        get().clearSession();
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ user, isAuthenticated, pendingInviteCode }) => ({
        user,
        isAuthenticated,
        pendingInviteCode,
      }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hasHydrated: true });
      },
    },
  ),
);

export default useAuthStore;
