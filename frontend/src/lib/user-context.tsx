"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";
import type { User } from "./types";

export const DEMO_USERS: User[] = [
  { username: "maryam", role: "employee" },
  { username: "hossein", role: "employee" },
  { username: "it_admin", role: "it" },
];

const STORAGE_KEY = "demo-user";

interface UserCtx {
  users: User[];
  current: User | null;
  setUsername: (username: string) => void;
  /** True while the user list is being fetched from the backend. */
  loadingUsers: boolean;
}

const Ctx = createContext<UserCtx | null>(null);

export function UserProvider({ children, initialUsers }: { children: React.ReactNode; initialUsers?: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers ?? DEMO_USERS);
  const [username, setUsernameState] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(!initialUsers);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setUsernameState(saved || (initialUsers ?? DEMO_USERS)[0].username);
    if (initialUsers) return;
    api
      .users()
      .then((list) => list.length && setUsers(list))
      .catch(() => {
        /* backend unreachable: keep demo users */
      })
      .finally(() => setLoadingUsers(false));
  }, [initialUsers]);

  const setUsername = useCallback((u: string) => {
    window.localStorage.setItem(STORAGE_KEY, u);
    setUsernameState(u);
  }, []);

  const current = users.find((u) => u.username === username) ?? null;
  return <Ctx.Provider value={{ users, current, setUsername, loadingUsers }}>{children}</Ctx.Provider>;
}

export function useUser(): UserCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUser must be used inside UserProvider");
  return v;
}
