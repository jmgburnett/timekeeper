"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { AuthProvider, useAuth } from "./auth-context";
import { Sidebar } from "./sidebar";

// Admin-only routes
const ADMIN_ROUTES = ["/", "/customers", "/capabilities", "/participants", "/settings"];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated, notLinked, notLinkedEmail } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not authenticated → go to login
    if (!isAuthenticated && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    // Authenticated but on login page → redirect
    if (isAuthenticated && !notLinked && user && pathname === "/login") {
      router.replace(user.isAdmin ? "/" : "/entry");
      return;
    }

    // Employee trying to access admin route → redirect to entry
    if (user && !user.isAdmin && ADMIN_ROUTES.includes(pathname)) {
      router.replace("/entry");
      return;
    }
  }, [user, loading, isAuthenticated, notLinked, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  // Login page gets no sidebar
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Not authenticated, waiting for redirect
  if (!isAuthenticated) return null;

  // Authenticated but no participant record
  if (notLinked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg border border-gray-200 p-8 w-full max-w-sm shadow-sm text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">⏱ Timekeeper</h1>
          <p className="text-sm text-gray-600 mb-4">
            You&apos;re signed in as <strong>{notLinkedEmail}</strong>, but there&apos;s no participant account linked to this email.
          </p>
          <p className="text-sm text-gray-500">
            Ask your admin to add you as a participant with this email address.
          </p>
          <SignOutButton />
        </div>
      </div>
    );
  }

  // Employee on admin route, waiting for redirect
  if (user && !user.isAdmin && ADMIN_ROUTES.includes(pathname)) return null;

  // Not linked to participant
  if (!user) return null;

  // Authenticated layout with sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}

function SignOutButton() {
  const { signOut } = useAuthActions();
  return (
    <button
      onClick={() => signOut()}
      className="mt-4 text-sm text-blue-600 hover:underline"
    >
      Sign out
    </button>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
