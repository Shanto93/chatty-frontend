import { api } from "./api";

interface Message {
  id: string;
  content: string;
  roomId: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  attachment: {
    type: string;
    url: string;
    fileName: string | null;
    fileSize: number | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface MessagesResponse {
  status: string;
  data: {
    messages: Message[];
    nextCursor: string | null;
    hasMore: boolean;
  };
}

interface SendMessageRequest {
  roomId: string;
  content: string;
  attachment?: any;
}

export const messagesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getMessages: build.query<MessagesResponse, string>({
      query: (roomId) => ({
        url: `/messages/${roomId}`,
        method: "GET",
      }),
      providesTags: (result, error, roomId) => [
        { type: "Messages", id: roomId },
      ],
    }),

    sendMessage: build.mutation<any, SendMessageRequest>({
      query: (body) => ({
        url: "/messages",
        method: "POST",
        body,
      }),
      // Don't invalidate - real-time update handles it
      invalidatesTags: [],
    }),
  }),
});

export const { useGetMessagesQuery, useSendMessageMutation } = messagesApi;
