import { ReactNode, useEffect, useRef } from "react";
import useAuthStore from "@/stores/authStore";

export function AuthProvider({ children }: { children: ReactNode }) {
  const hasValidated = useRef(false);

  useEffect(() => {
    if (hasValidated.current) return;
    hasValidated.current = true;

    useAuthStore
      .getState()
      .validateSession()
      .catch((error: unknown) => {
        console.warn(
          "[AuthContext] Session validation failed:",
          error instanceof Error ? error.message : String(error),
        );
      });
  }, []);

  return <>{children}</>;
}
