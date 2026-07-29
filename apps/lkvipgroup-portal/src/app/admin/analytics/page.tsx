"use client";

import { useEffect, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";
import {
  BarChart3,
  TrendingUp,
  MessageCircle,
  Newspaper,
  Users,
  FileText,
  CheckCircle2,
  Circle,
  Mail,
  RefreshCw,
} from "lucide-react";

interface AnalyticsSummary {
  totalEnquiries: number;
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  newEnquiries: number;
  contactCount: number;
  submissionCount: number;
}

interface TrendPoint {
  day: string;
  count: number;
}

interface CategoryStat {
  category: string;
  count: number;
}

interface TypeStat {
  type: string;
  count: number;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  trend: TrendPoint[];
  blogsByCategory: CategoryStat[];
  enquiriesByType: TypeStat[];
}

const TYPE_COLORS: Record<string, string> = {
  "Contact": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "Investment Opportunity": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "Business Acquisition": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "Joint Venture": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "Strategic Partnership": "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

/* ─── Simple Bar component ───────────────────────────────────── */
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ─── Sparkline SVG ──────────────────────────────────────────── */
function Sparkline({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) return <p className="text-xs text-fortress-silver/30 py-4 text-center">No trend data for the last 30 days.</p>;
  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 520;
  const H = 80;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - (d.count / max) * (H - 8);
    return `${x},${y}`;
  });
  const polyline = pts.join(" ");
  const area = `${pts[0].split(",")[0]},${H} ` + polyline + ` ${pts[pts.length - 1].split(",")[0]},${H}`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 80 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A24A" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#C9A24A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#sparkGrad)" />
        <polyline points={polyline} fill="none" stroke="#C9A24A" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-fortress-silver/30">{data[0]?.day}</span>
        <span className="text-[9px] text-fortress-silver/30">{data[data.length - 1]?.day}</span>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="min-h-screen bg-[#03080e] flex selection:bg-fortress-gold/20 selection:text-fortress-champagne font-sans">
      <AdminSidebar active="Analytics" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen relative">
        {/* Ambient glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fortress-gold/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

        <AdminNavbar title="Analytics" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-fortress-ivory tracking-tight">Platform Analytics</h1>
              <p className="text-fortress-silver/50 text-sm mt-0.5">Overview of content & enquiry performance</p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="p-2.5 border border-white/10 text-fortress-silver/50 hover:text-fortress-gold hover:border-fortress-gold/30 transition-all rounded-lg disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading || !data ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Enquiries", value: data.summary.totalEnquiries, icon: MessageCircle, color: "text-blue-400", bg: "bg-blue-500/10" },
                  { label: "New (Unread)",    value: data.summary.newEnquiries,   icon: Mail,          color: "text-red-400",  bg: "bg-red-500/10" },
                  { label: "Total Articles",  value: data.summary.totalBlogs,     icon: Newspaper,     color: "text-fortress-gold", bg: "bg-fortress-gold/10" },
                  { label: "Published",       value: data.summary.publishedBlogs, icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "Drafts",          value: data.summary.draftBlogs,     icon: Circle,        color: "text-amber-400", bg: "bg-amber-500/10" },
                  { label: "Contacts",        value: data.summary.contactCount,   icon: Users,         color: "text-purple-400", bg: "bg-purple-500/10" },
                  { label: "Submissions",     value: data.summary.submissionCount,icon: TrendingUp,    color: "text-pink-400",  bg: "bg-pink-500/10" },
                  { label: "Content Pages",   value: 9,                           icon: FileText,      color: "text-cyan-400",  bg: "bg-cyan-500/10" },
                ].map((s) => (
                  <div key={s.label} className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center ${s.color} shrink-0`}>
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-fortress-ivory">{s.value}</p>
                      <p className="text-[11px] text-fortress-silver/40">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trend + breakdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Enquiry Trend */}
                <div className="lg:col-span-2 bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-fortress-gold/10 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-fortress-gold" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-fortress-ivory">Enquiry Trend</h2>
                      <p className="text-[11px] text-fortress-silver/40">Daily enquiries — last 30 days</p>
                    </div>
                  </div>
                  <Sparkline data={data.trend} />
                </div>

                {/* Enquiries by Type */}
                <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-fortress-ivory">Enquiry Types</h2>
                      <p className="text-[11px] text-fortress-silver/40">All time breakdown</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {data.enquiriesByType.length === 0 ? (
                      <p className="text-xs text-fortress-silver/30 text-center py-4">No enquiries yet</p>
                    ) : (
                      (() => {
                        const maxVal = Math.max(...data.enquiriesByType.map((e) => e.count));
                        return data.enquiriesByType.map((e) => (
                          <div key={e.type} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-full ${TYPE_COLORS[e.type] ?? "bg-white/5 text-fortress-silver border-white/10"}`}>{e.type}</span>
                              <span className="text-xs font-bold text-fortress-ivory">{e.count}</span>
                            </div>
                            <MiniBar value={e.count} max={maxVal} color="bg-fortress-gold/60" />
                          </div>
                        ));
                      })()
                    )}
                  </div>
                </div>
              </div>

              {/* Blog Categories */}
              <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                    <Newspaper className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-fortress-ivory">Articles by Category</h2>
                    <p className="text-[11px] text-fortress-silver/40">Content distribution</p>
                  </div>
                </div>
                {data.blogsByCategory.length === 0 ? (
                  <p className="text-xs text-fortress-silver/30 text-center py-4">No articles yet</p>
                ) : (
                  (() => {
                    const maxVal = Math.max(...data.blogsByCategory.map((b) => b.count));
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.blogsByCategory.map((b) => (
                          <div key={b.category} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between mb-1">
                                <span className="text-xs text-fortress-silver/70 truncate">{b.category}</span>
                                <span className="text-xs font-bold text-fortress-ivory ml-2 shrink-0">{b.count}</span>
                              </div>
                              <MiniBar value={b.count} max={maxVal} color="bg-emerald-400/60" />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
