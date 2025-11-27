"use client";


import { useRouter } from "next/navigation";
import { useAppSelector } from "../../store/store";
import { useMeQuery } from "../../services/authApi";

export default function ProfilePage() {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const { data: userData, isLoading } = useMeQuery();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const user = userData || currentUser;

  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const avatarUrl = user.avatarUrl || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random&size=256`;

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-2xl font-bold">Profile</h1>

        <div className="flex flex-col items-center gap-6 md:flex-row">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <img
              src={avatarUrl}
              alt={user.displayName}
              className="h-32 w-32 rounded-full border-4 border-gray-200 object-cover"
            />
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Display Name</label>
              <p className="text-lg font-semibold text-gray-900">{user.displayName}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Username</label>
              <p className="text-lg text-gray-900">@{user.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <p className="text-lg text-gray-900">{user.email}</p>
            </div>

            {user.statusMessage && (
              <div>
                <label className="block text-sm font-medium text-gray-600">Status Message</label>
                <p className="text-lg text-gray-900">{user.statusMessage}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600">Role</label>
              <p className="text-lg capitalize text-gray-900">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push("/profile/edit")}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Edit Profile
          </button>
          <button
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
