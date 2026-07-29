"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Newspaper,
  Plus,
  Edit3,
  Trash2,
  Search,
  Eye,
  Tag,
  FileText,
  CheckCircle2,
  Circle,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  X,
  ImageOff,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";

interface ArticleItem {
  slug: string;
  title: string;
  category: string;
  status: "draft" | "published";
  updatedAt: string;
  excerpt?: string;
  featuredImage?: string;
}

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

const CAT_COLORS: Record<string, string> = {
  "Real Estate": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Business Acquisitions": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Private Equity": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "AI & Technology": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Digital Assets & Blockchain": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Hospitality": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Trading & Distribution": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Market Insights": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Company News": "bg-red-500/10 text-red-400 border-red-500/20",
  "Strategic Investment Management": "bg-teal-500/10 text-teal-400 border-teal-500/20",
};

/* ─── Delete Confirmation Modal ──────────────────────────────── */
function DeleteModal({
  article,
  onConfirm,
  onCancel,
  loading,
}: {
  article: ArticleItem;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative bg-[#07111D] border border-red-500/20 rounded-2xl shadow-2xl shadow-black/60 w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-fortress-silver/40 hover:text-fortress-ivory transition-colors rounded-lg hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>

        <h2 className="text-lg font-bold text-fortress-ivory mb-1">Delete Article?</h2>
        <p className="text-fortress-silver/50 text-sm mb-4 leading-relaxed">
          This will permanently delete{" "}
          <span className="text-fortress-ivory font-semibold">&ldquo;{article.title}&rdquo;</span>.
          This action cannot be undone.
        </p>

        {/* Article preview in modal */}
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl mb-5">
          {article.featuredImage ? (
            <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0">
              <Image src={article.featuredImage} alt="" fill className="object-cover" sizes="56px" />
            </div>
          ) : (
            <div className="w-14 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
              <ImageOff className="w-4 h-4 text-fortress-silver/30" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-fortress-ivory truncate">{article.title}</p>
            <p className="text-[11px] text-fortress-silver/40 mt-0.5">{article.category}</p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 border border-white/10 text-fortress-silver/70 text-sm font-semibold hover:border-white/20 hover:text-fortress-ivory transition-all rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-500/90 hover:bg-red-500 text-white text-sm font-bold transition-all rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {loading ? "Deleting…" : "Delete Article"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function BlogList() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "draft">("all");
  const [deleteTarget, setDeleteTarget] = useState<ArticleItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/admin/articles")
      .then((r) => r.json())
      .then((data) => { setArticles(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(load, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/articles/${deleteTarget.slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Article deleted");
      load();
    } catch {
      toast.error("Failed to delete article");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  const filtered = articles.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const published = articles.filter((a) => a.status === "published").length;
  const drafts = articles.filter((a) => a.status === "draft").length;

  const stats = [
    { label: "Total Articles", value: articles.length, icon: <FileText className="w-4 h-4" />, color: "text-fortress-gold", bg: "bg-fortress-gold/10" },
    { label: "Published", value: published, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Drafts", value: drafts, icon: <Circle className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Categories", value: new Set(articles.map((a) => a.category)).size, icon: <Tag className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-500/10" },
  ];

  return (
    <div className="min-h-screen bg-[#03080e] flex selection:bg-fortress-gold/20 selection:text-fortress-champagne font-sans">
      <AdminSidebar active="Blog Posts" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen relative">
        {/* Ambient glows */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-fortress-gold/4 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[120px] pointer-events-none" />

        <AdminNavbar title="Blog Posts" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10 space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-fortress-ivory tracking-tight">Content Management</h1>
              <p className="text-fortress-silver/50 text-xs sm:text-sm mt-0.5">Manage and publish your insights & articles</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={load}
                className="p-2.5 border border-white/10 text-fortress-silver/50 hover:text-fortress-gold hover:border-fortress-gold/30 transition-all rounded-lg"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <Link
                href="/admin/blog/new"
                className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-all rounded-lg shadow-lg shadow-fortress-gold/10"
              >
                <Plus className="w-4 h-4" /> New Article
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center ${s.color} shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-fortress-ivory">{s.value}</p>
                  <p className="text-xs text-fortress-silver/50">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table Panel */}
          <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden shadow-2xl shadow-black/30">
            {/* Toolbar */}
            <div className="px-5 py-4 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fortress-silver/40" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 text-fortress-ivory text-sm rounded-lg placeholder:text-fortress-silver/30 focus:outline-none focus:border-fortress-gold/40 transition-colors"
                />
              </div>
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 overflow-x-auto w-full sm:w-auto">
                {(["all", "published", "draft"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterStatus(f)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all capitalize ${
                      filterStatus === f
                        ? "bg-fortress-gold text-fortress-navy shadow"
                        : "text-fortress-silver/50 hover:text-fortress-ivory"
                    }`}
                  >
                    {f === "all" ? `All (${articles.length})` : f === "published" ? `Published (${published})` : `Drafts (${drafts})`}
                  </button>
                ))}
              </div>
            </div>



            {/* Body */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-white/5 rounded-xl overflow-hidden">
                    <div className="aspect-[16/9] bg-white/5" />
                    <div className="p-4 space-y-3">
                      <div className="h-3 bg-white/5 rounded w-1/3" />
                      <div className="h-4 bg-white/5 rounded w-full" />
                      <div className="h-4 bg-white/5 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                  <Newspaper className="w-7 h-7 text-fortress-silver/20" />
                </div>
                <p className="text-fortress-ivory/60 font-medium mb-1">
                  {search || filterStatus !== "all" ? "No articles match your search" : "No articles yet"}
                </p>
                <p className="text-fortress-silver/30 text-sm mb-5">
                  {search || filterStatus !== "all" ? "Try a different search term or filter." : "Create your first insight article."}
                </p>
                {!search && filterStatus === "all" && (
                  <Link href="/admin/blog/new" className="px-4 py-2 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-all rounded-lg">
                    Create First Article
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
                {filtered.map((a) => (
                  <article key={a.slug} className="group bg-white/[0.03] border border-white/5 rounded-xl overflow-hidden hover:border-fortress-gold/30 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 flex flex-col">
                    {/* Image */}
                    <Link href={`/admin/blog/${a.slug}`} className="relative aspect-[16/9] overflow-hidden block">
                      {a.featuredImage ? (
                        <Image src={a.featuredImage} alt={a.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width:640px)100vw,(max-width:1024px)50vw,33vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <ImageOff className="w-8 h-8 text-fortress-silver/20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07111D]/80 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-full backdrop-blur-sm ${CAT_COLORS[a.category] || "bg-white/5 text-fortress-silver border-white/10"}`}>{a.category}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 border rounded-full backdrop-blur-sm ${a.status === "published" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30"}`}>
                          {a.status === "published" ? "Published" : "Draft"}
                        </span>
                      </div>
                    </Link>

                    {/* Body */}
                    <div className="p-4 flex flex-col flex-1">
                      <Link href={`/admin/blog/${a.slug}`}>
                        <h3 className="font-bold text-fortress-ivory text-sm leading-snug mb-1.5 group-hover:text-fortress-gold transition-colors line-clamp-2">{a.title}</h3>
                      </Link>
                      {a.excerpt && <p className="text-[11px] text-fortress-silver/30 leading-relaxed mb-3 line-clamp-2">{a.excerpt}</p>}

                      <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
                        <span className="text-[10px] text-fortress-silver/40">{timeAgo(a.updatedAt)}</span>
                        <div className="flex items-center gap-0.5">
                          <Link href={`/insights/${a.slug}`} target="_blank" className="p-2 sm:p-1.5 text-fortress-silver/30 hover:text-fortress-ivory transition-colors rounded-lg hover:bg-white/5" title="Preview">
                            <ExternalLink className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </Link>
                          <Link href={`/admin/blog/${a.slug}`} className="p-2 sm:p-1.5 text-fortress-silver/30 hover:text-fortress-gold transition-colors rounded-lg hover:bg-fortress-gold/10" title="Edit">
                            <Edit3 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </Link>
                          <button onClick={() => setDeleteTarget(a)} className="p-2 sm:p-1.5 text-fortress-silver/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10" title="Delete">
                            <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Footer */}
            {filtered.length > 0 && (
              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-fortress-silver/30">
                  Showing <span className="text-fortress-ivory font-medium">{filtered.length}</span> of{" "}
                  <span className="text-fortress-ivory font-medium">{articles.length}</span> articles
                </p>
                <div className="flex items-center gap-2 text-xs text-fortress-silver/30">
                  <Eye className="w-3 h-3" />
                  {articles.length > 0 ? `Last updated ${timeAgo(articles[0]?.updatedAt)}` : "—"}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <DeleteModal
          article={deleteTarget}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
