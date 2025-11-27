// app/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useGetRoomsOverviewQuery,
  useGetAllUsersQuery,
  useGetAdminStatsQuery,
  useDeleteRoomAsAdminMutation,
  useUpdateRoomAsAdminMutation,
} from "../../services/adminApi";
import { useSocket } from "../../lib/socketClient";
import AdminProtectedRoute from "../../components/auth/AdminProtectedRoute";

export default function AdminPage() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useGetAdminStatsQuery();
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useGetAllUsersQuery();
  const { data: rooms, isLoading: roomsLoading, refetch: refetchRooms } = useGetRoomsOverviewQuery();
  
  const [deleteRoom] = useDeleteRoomAsAdminMutation();
  const [updateRoom] = useUpdateRoomAsAdminMutation();

  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "online" | "offline">("all");

  // Real-time users and rooms state
  const [realtimeUsers, setRealtimeUsers] = useState(users);
  const [realtimeRooms, setRealtimeRooms] = useState(rooms);

  // Update realtime data when API data changes
  useEffect(() => {
    if (users) setRealtimeUsers(users);
  }, [users]);

  useEffect(() => {
    if (rooms) setRealtimeRooms(rooms);
  }, [rooms]);

  // Socket.IO real-time listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log("🔌 Setting up admin socket listeners");

    // Listen for stats updates
    socket.on('admin:stats-updated', (updatedStats) => {
      console.log("📊 Stats updated:", updatedStats);
      refetchStats();
      refetchUsers();
    });

    // Listen for user online status changes
    socket.on('user:online', ({ userId }) => {
      console.log("✅ User online:", userId);
      setRealtimeUsers((prevUsers) =>
        prevUsers?.map((user) =>
          user.id === userId ? { ...user, isOnline: true } : user
        )
      );
      refetchStats();
    });

    socket.on('user:offline', ({ userId }) => {
      console.log("❌ User offline:", userId);
      setRealtimeUsers((prevUsers) =>
        prevUsers?.map((user) =>
          user.id === userId ? { ...user, isOnline: false } : user
        )
      );
      refetchStats();
    });

    // Listen for admin-specific user status changes
    socket.on('admin:user-status-changed', ({ userId, isOnline }) => {
      console.log(`👤 User ${userId} status changed to ${isOnline ? 'online' : 'offline'}`);
      setRealtimeUsers((prevUsers) =>
        prevUsers?.map((user) =>
          user.id === userId ? { ...user, isOnline } : user
        )
      );
      refetchStats();
    });

    // Listen for room updates
    socket.on('admin:room-created', (room) => {
      console.log("➕ Room created:", room);
      refetchRooms();
      refetchStats();
    });

    socket.on('admin:room-deleted', (roomId) => {
      console.log("🗑️ Room deleted:", roomId);
      setRealtimeRooms((prevRooms) =>
        prevRooms?.filter((room) => room.id !== roomId)
      );
      refetchStats();
    });

    socket.on('admin:room-updated', (updatedRoom) => {
      console.log("✏️ Room updated:", updatedRoom);
      setRealtimeRooms((prevRooms) =>
        prevRooms?.map((room) =>
          room.id === updatedRoom.id ? { ...room, ...updatedRoom } : room
        )
      );
    });

    // Listen for room online count updates
    socket.on('admin:room-online-updated', ({ roomId, onlineMembers, totalMembers }) => {
      console.log(`👥 Room ${roomId} online: ${onlineMembers}/${totalMembers}`);
      setRealtimeRooms((prevRooms) =>
        prevRooms?.map((room) =>
          room.id === roomId 
            ? { ...room, onlineMembers, totalMembers } 
            : room
        )
      );
    });

    // Listen for room message count updates
    socket.on('admin:room-messages-updated', ({ roomId, messagesCount }) => {
      console.log(`💬 Room ${roomId} messages: ${messagesCount}`);
      setRealtimeRooms((prevRooms) =>
        prevRooms?.map((room) =>
          room.id === roomId ? { ...room, messagesCount } : room
        )
      );
    });

    return () => {
      console.log("🔌 Cleaning up admin socket listeners");
      socket.off('admin:stats-updated');
      socket.off('user:online');
      socket.off('user:offline');
      socket.off('admin:user-status-changed');
      socket.off('admin:room-created');
      socket.off('admin:room-deleted');
      socket.off('admin:room-updated');
      socket.off('admin:room-online-updated');
      socket.off('admin:room-messages-updated');
    };
  }, [socket, isConnected, refetchRooms, refetchStats, refetchUsers]);

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteRoom(roomId).unwrap();
      alert("Room deleted successfully");
    } catch (error: any) {
      alert(error?.data?.message || "Failed to delete room");
    }
  };

  const handleUpdateRoom = async (roomId: string) => {
    if (!newRoomName.trim()) {
      alert("Room name cannot be empty");
      return;
    }

    try {
      await updateRoom({ roomId, data: { name: newRoomName } }).unwrap();
      setEditingRoom(null);
      setNewRoomName("");
      alert("Room updated successfully");
    } catch (error: any) {
      alert(error?.data?.message || "Failed to update room");
    }
  };

  // Use realtime data
  const displayUsers = realtimeUsers || users;
  const displayRooms = realtimeRooms || rooms;

  // Calculate counts from actual user list
  const activeUsers = displayUsers?.filter((u) => u.isOnline) || [];
  const inactiveUsers = displayUsers?.filter((u) => !u.isOnline) || [];
  const totalUsersCount = displayUsers?.length || 0;

  const filteredUsers = displayUsers?.filter((user) => {
    if (userFilter === "online") return user.isOnline;
    if (userFilter === "offline") return !user.isOnline;
    return true;
  });

  return (
    <AdminProtectedRoute>
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              {isConnected && (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">Real-time monitoring and management</p>
          </div>
          <button
            onClick={() => router.push("/chat/rooms")}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 border"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Chat
          </button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statsLoading || usersLoading ? "..." : totalUsersCount}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Users</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {statsLoading || usersLoading ? "..." : activeUsers.length}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rooms</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statsLoading ? "..." : stats?.totalRooms || 0}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages Today</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statsLoading ? "..." : stats?.messagesToday || 0}
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Messages</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statsLoading ? "..." : stats?.totalMessages || 0}
                </p>
              </div>
              <div className="rounded-full bg-indigo-100 p-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Users Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setUserFilter("all")}
                  className={`px-3 py-1 text-xs font-medium rounded-lg ${
                    userFilter === "all"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  All ({totalUsersCount})
                </button>
                <button
                  onClick={() => setUserFilter("online")}
                  className={`px-3 py-1 text-xs font-medium rounded-lg ${
                    userFilter === "online"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Online ({activeUsers.length})
                </button>
                <button
                  onClick={() => setUserFilter("offline")}
                  className={`px-3 py-1 text-xs font-medium rounded-lg ${
                    userFilter === "offline"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Offline ({inactiveUsers.length})
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {(user.displayName || user.username).charAt(0).toUpperCase()}
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white transition-colors ${
                            user.isOnline ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.displayName || user.username}
                        </p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                        user.isOnline
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {user.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-gray-500">No users found</p>
              )}
            </div>
          </div>

          {/* Rooms Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Rooms Management</h2>
              <p className="text-sm text-gray-500">Delete or update any room</p>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {roomsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
                </div>
              ) : displayRooms && displayRooms.length > 0 ? (
                displayRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    {editingRoom === room.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newRoomName}
                          onChange={(e) => setNewRoomName(e.target.value)}
                          placeholder="New room name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateRoom(room.id)}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingRoom(null);
                              setNewRoomName("");
                            }}
                            className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{room.name}</h3>
                              {room.isPrivate && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                  Private
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">ID: {room.id}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span className="font-medium text-green-600">{room.onlineMembers}</span>/{room.totalMembers} online
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {room.messagesCount} messages
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingRoom(room.id);
                              setNewRoomName(room.name);
                            }}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id, room.name)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-gray-500">No rooms found</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </AdminProtectedRoute>
  );
}
