import { api } from "./api";

export interface Room {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPrivate: boolean;
  createdById: string;
  isMember: boolean;
  isCreator: boolean;
  _count?: {
    memberships: number;
    messages: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateRoomRequest {
  name: string;
  description?: string;
  isPrivate?: boolean;
}

interface UpdateRoomRequest {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

export const roomsApi = api.injectEndpoints({
  endpoints: (build) => ({
    // Get all joined rooms
    getJoinedRooms: build.query<any, void>({
      query: () => ({
        url: "/rooms/joined",
        method: "GET",
      }),
      providesTags: ["Rooms"],
    }),

    // Get all public rooms
    getPublicRooms: build.query<any, void>({
      query: () => ({
        url: "/rooms/public",
        method: "GET",
      }),
      providesTags: ["Rooms"],
    }),

    // Get room by ID
    getRoomById: build.query<any, string>({
      query: (roomId) => ({
        url: `/rooms/${roomId}`,
        method: "GET",
      }),
      providesTags: (result, error, roomId) => [{ type: "Rooms", id: roomId }],
    }),

    // Search rooms
    searchRooms: build.query<any, string>({
      query: (searchQuery) => ({
        url: `/rooms/search?query=${encodeURIComponent(searchQuery)}`,
        method: "GET",
      }),
      providesTags: ["Rooms"],
    }),

    // Create a new room
    createRoom: build.mutation<any, CreateRoomRequest>({
      query: (body) => ({
        url: "/rooms",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Rooms"],
    }),

    // Update a room
    updateRoom: build.mutation<any, { roomId: string; data: UpdateRoomRequest }>({
      query: ({ roomId, data }) => ({
        url: `/rooms/${roomId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { roomId }) => [
        "Rooms",
        { type: "Rooms", id: roomId },
      ],
    }),

    // Delete a room
    deleteRoom: build.mutation<void, string>({
      query: (roomId) => ({
        url: `/rooms/${roomId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Rooms"],
    }),

    // Join a room
    joinRoom: build.mutation<any, string>({
      query: (roomId) => ({
        url: `/rooms/${roomId}/join`,
        method: "POST",
      }),
      invalidatesTags: ["Rooms"],
    }),

    // Leave a room
    leaveRoom: build.mutation<any, string>({
      query: (roomId) => ({
        url: `/rooms/${roomId}/leave`,
        method: "POST",
      }),
      invalidatesTags: ["Rooms"],
    }),

    // Add member to room
    addMember: build.mutation<any, { roomId: string; userId: string }>({
      query: ({ roomId, userId }) => ({
        url: `/rooms/${roomId}/members`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: (result, error, { roomId }) => [
        "Rooms",
        { type: "Rooms", id: roomId },
      ],
    }),

    // Remove member from room
    removeMember: build.mutation<any, { roomId: string; memberId: string }>({
      query: ({ roomId, memberId }) => ({
        url: `/rooms/${roomId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { roomId }) => [
        "Rooms",
        { type: "Rooms", id: roomId },
      ],
    }),

    // Get room members
    getRoomMembers: build.query<any, string>({
      query: (roomId) => ({
        url: `/rooms/${roomId}/members`,
        method: "GET",
      }),
      providesTags: (result, error, roomId) => [{ type: "Rooms", id: roomId }],
    }),

    // Update member role
    updateMemberRole: build.mutation<
      any,
      { roomId: string; memberId: string; role: "ADMIN" | "MEMBER" }
    >({
      query: ({ roomId, memberId, role }) => ({
        url: `/rooms/${roomId}/members/${memberId}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (result, error, { roomId }) => [
        "Rooms",
        { type: "Rooms", id: roomId },
      ],
    }),
  }),
});

export const {
  useGetJoinedRoomsQuery,
  useGetPublicRoomsQuery,
  useGetRoomByIdQuery,
  useSearchRoomsQuery,
  useCreateRoomMutation,
  useUpdateRoomMutation,
  useDeleteRoomMutation,
  useJoinRoomMutation,
  useLeaveRoomMutation,
  useAddMemberMutation,
  useRemoveMemberMutation,
  useGetRoomMembersQuery,
  useUpdateMemberRoleMutation,
} = roomsApi;
