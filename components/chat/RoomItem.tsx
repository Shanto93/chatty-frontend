"use client";

import type { Room } from "../../services/roomsApi";

interface Props {
  room: Room;
  onClick: () => void;
}

export default function RoomItem({ room, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-800">{room.name}</h3>
            {room.isCreator && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                Creator
              </span>
            )}
          </div>

          {room.description && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
              {room.description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
            <span>{room._count?.memberships ?? 0} members</span>
            <span>{room._count?.messages ?? 0} messages</span>
          </div>
        </div>
      </div>
    </div>
  );
}
