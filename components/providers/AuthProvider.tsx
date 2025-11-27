// frontend/src/components/providers/AuthProvider.tsx
"use client";

import { useEffect, ReactNode } from "react";
import { useAppSelector, useAppDispatch } from "../../store/store";
import { useMeQuery } from "../../services/authApi";
import { setCurrentUser, clearAuth, setInitialized } from "../../store/slices/authSlice";

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider initializes authentication state on app load
 * - Checks for stored token
 * - Validates token by fetching current user
 * - Handles token expiration gracefully
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const isInitialized = useAppSelector((state) => state.auth.isInitialized);

  // Only fetch user if we have a token but no user data
  const shouldFetchUser = !!accessToken && !currentUser && !isInitialized;

  // Use RTK Query to fetch current user
  const { 
    data: userData, 
    error, 
    isLoading,
    isSuccess,
    isError,
  } = useMeQuery(undefined, {
    skip: !shouldFetchUser, // Skip query if no token or user already loaded
  });

  // Handle authentication initialization
  useEffect(() => {
    if (!accessToken) {
      // No token found - user is not authenticated
      dispatch(setInitialized());
      return;
    }

    if (isSuccess && userData) {
      // Successfully fetched user data
      dispatch(setCurrentUser(userData));
    }

    if (isError && error) {
      // Token is invalid or expired
      console.error("Token validation failed:", error);
      dispatch(clearAuth());
    }

    // If user already exists, mark as initialized
    if (currentUser) {
      dispatch(setInitialized());
    }
  }, [accessToken, userData, error, isSuccess, isError, currentUser, dispatch]);

  // Show loading screen while initializing auth
  if (!isInitialized || (shouldFetchUser && isLoading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
