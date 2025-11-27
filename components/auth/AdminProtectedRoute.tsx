// src/components/auth/AdminProtectedRoute.tsx
"use client";

import { useAppSelector } from "../../store/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && (!currentUser || currentUser.role !== "ADMIN")) {
      router.push("/chat/rooms");
    }
  }, [currentUser, isInitialized, router]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "ADMIN") {
    return null;
  }

  return <>{children}</>;
}
