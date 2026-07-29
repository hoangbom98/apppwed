"use client";

import { useAuthStore } from "@/store/authStore";
import { redirect } from "next/navigation";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerLayoutInner>{children}</CustomerLayoutInner>;
}

function CustomerLayoutInner({ children }: { children: React.ReactNode }) {
  // Note: actual auth guard is in middleware.ts for server-side redirect
  // This is a client-side fallback
  return <>{children}</>;
}
