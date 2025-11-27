import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  statusMessage?: string | null;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  currentUser: User | null;
  isInitialized: boolean;
  isOnline: boolean;
}

// Load token from localStorage on initialization
const loadTokenFromStorage = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("accessToken");
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  accessToken: loadTokenFromStorage(),
  currentUser: null,
  isInitialized: false,
  isOnline: false, // ADDED
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ accessToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      // Sync to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("accessToken", action.payload.accessToken);
        } catch (error) {
          console.error("Failed to save token to localStorage:", error);
        }
      }
    },
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload;
      state.isInitialized = true;
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => { // ADDED
      state.isOnline = action.payload;
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.currentUser = null;
      state.isInitialized = true;
      state.isOnline = false; // ADDED
      // Clear from localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("accessToken");
        } catch (error) {
          console.error("Failed to remove token from localStorage:", error);
        }
      }
    },
  },
});

export const { setAuth, setCurrentUser, setInitialized, setOnlineStatus, clearAuth } = authSlice.actions;
export default authSlice.reducer;
