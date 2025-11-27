"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../lib/socketClient";
import { useGetMessagesQuery } from "../../services/messagesApi";
import { useAppSelector } from "../../store/store";

interface MessageListProps {
  roomId: string;
}

export default function MessageList({ roomId }: MessageListProps) {
  const { socket, isConnected } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data, isLoading, error } = useGetMessagesQuery(roomId);

  // Update state when data changes
  useEffect(() => {
    if (data?.data) {
      setAllMessages(data.data.messages);
      setCursor(data.data.nextCursor);
      setHasMore(data.data.hasMore || false);
    }
  }, [data]);

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!cursor || isLoadingMore) return;
    setIsLoadingMore(true);
    const scrollContainer = messagesContainerRef.current;
    const previousScrollHeight = scrollContainer?.scrollHeight || 0;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/messages/${roomId}?cursor=${cursor}&limit=15`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        const olderMessages = result.data.messages;
        setAllMessages((prev) => [...olderMessages, ...prev]);
        setCursor(result.data.nextCursor);
        setHasMore(result.data.hasMore || false);

        setTimeout(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop =
              newScrollHeight - previousScrollHeight;
          }
        }, 0);
      }
    } catch (error) {
      console.error("Failed to load more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Socket listeners including system join/leave
  useEffect(() => {
    if (!socket || !isConnected || !roomId) return;

    const handleNewMessage = (message: any) => {
      setAllMessages((prev) => [...prev, message]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    };

    const handleMessageUpdated = (message: any) => {
      setAllMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? message : msg))
      );
    };

    const handleMessageDeleted = (messageId: string) => {
      setAllMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    };

    const handleUserJoinedSystem = (systemMessage: any) => {
      setAllMessages((prev) => [...prev, systemMessage]);
    };

    const handleUserLeftSystem = (systemMessage: any) => {
      setAllMessages((prev) => [...prev, systemMessage]);
    };

    socket.emit("room:join", roomId);
    socket.on("message:new", handleNewMessage);
    socket.on("message:updated", handleMessageUpdated);
    socket.on("message:deleted", handleMessageDeleted);
    socket.on("room:user-joined-system", handleUserJoinedSystem);
    socket.on("room:user-left-system", handleUserLeftSystem);

    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:updated", handleMessageUpdated);
      socket.off("message:deleted", handleMessageDeleted);
      socket.off("room:user-joined-system", handleUserJoinedSystem);
      socket.off("room:user-left-system", handleUserLeftSystem);
      socket.emit("room:leave", roomId);
    };
  }, [socket, isConnected, roomId]);

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (allMessages.length > 0 && !cursor) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      }, 100);
    }
  }, [allMessages.length, cursor]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
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
          <p className="text-red-600 font-medium mb-2">
            Failed to load messages
          </p>
          <p className="text-sm text-gray-500">
            {(error as any)?.data?.message || "Please try again"}
          </p>
        </div>
      </div>
    );
  }

  if (allMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-gray-400">
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-gray-600 mb-2 font-medium">No messages yet</p>
          <p className="text-sm text-gray-500">
            Start the conversation by sending a message!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={messagesContainerRef}
      className="h-full overflow-y-auto p-4 space-y-4 bg-gray-50"
    >
      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center mb-4">
          <button
            onClick={loadMoreMessages}
            disabled={isLoadingMore}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
          >
            {isLoadingMore ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg
                  className="w-3 h-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                Load More Messages
              </>
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      {allMessages.map((message: any) => {
        if (
          message.type === "SYSTEM" &&
          (message.action === "USER_JOINED" ||
            message.action === "USER_LEFT")
        ) {
          // System join/leave message
          return (
            <div key={message.id} className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-full my-2 shadow-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {message.action === "USER_JOINED" ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  )}
                </svg>
                <span className="font-medium">{message.content}</span>
                <span className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        }

        // Regular message
        const isOwnMessage = message.senderId === currentUser?.id;

        return (
          <div
            key={message.id}
            className={`flex gap-3 ${
              isOwnMessage ? "flex-row-reverse" : ""
            }`}
          >
            <div className="flex-shrink-0">
              {message.sender.avatarUrl ? (
                <img
                  src={message.sender.avatarUrl}
                  alt={message.sender.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-10 h-10 rounded-full ${
                    isOwnMessage ? "bg-green-500" : "bg-blue-500"
                  } flex items-center justify-center text-white font-medium`}
                >
                  {message.sender.displayName?.[0]?.toUpperCase() ||
                    message.sender.username[0].toUpperCase()}
                </div>
              )}
            </div>

            <div
              className={`flex-1 max-w-[70%] ${
                isOwnMessage ? "items-end" : "items-start"
              } flex flex-col`}
            >
              <div
                className={`flex items-baseline gap-2 mb-1 ${
                  isOwnMessage ? "flex-row-reverse" : ""
                }`}
              >
                <span className="font-medium text-sm text-gray-900">
                  {isOwnMessage
                    ? "You"
                    : message.sender.displayName ||
                      message.sender.username}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div
                className={`px-4 py-2 rounded-2xl ${
                  isOwnMessage
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white text-gray-700 border border-gray-200 rounded-bl-sm"
                } shadow-sm`}
              >
                <p className="break-words whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>

              {message.attachment && (
                <div className="mt-2">
                  {message.attachment.type === "IMAGE" ? (
                    <img
                      src={message.attachment.url}
                      alt={
                        message.attachment.fileName || "Attachment"
                      }
                      className="max-w-[150px] rounded-lg border shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() =>
                        window.open(message.attachment.url, "_blank")
                      }
                    />
                  ) : (
                    <a
                      href={message.attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        isOwnMessage
                          ? "bg-blue-500 text-white border-blue-400"
                          : "bg-gray-50 text-blue-600 border-gray-200"
                      } hover:opacity-80 transition-opacity`}
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm">
                        {message.attachment.fileName}
                      </span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}