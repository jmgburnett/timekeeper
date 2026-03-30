"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./auth-context";
import { Sidebar } from "./sidebar";

// Admin-only routes
const ADMIN_ROUTES = ["/", "/customers", "/capabilities", "/participants", "/settings"];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not logged in → go to login (unless already there)
    if (!user && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    // Logged in but on login page → redirect
    if (user && pathname === "/login") {
      router.replace(user.isAdmin ? "/" : "/entry");
      return;
    }

    // Employee trying to access admin route → redirect to entry
    if (user && !user.isAdmin && ADMIN_ROUTES.includes(pathname)) {
      router.replace("/entry");
      return;
    }
  }, [user, loading, pathname, router]);

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

  // Not logged in, waiting for redirect
  if (!user) return null;

  // Employee on admin route, waiting for redirect
  if (!user.isAdmin && ADMIN_ROUTES.includes(pathname)) return null;

  // Authenticated layout with sidebar
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">{children}</main>
    </div>
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
