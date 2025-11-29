"use client";

import { useEffect, useState } from "react";
import PresenceDot from "./PresenceDot";
import { useSocket } from "../../lib/socketClient";

interface OnlineUser {
  userId: string;
  online: boolean;
}

export default function OnlineUserList() {
  const { socket, isConnected } = useSocket();
  const [users, setUsers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handler = (data: OnlineUser) => {
      setUsers((prev) => ({
        ...prev,
        [data.userId]: data.online,
      }));
    };

    socket.on("presence_update", handler);

    return () => {
      socket.off("presence_update", handler);
    };
  }, [socket, isConnected]);

  const entries = Object.entries(users);

  if (entries.length === 0) {
    return <p className="px-4 py-2 text-xs text-gray-500">No active users</p>;
  }

  return (
    <ul className="space-y-1 px-4 py-2 text-xs">
      {entries.map(([userId, online]) => (
        <li key={userId} className="flex items-center gap-2">
          <PresenceDot online={online} />
          <span>{userId}</span>
        </li>
      ))}
    </ul>
  );
}
