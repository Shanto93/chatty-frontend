"use client";

import { useState, useEffect, useRef } from "react";
import { useSendMessageMutation } from "../../services/messagesApi";
import { useSocket } from "../../lib/socketClient";

interface MessageInputProps {
  roomId: string;
}

export default function MessageInput({ roomId }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sendMessage, { isLoading }] = useSendMessageMutation();
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on("user:typing", ({ username }) => {
      setTypingUsers((prev) => {
        if (!prev.includes(username)) {
          return [...prev, username];
        }
        return prev;
      });
    });

    socket.on("user:stopped-typing", ({ username }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    });

    return () => {
      socket.off("user:typing");
      socket.off("user:stopped-typing");
    };
  }, [socket, isConnected]);

  const handleTyping = () => {
    if (!socket || !isConnected) return;

    if (!isTyping) {
      socket.emit("typing:start", roomId);
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", roomId);
      setIsTyping(false);
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (): Promise<any> => {
    if (!selectedFile) return null;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('roomId', roomId);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/messages/upload`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const result = await response.json();
      return result.data.attachment;
    } catch (error) {
      console.error('File upload error:', error);
      alert('Failed to upload file');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!message.trim() && !selectedFile) || isLoading || isUploading) return;

    // Stop typing indicator
    if (socket && isConnected && isTyping) {
      socket.emit("typing:stop", roomId);
      setIsTyping(false);
    }

    try {
      let attachment = null;

      // Upload file if selected
      if (selectedFile) {
        attachment = await uploadFile();
        if (!attachment) {
          return; 
        }
      }

      // Send message
      await sendMessage({
        roomId,
        content: message.trim() || (selectedFile ? `Sent ${selectedFile.name}` : ''),
        attachment,
      }).unwrap();

      setMessage("");
      clearFile();
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  return (
    <div className="border-t bg-white">
      {/* Typing Indicator */}
      {typingUsers.length > 0 && (
        <div className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-500 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </div>
            <span className="truncate">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`}
            </span>
          </div>
        </div>
      )}

      {/* File Preview */}
      {selectedFile && (
        <div className="px-3 sm:px-4 py-2 sm:py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2 sm:gap-3">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Preview"
                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded border flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={clearFile}
              className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
              type="button"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4">
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* File Attachment Button */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 sm:p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
            title="Attach file"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder="Type a message..."
            className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading || isUploading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || isUploading || (!message.trim() && !selectedFile)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 sm:gap-2 min-w-[70px] sm:min-w-[100px] justify-center flex-shrink-0 text-xs sm:text-base"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="hidden sm:inline">Uploading</span>
              </>
            ) : isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="hidden sm:inline">Sending</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="hidden xs:inline">Send</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
