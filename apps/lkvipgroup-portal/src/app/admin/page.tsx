"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";
import {
  Newspaper,
  MessageCircle,
  TrendingUp,
  PlusCircle,
  Edit3,
  ArrowRight,
  Activity,
  ChevronRight,
  FileText,
  BarChart3,
} from "lucide-react";

interface Activity {
  id: string;
  type: "contact" | "submission";
  title: string;
  description: string;
  time: string;
}

interface Stats {
  blogPosts: number;
  totalContacts: number;
  totalSubmissions: number;
  activities: Activity[];
}

const statCards = [
  { key: "blogPosts" as const, label: "Blog Posts", icon: Newspaper },
  { key: "totalContacts" as const, label: "Contact Enquiries", icon: MessageCircle },
  { key: "totalSubmissions" as const, label: "Investment Submissions", icon: TrendingUp },
];

const quickActions = [
  { label: "Create Blog Post", icon: PlusCircle, href: "/admin/blog/new" },
  { label: "Edit Homepage", icon: Edit3, href: "/admin/content/home" },
  { label: "View Enquiries", icon: MessageCircle, href: "/admin/enquiries" },
  { label: "Manage Content", icon: FileText, href: "/admin/content" },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-fortress-gold border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03080e] flex selection:bg-fortress-gold/20 selection:text-fortress-champagne font-sans">
      <AdminSidebar active="Dashboard" />
      
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen relative">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fortress-gold/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fortress-navy/50 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="relative z-10">
          <AdminNavbar title="Dashboard Overview" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
            {/* Header section */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-fortress-ivory tracking-tight mb-2">Welcome back, Admin</h2>
              <p className="text-sm text-fortress-silver/70 font-light">Here&apos;s what&apos;s happening with your platform today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {statCards.map((card) => (
                <div 
                  key={card.key} 
                  className="group relative bg-[#07111D]/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-fortress-gold/10 hover:border-fortress-gold/30 hover:-translate-y-1 transition-all duration-500 shadow-2xl shadow-black/40 hover:shadow-fortress-gold/5"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fortress-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-fortress-deep/80 border border-fortress-gold/10 flex items-center justify-center group-hover:bg-[#0b1b2e] transition-colors duration-300">
                        <card.icon className="w-5 h-5 text-fortress-gold group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <span className="text-fortress-silver/60 text-[10px] uppercase tracking-[0.2em] font-semibold">{card.label}</span>
                    </div>
                    <div>
                      <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-fortress-ivory to-fortress-silver tracking-tight">
                        {stats[card.key]}
                      </p>
                      <p className="text-xs text-fortress-silver/50 mt-2 font-medium">Total registered</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2 relative bg-[#07111D]/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-fortress-charcoal/80 shadow-2xl shadow-black/20 flex flex-col">
                <div className="p-6 border-b border-fortress-charcoal/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-fortress-deep flex items-center justify-center">
                      <Activity className="w-4 h-4 text-fortress-gold" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-fortress-ivory">Recent Activity</h2>
                      <p className="text-xs text-fortress-silver/60">Latest platform updates</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 flex-1">
                  {stats.activities.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-12 opacity-50">
                      <Activity className="w-8 h-8 text-fortress-silver/30 mb-3" />
                      <p className="text-fortress-silver text-sm">No recent activity</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {stats.activities.slice(0, 5).map((a) => (
                        <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-fortress-deep/50 transition-colors cursor-pointer group">
                          <div className="w-10 h-10 rounded-full bg-[#040A13] border border-fortress-charcoal flex items-center justify-center shrink-0 group-hover:border-fortress-gold/30 transition-colors">
                            {a.type === "contact" ? <MessageCircle className="w-4 h-4 text-fortress-champagne" /> : <TrendingUp className="w-4 h-4 text-fortress-champagne" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-fortress-gold/80 bg-fortress-gold/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">{a.type}</span>
                              <p className="text-fortress-ivory text-sm font-medium truncate">{a.title}</p>
                            </div>
                            <p className="text-fortress-silver/60 text-xs truncate capitalize">{a.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-fortress-silver/40 font-medium whitespace-nowrap">{timeAgo(a.time)}</span>
                            <div className="w-7 h-7 rounded-full bg-transparent flex items-center justify-center group-hover:bg-fortress-charcoal transition-colors">
                              <ChevronRight className="w-4 h-4 text-fortress-silver/30 group-hover:text-fortress-gold transition-colors" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="relative bg-[#07111D]/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-fortress-charcoal/80 shadow-2xl shadow-black/20 flex flex-col">
                <div className="p-6 border-b border-fortress-charcoal/50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-fortress-deep flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-fortress-gold" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-fortress-ivory">Quick Actions</h2>
                    <p className="text-xs text-fortress-silver/60">Common tasks</p>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col gap-3">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center justify-between p-4 bg-fortress-deep/30 border border-fortress-charcoal/50 rounded-xl hover:bg-[#0b1b2e] hover:border-fortress-gold/20 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-fortress-navy flex items-center justify-center shadow-inner shadow-black/50 group-hover:bg-[#050C16] transition-colors">
                          <action.icon className="w-4 h-4 text-fortress-silver group-hover:text-fortress-gold transition-colors duration-300" />
                        </div>
                        <span className="text-sm font-medium text-fortress-silver group-hover:text-fortress-ivory transition-colors">{action.label}</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-fortress-silver/30 group-hover:text-fortress-gold transition-all duration-300 group-hover:translate-x-1" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
