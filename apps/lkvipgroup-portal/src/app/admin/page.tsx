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
  CheckCircle2,
  Circle,
  Mail,
  Users,
  ListTodo,
  Layers,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: "contact" | "submission";
  title: string;
  description: string;
  time: string;
}

interface Stats {
  blogPosts: number;
  publishedBlogs?: number;
  draftBlogs?: number;
  totalContacts: number;
  totalSubmissions: number;
  newEnquiries?: number;
  activities: ActivityItem[];
}

const quickActions = [
  { label: "Create Blog Post",  icon: PlusCircle,    href: "/admin/blog/new" },
  { label: "Edit Homepage",     icon: Edit3,          href: "/admin/content/home" },
  { label: "View Enquiries",    icon: MessageCircle,  href: "/admin/enquiries" },
  { label: "Workspace",         icon: ListTodo,       href: "/admin/workspace" },
  { label: "Analytics",         icon: BarChart3,      href: "/admin/analytics" },
  { label: "Manage Users",      icon: Users,          href: "/admin/users" },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AdminDashboard() {
  const [stats, setStats]         = useState<Stats | null>(null);
  const [wsStats, setWsStats]     = useState<WorkspaceStats | null>(null);

  useEffect(() => {
    // Load basic stats
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setStats(d));

    // Load analytics for published/draft breakdown
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((a) => {
        setStats((prev) =>
          prev
            ? {
                ...prev,
                publishedBlogs: a.summary?.publishedBlogs ?? 0,
                draftBlogs: a.summary?.draftBlogs ?? 0,
                newEnquiries: a.summary?.newEnquiries ?? 0,
              }
            : prev
        );
      });

    // Load workspace stats
    fetch("/api/admin/workspace/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setWsStats(d))
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#03080e] flex">
        <AdminSidebar active="Dashboard" />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-fortress-gold border-t-transparent animate-spin rounded-full" />
        </main>
      </div>
    );
  }

  const mainStats = [
    {
      label: "Blog Posts",
      value: stats.blogPosts,
      icon: Newspaper,
      sub: stats.publishedBlogs != null
        ? `${stats.publishedBlogs} published · ${stats.draftBlogs ?? 0} draft`
        : "Total articles",
    },
    {
      label: "Contact Enquiries",
      value: stats.totalContacts,
      icon: MessageCircle,
      sub: stats.newEnquiries != null && stats.newEnquiries > 0
        ? `${stats.newEnquiries} unread`
        : "All-time contacts",
    },
    {
      label: "Investment Submissions",
      value: stats.totalSubmissions,
      icon: TrendingUp,
      sub: "Opportunities & partnerships",
    },
  ];

  const secondaryStats = [
    {
      label: "Published",
      value: stats.publishedBlogs ?? "—",
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Drafts",
      value: stats.draftBlogs ?? "—",
      icon: Circle,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "New Enquiries",
      value: stats.newEnquiries ?? "—",
      icon: Mail,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

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
            {/* Page header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-fortress-ivory tracking-tight mb-1">Welcome back</h2>
              <p className="text-sm text-fortress-silver/70 font-light">
                Here&apos;s what&apos;s happening with your platform today.
              </p>
            </div>

            {/* Primary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
              {mainStats.map((card) => (
                <div
                  key={card.label}
                  className="group relative bg-[#07111D]/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-fortress-gold/10 hover:border-fortress-gold/30 hover:-translate-y-1 transition-all duration-500 shadow-2xl shadow-black/40"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-fortress-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-fortress-deep/80 border border-fortress-gold/10 flex items-center justify-center">
                        <card.icon className="w-5 h-5 text-fortress-gold group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <span className="text-fortress-silver/60 text-[10px] uppercase tracking-[0.15em] font-semibold text-right max-w-[90px] leading-tight">{card.label}</span>
                    </div>
                    <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-fortress-ivory to-fortress-silver tracking-tight">
                      {card.value}
                    </p>
                    <p className="text-xs text-fortress-silver/50 mt-2 font-medium">{card.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Secondary stats row */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {secondaryStats.map((s) => (
                <div key={s.label} className="bg-[#07111D]/50 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center ${s.color} shrink-0`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-fortress-ivory">{s.value}</p>
                    <p className="text-[11px] text-fortress-silver/40">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Workspace Sprint Progress Banner */}
            {wsStats && (wsStats.total > 0 || wsStats.sprintProgress) && (
              <div className="mb-8 bg-[#07111D]/60 backdrop-blur-xl border border-fortress-gold/10 rounded-2xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-fortress-gold/10 border border-fortress-gold/15 flex items-center justify-center">
                        <ListTodo className="w-4 h-4 text-fortress-gold" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-fortress-ivory">
                          {wsStats.sprintProgress ? wsStats.sprintProgress.sprint.name : "Team Workspace"}
                        </p>
                        <p className="text-[11px] text-fortress-silver/40 mt-0.5">
                          {wsStats.inProgress} đang làm · {wsStats.overdue > 0 ? `${wsStats.overdue} quá hạn · ` : ""}{wsStats.total} tổng
                        </p>
                      </div>
                    </div>
                    <Link href="/admin/workspace"
                      className="text-[11px] text-fortress-gold/70 hover:text-fortress-gold transition-colors flex items-center gap-1">
                      Xem workspace <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {wsStats.sprintProgress ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-fortress-silver/50">Tiến độ sprint</span>
                        <span className="text-sm font-bold text-fortress-gold">
                          {wsStats.sprintProgress.progress}% · {wsStats.sprintProgress.done}/{wsStats.sprintProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2.5">
                        <div className="h-2.5 rounded-full bg-gradient-to-r from-fortress-gold to-fortress-champagne transition-all duration-700"
                          style={{ width: `${wsStats.sprintProgress.progress}%` }} />
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Cần làm",    v: wsStats.todo,        c: "text-fortress-silver/70" },
                        { label: "Đang làm",   v: wsStats.inProgress,  c: "text-amber-400" },
                        { label: "Hoàn thành", v: wsStats.done,        c: "text-green-400" },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <p className={`text-2xl font-extrabold ${s.c}`}>{s.v}</p>
                          <p className="text-[10px] text-fortress-silver/40 mt-0.5">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-[#07111D]/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-fortress-charcoal/80 shadow-2xl shadow-black/20 flex flex-col">
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
                  <Link href="/admin/enquiries" className="text-[11px] text-fortress-gold/70 hover:text-fortress-gold transition-colors flex items-center gap-1">
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
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
                        <div
                          key={a.id}
                          className="flex items-center gap-4 p-4 rounded-xl hover:bg-fortress-deep/50 transition-colors cursor-pointer group"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#040A13] border border-fortress-charcoal flex items-center justify-center shrink-0 group-hover:border-fortress-gold/30 transition-colors">
                            {a.type === "contact" ? (
                              <MessageCircle className="w-4 h-4 text-fortress-champagne" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-fortress-champagne" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] text-fortress-gold/80 bg-fortress-gold/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                                {a.type}
                              </span>
                              <p className="text-fortress-ivory text-sm font-medium truncate">{a.title}</p>
                            </div>
                            <p className="text-fortress-silver/60 text-xs truncate capitalize">{a.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-fortress-silver/40 font-medium whitespace-nowrap">
                              {timeAgo(a.time)}
                            </span>
                            <div className="w-7 h-7 rounded-full flex items-center justify-center group-hover:bg-fortress-charcoal transition-colors">
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
              <div className="bg-[#07111D]/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-fortress-charcoal/80 shadow-2xl shadow-black/20 flex flex-col">
                <div className="p-6 border-b border-fortress-charcoal/50 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-fortress-deep flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-fortress-gold" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-fortress-ivory">Quick Actions</h2>
                    <p className="text-xs text-fortress-silver/60">Common tasks</p>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-2.5">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="flex items-center justify-between p-3.5 bg-fortress-deep/30 border border-fortress-charcoal/50 rounded-xl hover:bg-[#0b1b2e] hover:border-fortress-gold/20 transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-fortress-navy flex items-center justify-center shadow-inner shadow-black/50 group-hover:bg-[#050C16] transition-colors">
                          <action.icon className="w-4 h-4 text-fortress-silver group-hover:text-fortress-gold transition-colors duration-300" />
                        </div>
                        <span className="text-sm font-medium text-fortress-silver group-hover:text-fortress-ivory transition-colors">
                          {action.label}
                        </span>
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
