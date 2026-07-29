"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";
import { FileText, ChevronRight } from "lucide-react";

interface PageItem {
  slug: string;
  title: string;
  updatedAt: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ContentList() {
  const [pages, setPages] = useState<PageItem[]>([]);

  useEffect(() => {
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then(setPages);
  }, []);

  return (
    <div className="min-h-screen bg-[#03080e] flex selection:bg-fortress-gold/20 selection:text-fortress-champagne font-sans">
      <AdminSidebar active="Content" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen relative">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fortress-gold/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fortress-navy/50 rounded-full blur-[150px] pointer-events-none" />
        
        <AdminNavbar title="Content Management" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 relative z-10">
          <div className="mb-6">
            <p className="text-fortress-silver text-sm">Manage all static website pages</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map((page) => (
              <Link
                key={page.slug}
                href={`/admin/content/${page.slug}`}
                className="flex flex-col p-6 bg-[#07111D]/80 backdrop-blur-xl border border-fortress-gold/10 hover:border-fortress-gold/30 hover:-translate-y-1 shadow-xl shadow-black/20 transition-all duration-300 group rounded-2xl"
              >
                <div className="w-10 h-10 bg-fortress-deep flex items-center justify-center rounded-lg mb-4">
                  <FileText className="w-4 h-4 text-fortress-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-fortress-ivory group-hover:text-fortress-gold transition-colors">{page.title}</p>
                  <p className="text-[11px] text-fortress-silver/40 mt-1">
                    Updated {timeAgo(page.updatedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-fortress-charcoal">
                  <span className="text-xs text-fortress-silver/30 group-hover:text-fortress-gold/60 transition-colors">Edit</span>
                  <ChevronRight className="w-3.5 h-3.5 text-fortress-silver/20 group-hover:text-fortress-gold/50 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
