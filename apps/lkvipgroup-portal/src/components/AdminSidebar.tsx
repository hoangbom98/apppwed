"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  FileText,
  Newspaper,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Image as ImageIcon,
  Users,
} from "lucide-react";

const links = [
  { label: "Dashboard",  icon: LayoutDashboard, href: "/admin" },
  { label: "Analytics",  icon: BarChart3,        href: "/admin/analytics" },
  { label: "Content",    icon: FileText,          href: "/admin/content" },
  { label: "Blog Posts", icon: Newspaper,         href: "/admin/blog" },
  { label: "Enquiries",  icon: MessageCircle,     href: "/admin/enquiries", badge: true },
  { label: "Media",      icon: ImageIcon,         href: "/admin/media" },
  { label: "Users",      icon: Users,             href: "/admin/users" },
  { label: "Settings",   icon: Settings,          href: "/admin/settings" },
];

interface AdminSidebarProps {
  active: string;
}

export default function AdminSidebar({ active }: AdminSidebarProps) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/admin/enquiries/unread-count")
      .then((r) => r.json())
      .then((d) => setUnread(d.count ?? 0))
      .catch(() => {});
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-40 md:hidden bg-fortress-navy border border-fortress-charcoal p-2 text-fortress-silver hover:text-fortress-champagne shadow-sm rounded-md"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-40 w-64 bg-[#03080e]/95 backdrop-blur-xl flex flex-col shrink-0 h-screen transition-transform duration-300 md:translate-x-0 border-r border-fortress-gold/10 shadow-[4px_0_24px_rgba(0,0,0,0.5)] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-fortress-gold/10">
          <div className="flex items-center justify-between">
            <Image
              src="/large-logo.png"
              alt="Fortress"
              width={200}
              height={56}
              className="h-10 w-auto object-contain brightness-110 drop-shadow-md"
            />
            <button
              onClick={() => setOpen(false)}
              className="md:hidden text-fortress-silver hover:text-fortress-champagne transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-auto">
          {links.map((link) => {
            const isActive = link.label === active;
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-all duration-300 rounded-xl relative group overflow-hidden ${
                  isActive
                    ? "text-fortress-gold font-medium bg-gradient-to-r from-fortress-gold/10 to-transparent border border-fortress-gold/10 shadow-sm"
                    : "text-fortress-silver hover:text-fortress-ivory hover:bg-fortress-gold/5"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-fortress-champagne to-fortress-gold rounded-r-full shadow-[0_0_8px_rgba(201,162,74,0.6)]" />
                )}
                <link.icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                    isActive ? "scale-110" : "group-hover:scale-110 group-hover:text-fortress-gold"
                  }`}
                />
                <span className="tracking-wide flex-1">{link.label}</span>
                {link.badge && unread > 0 && (
                  <span className="text-[10px] font-bold bg-fortress-gold text-fortress-navy px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-fortress-gold/10">
          <Link
            href="/api/admin-logout"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm text-fortress-silver/60 hover:text-fortress-champagne transition-all duration-300 hover:bg-fortress-gold/5 rounded-xl group"
          >
            <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span className="tracking-wide">Sign Out</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
