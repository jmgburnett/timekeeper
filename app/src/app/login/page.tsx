"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../components/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const participants = useQuery(api.participants.listActive);
  const { user, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(user.isAdmin ? "/" : "/entry");
    }
  }, [user, router]);

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-sm shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">⏱ Timekeeper</h1>
          <p className="text-sm text-gray-500 mt-1">Select your name to log in</p>
        </div>

        {participants === undefined ? (
          <p className="text-center text-gray-400 text-sm">Loading...</p>
        ) : participants.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">
            No participants configured yet. Ask your admin to add you.
          </p>
        ) : (
          <div className="space-y-2">
            {participants.map((p) => (
              <button
                key={p._id}
                onClick={() => {
                  login({
                    participantId: p._id,
                    slackUserId: p.slackUserId,
                    name: p.name,
                    email: p.email,
                    isAdmin: p.isAdmin,
                  });
                  router.replace(p.isAdmin ? "/" : "/entry");
                }}
                className="w-full text-left px-4 py-3 rounded-md border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm"
              >
                <span className="font-medium">{p.name}</span>
                {p.email && (
                  <span className="text-gray-400 ml-2 text-xs">{p.email}</span>
                )}
                {p.isAdmin && (
                  <span className="text-blue-600 ml-2 text-xs font-medium">Admin</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
