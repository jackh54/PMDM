"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setApiToken } from "@/lib/api";

const AuthContext = createContext(null);
const KEY = "pmdm.token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = globalThis.localStorage?.getItem(KEY);
    if (saved) {
      setToken(saved);
      setApiToken(saved);
    }
    setReady(true);
  }, []);

  const value = useMemo(
    () => ({
      token,
      ready,
      isAuthed: Boolean(token),
      async login(username, password) {
        const { data } = await api.post("/auth/login", { username, password });
        globalThis.localStorage?.setItem(KEY, data.token);
        setToken(data.token);
        setApiToken(data.token);
      },
      logout() {
        globalThis.localStorage?.removeItem(KEY);
        setToken(null);
        setApiToken(null);
        router.push("/login");
      }
    }),
    [token, ready, router]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
