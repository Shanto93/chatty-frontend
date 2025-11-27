"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../../../lib/socketClient";
import {
  useGetRoomByIdQuery,
  useLeaveRoomMutation,
  useDeleteRoomMutation,
  useJoinRoomMutation,
} from "../../../../services/roomsApi";
import MessageInput from "../../../../components/chat/MessageInput";
import Sidebar from "../../../../components/layout/Sidebar";
import MessageList from "../../../../components/chat/MessageList";

interface RoomPageProps {
  params: { roomId: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  const roomId = params.roomId;
  const router = useRouter();
  const { isConnected } = useSocket();

  const [showMenu, setShowMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fetch room data
  const {
    data: roomData,
    isLoading,
    error,
    refetch,
  } = useGetRoomByIdQuery(roomId);
  const [leaveRoom] = useLeaveRoomMutation();
  const [deleteRoom] = useDeleteRoomMutation();
  const [joinRoom, { isLoading: isJoining }] = useJoinRoomMutation();

  const handleJoinRoom = async () => {
    try {
      await joinRoom(roomId).unwrap();
      refetch(); // Refresh room data after joining
    } catch (error: any) {
      alert(error?.data?.message || "Failed to join room");
    }
  };

  const handleLeaveRoom = async () => {
    if (!confirm("Are you sure you want to leave this room?")) return;

    try {
      await leaveRoom(roomId).unwrap();
      router.push("/chat/rooms");
    } catch (error: any) {
      alert(error?.data?.message || "Failed to leave room");
    }
  };

  const handleDeleteRoom = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this room? This action cannot be undone."
      )
    )
      return;

    try {
      await deleteRoom(roomId).unwrap();
      router.push("/chat/rooms");
    } catch (error: any) {
      alert(error?.data?.message || "Failed to delete room");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading room...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center p-6">
            <div className="mb-4 text-red-400">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-gray-600 mb-2 font-medium">
              Failed to load room
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {(error as any)?.data?.message ||
                "This room may not exist or you don't have access"}
            </p>
            <button
              onClick={() => router.push("/chat/rooms")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Rooms
            </button>
          </div>
        </div>
      </div>
    );
  }

  const room = roomData.data.room;

  // SECURITY: If user is not a member, show "Join Room" screen
  if (!room.isMember) {
    return (
      <div className="flex h-screen overflow-hidden">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed lg:relative inset-y-0 left-0 z-50
            transform transition-transform duration-300 ease-in-out
            ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            }
          `}
        >
          <Sidebar />
        </div>

        {/* Join Room Screen */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b bg-white shadow-sm">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                    {room.name}
                  </h1>

                  {room.isPrivate && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full flex-shrink-0">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Private
                    </span>
                  )}
                </div>
                {room.description && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                    {room.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Join Room Content */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-4 sm:p-8 overflow-auto">
            <div className="text-center max-w-md w-full">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-blue-100 rounded-full mb-4">
                  <svg
                    className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                Join Room to Continue
              </h2>

              <p className="text-sm sm:text-base text-gray-600 mb-6 px-4">
                You need to join{" "}
                <span className="font-semibold text-gray-900">
                  "{room.name}"
                </span>{" "}
                to view messages and participate in conversations.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleJoinRoom}
                  disabled={isJoining}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
                >
                  {isJoining ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Joining...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Join Room</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => router.push("/chat/rooms")}
                  className="text-sm sm:text-base text-gray-600 hover:text-gray-900 underline"
                >
                  Go back to rooms list
                </button>
              </div>

              {/* Room Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span>{room._count?.memberships || 0} members</span>
                  </div>
                  {room._count?.messages !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span>{room._count.messages} messages</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // SECURITY PASSED: User is a member, show the chat interface
  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Complete Sidebar Component */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <Sidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
        {/* Room Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b bg-white shadow-sm">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 truncate">
                  {room.name}
                </h1>

                {/* Online Status Indicator */}
                {isConnected && (
                  <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-50 rounded-full flex-shrink-0">
                    <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] sm:text-xs text-green-700 font-medium">
                      Online
                    </span>
                  </div>
                )}

                {room.isPrivate && (
                  <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full flex-shrink-0">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    Private
                  </span>
                )}
                {room.isCreator && (
                  <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium flex-shrink-0">
                    Creator
                  </span>
                )}
              </div>
              {room.description && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate hidden sm:block">
                  {room.description}
                </p>
              )}
              <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                {room._count?.memberships || 0} members
              </p>
            </div>
          </div>

          {/* Room Actions Menu */}
          <div className="relative flex-shrink-0 ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Room options"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20 py-1">
                  {room.isCreator ? (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleDeleteRoom();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      Delete Room
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        handleLeaveRoom();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Leave Room
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <MessageList roomId={roomId} />
        </div>

        {/* Message Input - Fixed */}
        <div className="flex-shrink-0">
          <MessageInput roomId={roomId} />
        </div>
      </div>
    </div>
  );
}
