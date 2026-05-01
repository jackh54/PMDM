"use client";

import { AuthProvider } from "@/lib/auth-context";

export default function AuthenticatedLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
