"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../../lib/socketClient";
import { 
  useGetJoinedRoomsQuery, 
  useGetPublicRoomsQuery,
  useJoinRoomMutation,
  useLeaveRoomMutation,
  useDeleteRoomMutation,
} from "../../services/roomsApi";
import { useAppDispatch } from "../../store/store";
import { api } from "../../services/api";
import CreateRoomModal from "./CreateRoomModal";
import TopBar from "../layout/TopBar";

interface RoomListProps {
  onClose?: () => void;
}

export default function RoomList({ onClose }: RoomListProps) {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const dispatch = useAppDispatch();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"joined" | "public">("joined");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch rooms
  const { data: joinedRoomsData, isLoading: isLoadingJoined, refetch: refetchJoined } = useGetJoinedRoomsQuery();
  const { data: publicRoomsData, isLoading: isLoadingPublic, refetch: refetchPublic } = useGetPublicRoomsQuery();

  // Mutations
  const [joinRoom, { isLoading: isJoining }] = useJoinRoomMutation();
  const [leaveRoom, { isLoading: isLeaving }] = useLeaveRoomMutation();
  const [deleteRoom, { isLoading: isDeleting }] = useDeleteRoomMutation();

  // Local state for real-time updates
  const [localJoinedRooms, setLocalJoinedRooms] = useState<any[]>([]);
  const [localPublicRooms, setLocalPublicRooms] = useState<any[]>([]);

  // Update local state when API data changes
  useEffect(() => {
    if (joinedRoomsData?.data?.rooms) {
      setLocalJoinedRooms(joinedRoomsData.data.rooms);
    }
  }, [joinedRoomsData]);

  useEffect(() => {
    if (publicRoomsData?.data?.rooms) {
      setLocalPublicRooms(publicRoomsData.data.rooms);
    }
  }, [publicRoomsData]);

  // Listen for real-time room updates via Socket.IO
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log("Setting up room event listeners");

    socket.on("room:created", (room) => {
      console.log("New room created:", room);
      dispatch(api.util.invalidateTags(["Rooms"]));
      refetchJoined();
      refetchPublic();
    });

    socket.on("room:updated", (room) => {
      console.log("Room updated:", room);
      // Update local state immediately
      setLocalJoinedRooms(prev => 
        prev.map(r => r.id === room.id ? { ...r, ...room } : r)
      );
      setLocalPublicRooms(prev => 
        prev.map(r => r.id === room.id ? { ...r, ...room } : r)
      );
      dispatch(api.util.invalidateTags(["Rooms"]));
    });

    socket.on("room:deleted", (roomId) => {
      console.log("Room deleted:", roomId);
      
      // Remove from local state immediately
      setLocalJoinedRooms(prev => prev.filter(r => r.id !== roomId));
      setLocalPublicRooms(prev => prev.filter(r => r.id !== roomId));
      
      // Invalidate cache
      dispatch(api.util.invalidateTags(["Rooms"]));
      
      // Refetch to ensure consistency
      refetchJoined();
      refetchPublic();
      
      // If user is currently viewing the deleted room, redirect to rooms list
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        if (currentPath.includes(roomId)) {
          router.push("/chat/rooms");
          alert("This room has been deleted by an administrator.");
        }
      }
    });

    return () => {
      console.log("Cleaning up room event listeners");
      socket.off("room:created");
      socket.off("room:updated");
      socket.off("room:deleted");
    };
  }, [socket, isConnected, dispatch, refetchJoined, refetchPublic, router]);

  const handleJoinRoom = async (roomId: string) => {
    try {
      await joinRoom(roomId).unwrap();
      router.push(`/chat/rooms/${roomId}`);
      onClose?.();
    } catch (error: any) {
      alert(error?.data?.message || "Failed to join room");
    }
  };

  const handleLeaveRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to leave "${roomName}"?`)) return;

    try {
      await leaveRoom(roomId).unwrap();
    } catch (error: any) {
      alert(error?.data?.message || "Failed to leave room");
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) return;

    try {
      await deleteRoom(roomId).unwrap();
    } catch (error: any) {
      alert(error?.data?.message || "Failed to delete room");
    }
  };

  const handleRoomClick = (roomId: string) => {
    router.push(`/chat/rooms/${roomId}`);
    onClose?.();
  };

  // Use local state for display
  const rooms = activeTab === "joined" 
    ? localJoinedRooms
    : localPublicRooms;

  // Filter rooms by search query
  const filteredRooms = rooms.filter((room: any) => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isLoading = activeTab === "joined" ? isLoadingJoined : isLoadingPublic;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Create Button */}
      <TopBar></TopBar>
      <div className="p-3 sm:p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Rooms</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium shadow-sm hover:shadow-md"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Create Room</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setActiveTab("joined")}
            className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "joined"
                ? "bg-blue-100 text-blue-700 shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            My Rooms
          </button>
          <button
            onClick={() => setActiveTab("public")}
            className={`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === "public"
                ? "bg-blue-100 text-blue-700 shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Public Rooms
          </button>
        </div>

        {/* Search Box */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or Room ID..."
            className="w-full px-3 py-2 pl-9 sm:pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
          />
          <svg
            className="absolute left-2.5 sm:left-3 top-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 sm:right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-4 h-10 w-10 sm:h-12 sm:w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 font-medium text-sm">Loading rooms...</p>
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6">
            <div className="text-center">
              <div className="mb-4 text-gray-400">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 mb-2 font-medium text-sm sm:text-base">
                {searchQuery ? "No rooms found" : "No rooms yet"}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                {searchQuery
                  ? "Try a different search term"
                  : "Create your first room to get started"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md text-xs sm:text-sm"
                >
                  Create Your First Room
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredRooms.map((room: any) => (
            <div
              key={room.id}
              className="border-b hover:bg-gray-50 transition-colors"
            >
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  {/* Room Info */}
                  <div 
                    className="flex-1 min-w-0 cursor-pointer" 
                    onClick={() => handleRoomClick(room.id)}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate hover:text-blue-600 transition-colors">
                        {room.name}
                      </h3>
                      {room.isPrivate && (
                        <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] sm:text-xs rounded-full flex-shrink-0">
                          <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                          <span className="hidden sm:inline">Private</span>
                        </span>
                      )}
                      {room.isCreator && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] sm:text-xs rounded-full font-medium flex-shrink-0">
                          Creator
                        </span>
                      )}
                    </div>
                    {room.description && (
                      <p className="text-xs sm:text-sm text-gray-500 truncate mb-2">{room.description}</p>
                    )}
                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        {room._count?.memberships || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {room._count?.messages || 0}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    {room.isMember ? null : (
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={isJoining}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        <span className="hidden sm:inline">Join</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Room ID */}
                <div className="mt-2 text-[10px] sm:text-xs text-gray-400 font-mono truncate">
                  ID: {room.id}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
