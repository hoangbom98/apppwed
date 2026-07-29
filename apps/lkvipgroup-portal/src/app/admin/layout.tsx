import { requireAuth } from "@/lib/auth-utils";
import type { Metadata } from "next";
import AdminProviders from "./AdminProviders";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  return <AdminProviders>{children}</AdminProviders>;
}
