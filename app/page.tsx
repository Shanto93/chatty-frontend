"use client";

import Link from "next/link";
import { useAppSelector } from "../store/store";

export default function HomePage() {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const isAuthenticated = !!accessToken;

  return (
    <>
      <style jsx>{`
        @property --border-angle {
          syntax: "<angle>";
          inherits: true;
          initial-value: 0deg;
        }

        @keyframes border-spin {
          100% {
            --border-angle: 360deg;
          }
        }

        .animate-border {
          animation: border-spin 6s linear infinite;
        }
      `}</style>

      <main className="w-full flex items-center justify-center p-4 bg-black h-screen">
        <div className="w-full max-w-[422px] mx-auto [background:linear-gradient(45deg,#080b11,theme(colors.slate.800)_50%,#172033)_padding-box,conic-gradient(from_var(--border-angle),theme(colors.slate.600/.48)_80%,theme(colors.teal.500)_86%,theme(colors.cyan.300)_90%,theme(colors.teal.500)_94%,theme(colors.slate.600/.48))_border-box] rounded-2xl border border-transparent animate-border">
          {/* Inner content card */}
          <div className="relative text-center z-10 px-8 py-12 rounded-2xl w-full bg-black dark:bg-black h-full mx-auto">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">
              Team Chat
            </h1>
            <p className="mb-6 text-sm text-gray-400">
              A simple real-time team chat with rooms, presence, and file
              sharing.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {!isAuthenticated && (
                <>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center rounded-md border border-teal-500 px-4 py-2 text-sm font-medium text-teal-400 hover:bg-teal-500/10 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}

              {isAuthenticated && (
                <>
                  <Link
                    href="/chat/rooms"
                    className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 transition-colors"
                  >
                    Go to chat
                  </Link>
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800/50 transition-colors"
                  >
                    Admin
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
