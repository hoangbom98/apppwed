"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface AdminNavbarProps {
  title: string;
}

interface SessionInfo {
  name: string;
  email: string;
  role: string;
}

export default function AdminNavbar({ title }: AdminNavbarProps) {
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    fetch("/api/admin-session")
      .then((r) => r.json())
      .then((d) => {
        if (d?.name) setSession(d);
      })
      .catch(() => {});
  }, []);

  const initials = session?.name
    ? session.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <div className="bg-[#03080e]/80 backdrop-blur-xl border-b border-fortress-gold/10 sticky top-0 z-30 shadow-sm shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 pl-14 md:pl-6">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fortress-ivory to-fortress-silver tracking-tight">
            {title}
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/settings"
              className="p-2.5 text-fortress-silver/70 hover:text-fortress-gold transition-all duration-300 rounded-xl hover:bg-fortress-gold/10 hover:rotate-90"
            >
              <Settings className="w-4 h-4" />
            </Link>
            <div className="pl-4 border-l border-fortress-charcoal flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-fortress-gold to-[#a17e33] rounded-full flex items-center justify-center shadow-lg shadow-fortress-gold/20">
                <span className="text-[11px] font-bold text-fortress-navy">{initials}</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-semibold text-fortress-ivory">
                  {session?.name ?? "Admin"}
                </span>
                <span className="text-[10px] text-fortress-silver/60 capitalize">
                  {session?.role ?? "System"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
