"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppSelector } from "../../store/store";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
