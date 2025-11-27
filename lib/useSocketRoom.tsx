import { useEffect, useState } from "react";
import { useSocket } from "./socketClient";

interface RoomContextType {
  typingUsers: string[];
}

export const useSocketRoom = (roomId: string): RoomContextType => {
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!socket || !isConnected || !roomId) return;

    const handleUserTyping = ({ username }: { username: string }) => {
      setTypingUsers((prev) => {
        if (!prev.includes(username)) {
          return [...prev, username];
        }
        return prev;
      });

      // Remove user from typing after 3 seconds
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((user) => user !== username));
      }, 3000);
    };

    const handleUserStoppedTyping = ({ username }: { username: string }) => {
      setTypingUsers((prev) => prev.filter((user) => user !== username));
    };

    socket.on("user:typing", handleUserTyping);
    socket.on("user:stopped-typing", handleUserStoppedTyping);

    return () => {
      socket.off("user:typing", handleUserTyping);
      socket.off("user:stopped-typing", handleUserStoppedTyping);
    };
  }, [socket, isConnected, roomId]);

  return { typingUsers };
};
