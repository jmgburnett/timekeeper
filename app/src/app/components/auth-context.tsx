"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface AuthUser {
  participantId: string;
  slackUserId: string;
  name: string;
  email?: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  notLinked: boolean;
  notLinkedEmail?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  notLinked: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const me = useQuery(api.auth_helpers.me, isAuthenticated ? {} : "skip");

  const loading = authLoading || (isAuthenticated && me === undefined);

  let user: AuthUser | null = null;
  let notLinked = false;
  let notLinkedEmail: string | undefined;

  if (me && !me.notLinked) {
    user = {
      participantId: me.participantId,
      slackUserId: me.slackUserId,
      name: me.name,
      email: me.email,
      isAdmin: me.isAdmin,
    };
  } else if (me && me.notLinked) {
    notLinked = true;
    notLinkedEmail = me.email;
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, notLinked, notLinkedEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
