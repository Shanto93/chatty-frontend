"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { useAppSelector } from "../../../store/store";
import { useMeQuery } from "../../../services/authApi";

export default function EditProfilePage() {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { data: userData } = useMeQuery();
  const user = userData || currentUser;

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [statusMessage, setStatusMessage] = useState(user?.statusMessage || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // Only send fields that have values
      const updateData: any = {
        displayName: displayName.trim(),
      };

      // Only add statusMessage if it has a value
      if (statusMessage.trim()) {
        updateData.statusMessage = statusMessage.trim();
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api'}/users/me`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update profile");
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/profile";
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">Edit Profile</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
              maxLength={50}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status Message */}
          <div>
            <label htmlFor="statusMessage" className="block text-sm font-medium text-gray-700">
              Status Message <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              id="statusMessage"
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              maxLength={200}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="What's on your mind?"
            />
            <p className="mt-1 text-xs text-gray-500">Leave empty if you don't want a status message</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-600">
              Profile updated successfully! Redirecting...
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
