import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { roleCanAccess, type RoleCode } from "@contracts/types";

export interface SessionUser {
  id: number;
  username: string;
  displayName: string;
  role: RoleCode;
}

interface AuthCtx {
  user: SessionUser | null;
  login: (u: SessionUser) => void;
  logout: () => void;
  canAccess: (moduleKey: string) => boolean;
  canEdit: boolean;
  canDelete: boolean;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "maslat_babil_session";

const EDIT_ROLES: RoleCode[] = ["admin", "manager", "data_entry", "lawyer"];
const DELETE_ROLES: RoleCode[] = ["admin", "manager"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as SessionUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem(KEY, JSON.stringify(user));
    else localStorage.removeItem(KEY);
  }, [user]);

  return (
    <Ctx.Provider
      value={{
        user,
        login: setUser,
        logout: () => setUser(null),
        canAccess: (m) => (user ? roleCanAccess(user.role, m) : false),
        canEdit: !!user && EDIT_ROLES.includes(user.role),
        canDelete: !!user && DELETE_ROLES.includes(user.role),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth خارج AuthProvider");
  return ctx;
}
