"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/store";
import { useLogoutMutation } from "../../services/authApi";
import { setCurrentUser } from "../../store/slices/authSlice";


export default function TopBar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const isOnline = useAppSelector((state) => state.auth.isOnline);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logout] = useLogoutMutation();
  const [isUploading, setIsUploading] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem("accessToken");
      router.push("/auth/login");
    }
  };

  const handleProfile = () => {
    router.push("/profile");
    setShowDropdown(false);
  };

  const handleSettings = () => {
    router.push("/settings");
    setShowDropdown(false);
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
    setShowDropdown(false);
  };

  const handleUploadImage = () => {
    setShowDropdown(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api'}/users/me/avatar`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }

      const data = await response.json();
      
      // Update Redux state with new avatar URL
      if (data.data && data.data.user && currentUser) {
        dispatch(setCurrentUser({
          ...currentUser,
          avatarUrl: data.data.user.avatarUrl,
        }));
      }

      alert("Avatar uploaded successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!currentUser) return null;

  // Generate avatar URL
  const avatarUrl = currentUser.avatarUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName)}&background=random&size=128`;

  return (
    <div className="flex h-16 items-center justify-between bg-white px-6 mt-2">

      <div className="flex items-center gap-4">

        {/* Avatar with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative flex items-center transition-opacity hover:opacity-80"
            disabled={isUploading}
          >
            {/* User Avatar */}
            <img
              src={avatarUrl}
              alt={currentUser.displayName}
              className="h-12 w-12 rounded-full border-2 border-gray-200 object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName)}&background=random&size=128`;
              }}
            />
            {/* Online/Offline Status Indicator */}
            <span
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                isOnline ? "bg-green-500" : "bg-red-500"
              }`}
              title={isOnline ? "Online" : "Offline"}
            />
            {/* Uploading Indicator */}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              </div>
            )}
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute -right-52 z-50 mt-2 w-56 bg-white rounded-md ring-1 ring-black ring-opacity-5">
              <div className="py-1">
                <button
                  onClick={handleProfile}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </button>

                <button
                  onClick={handleEditProfile}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>

                <button
                  onClick={handleUploadImage}
                  disabled={isUploading}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {isUploading ? "Uploading..." : "Upload Image"}
                </button>

                <button
                  onClick={handleSettings}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </button>

                <hr className="my-1" />

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Username Display */}
        <span className="font-medium text-gray-700">
          {currentUser.displayName}
        </span>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
