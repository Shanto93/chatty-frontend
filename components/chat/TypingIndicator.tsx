"use client";

import { useSocketRoom } from "../../lib/useSocketRoom";

interface Props {
  roomId: string;
}

export default function TypingIndicator({ roomId }: Props) {
  // const { typingUsers } = useSocketRoom(roomId);
  const { typingUsers } = useSocketRoom(roomId);

  if (typingUsers.length === 0) {
    return null;
  }

  const names = typingUsers.join(", ");

  return (
    <div className="mb-1 text-xs text-gray-500">
      {names} {typingUsers.length === 1 ? "is" : "are"} typing…
    </div>
  );
}
