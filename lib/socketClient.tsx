"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector, useAppDispatch } from "../store/store";
import { setCurrentUser, setOnlineStatus } from "../store/slices/authSlice";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps): JSX.Element {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const isAuthenticated = !!accessToken && !!currentUser;

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        console.log("🔌 Disconnecting socket - user not authenticated");
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        dispatch(setOnlineStatus(false));
      }
      return;
    }

    console.log("🔌 Connecting socket with token...");

    const socketUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api", "") ||
      "http://localhost:5001";
    console.log("Socket URL:", socketUrl);

    const newSocket = io(socketUrl, {
      auth: {
        token: accessToken,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("avatar-updated", ({ userId, avatarUrl }) => {
      // If current user or a displayed user matches, update Redux state
      if (currentUser.id === userId) {
        dispatch(setCurrentUser({ ...currentUser, avatarUrl }));
      }
      // Update avatars for lists or chat sidebar as needed
    });

    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      setIsConnected(true);
      dispatch(setOnlineStatus(true)); // ADDED - Set online when connected
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
      dispatch(setOnlineStatus(false)); // ADDED - Set offline when disconnected
    });

    newSocket.on("connect_error", (error) => {
      console.error("🔴 Socket connection error:", error.message);
      setIsConnected(false);
      dispatch(setOnlineStatus(false)); // ADDED
    });

    newSocket.on("error", (error) => {
      console.error("🔴 Socket error:", error);
    });

    newSocket.on("unauthorized", (error) => {
      console.error("🔴 Socket unauthorized:", error);
      newSocket.disconnect();
      dispatch(setOnlineStatus(false)); // ADDED
    });

    setSocket(newSocket);

    return () => {
      console.log("🔌 Cleaning up socket connection");
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
      dispatch(setOnlineStatus(false)); // ADDED
    };
  }, [isAuthenticated, accessToken, dispatch]);

  const contextValue: SocketContextType = {
    socket,
    isConnected,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}
