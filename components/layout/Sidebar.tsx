"use client";

import { useAppSelector } from "../../store/store";
import { useLogoutMutation } from "../../services/authApi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RoomList from "../chat/RoomList";
import TopBar from "./TopBar";

export default function Sidebar() {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const [logout, { isLoading }] = useLogoutMutation();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const displayName = currentUser?.displayName || currentUser?.username || "Guest";
  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="flex h-full lg:w-72 flex-col border-r bg-white">
      {/* Rooms Section */}
      <div className="flex-1 overflow-hidden">
        <RoomList />
      </div>

      {/* Admin Dashboard Link (if admin) */}
      {isAdmin && (
        <div className="border-t px-4 py-3">
          <Link
            href="/admin"
            className="text-sm text-blue-600 hover:underline"
          >
            Admin dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
