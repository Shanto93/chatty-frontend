"use client";

import Avatar from "../common/Avatar";
import PresenceDot from "./PresenceDot";

interface MessageItemProps {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    online?: boolean;
  };
  attachment?: {
    type: "IMAGE" | "FILE";
    url: string;
    fileName?: string;
  };
}

export default function MessageItem({ content, createdAt, sender, attachment }: MessageItemProps) {
  const date = new Date(createdAt);

  return (
    <div className="flex gap-2 px-4 py-2 text-sm">
      <div className="relative">
        <Avatar size="sm" src={sender.avatarUrl ?? undefined} />
        <PresenceDot online={sender.online ?? false} className="absolute -bottom-1 -right-1" />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-semibold">{sender.displayName ?? sender.username}</span>
          <span className="text-xs text-gray-500">
            {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="text-gray-800">{content}</div>
        {attachment && (
          <div className="mt-1">
            {attachment.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachment.url}
                alt={attachment.fileName ?? "Image"}
                className="max-h-64 rounded border"
              />
            ) : (
              <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline"
              >
                {attachment.fileName ?? "Download file"}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
