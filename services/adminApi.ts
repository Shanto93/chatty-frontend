// import { api } from "./api";

// interface AdminStats {
//   totalUsers: number;
//   totalRooms: number;
//   messagesToday: number;
// }

// interface AdminUser {
//   id: string;
//   username: string;
//   displayName: string | null;
//   avatarUrl: string | null;
// }

// interface AdminRoom {
//   id: string;
//   name: string;
//   slug: string;
//   isPrivate: boolean;
//   totalMembers: number;
//   onlineMembersCount: number;
//   lastMessageAt: string | null;
// }

// export const adminApi = api.injectEndpoints({
//     endpoints: (build) => ({
//         getAdminStats: build.query<AdminStats, void>({
//             query: () => ({
//                 url: "/admin/stats"
//             }),
//             providesTags: ["Admin"]
//         }),
//         getActiveUsers: build.query<AdminUser[], void>({
//             query: () => ({
//                 url: "/admin/active-users"
//             }),
//             providesTags: ["Admin"]
//         }),
//         getRoomsOverview: build.query<AdminRoom[], void>({
//             query: () => ({
//                 url: "/admin/rooms"
//             }),
//             providesTags: ["Admin"]
//         })
//     })
// });

// export const {
//   useGetAdminStatsQuery,
//   useGetActiveUsersQuery,
//   useGetRoomsOverviewQuery
// } = adminApi;



import { api } from "./api";

interface AdminStats {
  totalUsers: number;
  totalRooms: number;
  totalMessages: number;  // Added
  messagesToday: number;
  onlineUsers: number;
}

interface AdminUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isOnline: boolean;  // Added
  rooms: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface AdminRoom {
  id: string;
  name: string;
  slug: string;
  isPrivate: boolean;
  totalMembers: number;
  onlineMembers: number;
  messagesCount: number;
  lastMessageAt: string | null;
  createdById: string;
  createdAt: string;
}

interface UpdateRoomRequest {
  name?: string;
  description?: string;
  isPrivate?: boolean;
}

export const adminApi = api.injectEndpoints({
  endpoints: (build) => ({
    getAdminStats: build.query<AdminStats, void>({
      query: () => ({
        url: "/admin/stats"
      }),
      transformResponse: (response: any) => response.data.stats,
      providesTags: ["Admin"]
    }),
    getAllUsers: build.query<AdminUser[], void>({
      query: () => ({
        url: "/admin/users"
      }),
      transformResponse: (response: any) => response.data.users,
      providesTags: ["Admin"]
    }),
    getRoomsOverview: build.query<AdminRoom[], void>({
      query: () => ({
        url: "/admin/rooms"
      }),
      transformResponse: (response: any) => response.data.rooms,
      providesTags: ["Admin"]
    }),
    deleteRoomAsAdmin: build.mutation<void, string>({
      query: (roomId) => ({
        url: `/admin/rooms/${roomId}`,
        method: "DELETE"
      }),
      invalidatesTags: ["Admin", "Rooms"]
    }),
    updateRoomAsAdmin: build.mutation<AdminRoom, { roomId: string; data: UpdateRoomRequest }>({
      query: ({ roomId, data }) => ({
        url: `/admin/rooms/${roomId}`,
        method: "PATCH",
        body: data
      }),
      transformResponse: (response: any) => response.data.room,
      invalidatesTags: ["Admin", "Rooms"]
    })
  })
});

export const {
  useGetAdminStatsQuery,
  useGetAllUsersQuery,
  useGetRoomsOverviewQuery,
  useDeleteRoomAsAdminMutation,
  useUpdateRoomAsAdminMutation
} = adminApi;
