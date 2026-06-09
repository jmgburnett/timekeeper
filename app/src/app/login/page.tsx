"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../components/auth-context";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.isAdmin ? "/" : "/entry");
    }
  }, [isAuthenticated, user, router]);

  const handleSlackSignIn = async () => {
    setLoading(true);
    try {
      const result = await signIn("slack", { redirectTo: "/" });
      if (result?.signingIn && result?.redirect) {
        window.location.href = result.redirect.toString();
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-sm shadow-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">⏱ Timekeeper</h1>
          <p className="text-sm text-gray-500 mt-1">
            Sign in with your Gloo Slack account
          </p>
        </div>

        <button
          onClick={handleSlackSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#4A154B] text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-[#3a1139] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fillRule="evenodd">
              <path d="M19.712.133a5.381 5.381 0 00-5.376 5.387 5.381 5.381 0 005.376 5.386h5.376V5.52A5.381 5.381 0 0019.712.133m0 14.365H5.376A5.381 5.381 0 000 19.884a5.381 5.381 0 005.376 5.387h14.336a5.381 5.381 0 005.376-5.387 5.381 5.381 0 00-5.376-5.386" fill="#36C5F0"/>
              <path d="M53.76 19.884a5.381 5.381 0 00-5.376-5.386 5.381 5.381 0 00-5.376 5.386v5.387h5.376a5.381 5.381 0 005.376-5.387m-14.336 0V5.52A5.381 5.381 0 0034.048.133a5.381 5.381 0 00-5.376 5.387v14.364a5.381 5.381 0 005.376 5.387 5.381 5.381 0 005.376-5.387" fill="#2EB67D"/>
              <path d="M34.048 54a5.381 5.381 0 005.376-5.387 5.381 5.381 0 00-5.376-5.386h-5.376v5.386A5.381 5.381 0 0034.048 54m0-14.365h14.336a5.381 5.381 0 005.376-5.386 5.381 5.381 0 00-5.376-5.387H34.048a5.381 5.381 0 00-5.376 5.387 5.381 5.381 0 005.376 5.386" fill="#ECB22E"/>
              <path d="M0 34.249a5.381 5.381 0 005.376 5.386 5.381 5.381 0 005.376-5.386v-5.387H5.376A5.381 5.381 0 000 34.25m14.336 0v14.364A5.381 5.381 0 0019.712 54a5.381 5.381 0 005.376-5.387V34.25a5.381 5.381 0 00-5.376-5.387 5.381 5.381 0 00-5.376 5.387" fill="#E01E5A"/>
            </g>
          </svg>
          {loading ? "Redirecting..." : "Sign in with Slack"}
        </button>
      </div>
    </div>
  );
}
