"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Trash2,
  Eye,
  Globe,
  ImageIcon,
  Tag,
  Clock,
  AlertCircle,
  Upload,
  X,
  FileText,
  Settings2,
  Layers,
  AlertTriangle,
  ImageOff,
  ChevronDown,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";
import RichTextEditor from "@/components/RichTextEditor";

const categories = [
  "Real Estate", "Business Acquisitions", "Private Equity", "AI & Technology",
  "Digital Assets & Blockchain", "Hospitality", "Trading & Distribution",
  "Market Insights", "Company News", "Strategic Investment Management",
];

type Tab = "content" | "seo" | "settings";

/* ─── Delete Confirmation Modal ──────────────────────────────── */
function DeleteModal({
  title,
  featuredImage,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  featuredImage: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#07111D] border border-red-500/20 rounded-2xl shadow-2xl shadow-black/60 w-full max-w-md p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-fortress-silver/40 hover:text-fortress-ivory transition-colors rounded-lg hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-fortress-ivory mb-1">Delete Article?</h2>
        <p className="text-fortress-silver/50 text-sm mb-4 leading-relaxed">
          This will permanently delete{" "}
          <span className="text-fortress-ivory font-semibold">&ldquo;{title}&rdquo;</span>.
          This action cannot be undone.
        </p>
        <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl mb-5">
          <div className="relative w-14 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-white/5">
            {featuredImage ? (
              <Image src={featuredImage} alt="" fill className="object-cover" sizes="56px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageOff className="w-4 h-4 text-fortress-silver/30" />
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-fortress-ivory truncate">{title || "Untitled"}</p>
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

/* ─── Main Editor Component ──────────────────────────────────── */
export default function ArticleEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const isNew = slug === "new";

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Market Insights");
  const [readTime, setReadTime] = useState("5 min read");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [imageUploading, setImageUploading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (isNew) {
      setDataLoaded(true);
      return;
    }
    setDataLoaded(false);
    setLoadError(false);
    fetch(`/api/admin/articles/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((a) => {
        if (a.error) throw new Error(a.error);
        setTitle(a.title || "");
        setExcerpt(a.excerpt || "");
        setContent(a.content || "");
        setCategory(a.category || "Market Insights");
        setReadTime(a.readTime || "5 min read");
        setTags(a.tags || []);
        setFeaturedImage(a.featuredImage || "");
        setStatus(a.status || "draft");
        setSeoTitle(a.seo?.title || "");
        setSeoDescription(a.seo?.description || "");
        setDataLoaded(true);
      })
      .catch(() => {
        setLoadError(true);
        setDataLoaded(true);
      });
  }, [slug, isNew]);

  function generateSlug(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const articleSlug = isNew ? generateSlug(title) : slug;
    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: articleSlug, title, excerpt, content, category, tags,
          readTime, featuredImage, status,
          seo: { title: seoTitle || title, description: seoDescription || excerpt },
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save"); }
      toast.success(isNew ? "Article created" : "Article saved");
      if (isNew) router.push(`/admin/blog/${articleSlug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/articles/${slug}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Article deleted");
      router.push("/admin/blog");
    } catch {
      toast.error("Failed to delete article");
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (data.url) setFeaturedImage(data.url);
      toast.success("Image uploaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setImageUploading(false);
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "content", label: "Content", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "seo", label: "SEO", icon: <Globe className="w-3.5 h-3.5" /> },
    { id: "settings", label: "Settings", icon: <Settings2 className="w-3.5 h-3.5" /> },
  ];

  const plainText = content.replace(/<[^>]*>/g, "");
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const charCount = plainText.length;

  // Loading skeleton
  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-[#03080e] flex font-sans">
        <AdminSidebar active="Blog Posts" />
        <main className="flex-1 overflow-y-auto min-h-screen relative">
          <AdminNavbar title="Loading…" />
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-4">
            {[200, 120, 400].map((h, i) => (
              <div key={i} className={`bg-[#07111D]/60 border border-white/5 rounded-xl animate-pulse`} style={{ height: h }} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03080e] flex selection:bg-fortress-gold/20 selection:text-fortress-champagne font-sans">
      <AdminSidebar active="Blog Posts" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen relative">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-fortress-gold/4 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[120px] pointer-events-none" />

        <AdminNavbar title={isNew ? "New Article" : "Edit Article"} />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">

          {/* Load error banner */}
          {loadError && (
            <div className="mb-5 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Article not found or failed to load. <Link href="/admin/blog" className="underline ml-1">Back to list</Link>
            </div>
          )}

          {/* Top bar */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/blog"
                className="flex items-center gap-2 px-3 py-2 border border-white/10 text-fortress-silver/60 hover:text-fortress-gold hover:border-fortress-gold/30 text-xs font-medium transition-all rounded-lg"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Link>
              <div>
                <h1 className="text-lg font-bold text-fortress-ivory tracking-tight">
                  {isNew ? "Create New Article" : "Edit Article"}
                </h1>
                <p className="text-fortress-silver/40 text-xs mt-0.5">
                  {isNew ? "Write and publish a new insight" : `/${slug}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Status toggle */}
              <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setStatus("draft")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${status === "draft" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-fortress-silver/50 hover:text-fortress-ivory"}`}
                >
                  Draft
                </button>
                <button
                  onClick={() => setStatus("published")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${status === "published" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-fortress-silver/50 hover:text-fortress-ivory"}`}
                >
                  Published
                </button>
              </div>

              {!isNew && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-fortress-silver/60 text-sm hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-fortress-gold/10"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {/* Main layout */}
          <div className="flex gap-5 items-start">

            {/* Left: Editor */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Title field */}
              <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl p-5">
                <label className="block text-[10px] font-bold text-fortress-silver/40 uppercase tracking-widest mb-3">Article Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a compelling headline..."
                  className="w-full bg-transparent text-fortress-ivory text-xl font-bold placeholder:text-fortress-silver/20 focus:outline-none border-b border-white/5 pb-3 focus:border-fortress-gold/30 transition-colors"
                />
                {title && (
                  <p className="text-[10px] text-fortress-silver/30 mt-2.5">
                    Slug: <span className="font-mono text-fortress-silver/50">/insights/{isNew ? generateSlug(title) : slug}</span>
                  </p>
                )}
              </div>

              {/* Excerpt */}
              <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold text-fortress-silver/40 uppercase tracking-widest">Excerpt / Summary</label>
                  <span className={`text-[10px] font-medium ${excerpt.length > 200 ? "text-red-400" : "text-fortress-silver/30"}`}>{excerpt.length}/200</span>
                </div>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A brief summary shown in article cards and search results..."
                  rows={3}
                  className="w-full bg-transparent text-fortress-ivory text-sm placeholder:text-fortress-silver/20 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Tabbed panel */}
              <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
                <div className="flex border-b border-white/5 overflow-x-auto scrollbar-none">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 text-xs font-semibold transition-all border-b-2 shrink-0 ${
                        activeTab === t.id
                          ? "border-fortress-gold text-fortress-gold bg-fortress-gold/5"
                          : "border-transparent text-fortress-silver/40 hover:text-fortress-ivory hover:bg-white/5"
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center px-2 sm:px-4 gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-fortress-silver/30 border-b-2 border-transparent shrink-0">
                    <span className="whitespace-nowrap">{wordCount} words</span>
                    <span className="whitespace-nowrap">{charCount} chars</span>
                  </div>
                </div>

                <div className="p-5">
                  {activeTab === "content" && (
                    <RichTextEditor value={content} onChange={setContent} />
                  )}

                  {activeTab === "seo" && (
                    <div className="space-y-5">
                      <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg text-xs text-blue-400/80 flex items-start gap-2">
                        <Globe className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        Controls how your article appears in Google search results. Falls back to title & excerpt if empty.
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-bold text-fortress-silver/40 uppercase tracking-widest">Meta Title</label>
                          <span className={`text-[10px] font-medium ${seoTitle.length > 60 ? "text-red-400" : "text-fortress-silver/30"}`}>{seoTitle.length}/60</span>
                        </div>
                        <input
                          type="text"
                          value={seoTitle}
                          onChange={(e) => setSeoTitle(e.target.value)}
                          placeholder={title || "Enter SEO title…"}
                          className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/40 transition-colors rounded-lg placeholder:text-fortress-silver/20"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[10px] font-bold text-fortress-silver/40 uppercase tracking-widest">Meta Description</label>
                          <span className={`text-[10px] font-medium ${seoDescription.length > 160 ? "text-red-400" : "text-fortress-silver/30"}`}>{seoDescription.length}/160</span>
                        </div>
                        <textarea
                          value={seoDescription}
                          onChange={(e) => setSeoDescription(e.target.value)}
                          placeholder={excerpt || "Enter meta description…"}
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/40 transition-colors resize-none rounded-lg placeholder:text-fortress-silver/20"
                        />
                      </div>
                      {(seoTitle || title) && (
                        <div className="p-4 bg-white/5 border border-white/5 rounded-lg">
                          <p className="text-[10px] font-bold text-fortress-silver/30 uppercase tracking-widest mb-3">Search Preview</p>
                          <p className="text-blue-400 text-base font-medium leading-snug truncate">{seoTitle || title}</p>
                          <p className="text-green-500/70 text-xs mt-0.5">fortressih.com › insights › {isNew ? generateSlug(title) : slug}</p>
                          <p className="text-fortress-silver/50 text-xs mt-1 line-clamp-2 leading-relaxed">{seoDescription || excerpt || "No description provided."}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "settings" && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-fortress-silver/40 uppercase tracking-widest mb-2"><Tag className="w-3 h-3" /> Category</label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/40 transition-colors rounded-lg appearance-none"
                          >
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-[10px] font-bold text-fortress-silver/40 uppercase tracking-widest mb-2"><Clock className="w-3 h-3" /> Read Time</label>
                          <input
                            type="text"
                            value={readTime}
                            onChange={(e) => setReadTime(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/40 transition-colors rounded-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-fortress-silver/40 uppercase tracking-widest mb-2"><Tag className="w-3 h-3" /> Tags</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {tags.map((tag, i) => (
                            <span key={i} className="flex items-center gap-1 text-[11px] bg-fortress-gold/10 text-fortress-gold border border-fortress-gold/20 px-2 py-1 rounded">
                              {tag}
                              <button onClick={() => setTags(tags.filter((_, j) => j !== i))} className="hover:text-red-400 transition-colors">
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && tagInput.trim()) {
                                e.preventDefault();
                                setTags([...tags, tagInput.trim()]);
                                setTagInput("");
                              }
                            }}
                            placeholder="Type a tag and press Enter"
                            className="flex-1 bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/40 transition-colors rounded-lg placeholder:text-fortress-silver/20"
                          />
                          <button
                            onClick={() => {
                              if (tagInput.trim()) {
                                setTags([...tags, tagInput.trim()]);
                                setTagInput("");
                              }
                            }}
                            className="px-4 py-3 bg-fortress-gold/20 text-fortress-gold text-sm font-semibold border border-fortress-gold/30 rounded-lg hover:bg-fortress-gold/30 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                      <div className="sm:hidden">
                        <label className="block text-[10px] font-bold text-fortress-silver/40 uppercase tracking-widest mb-2">Publish Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                          className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/40 transition-colors rounded-lg appearance-none"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">

              {/* Publish */}
              <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-fortress-gold" />
                  <h3 className="text-xs font-bold text-fortress-ivory uppercase tracking-widest">Publish</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === "published" ? "bg-emerald-400" : "bg-amber-400"}`} />
                    <span className="text-sm font-semibold text-fortress-ivory capitalize">{status}</span>
                  </div>
                  <div className="flex gap-2">
                    {(["draft", "published"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all border capitalize ${
                          status === s
                            ? s === "published"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "border-white/10 text-fortress-silver/50 hover:border-white/20 hover:text-fortress-ivory"
                        }`}
                      >
                        {s === "draft" ? "Draft" : "Publish"}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Saving…" : "Save Article"}
                  </button>
                  {!isNew && (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 border border-white/10 text-fortress-silver/50 text-xs font-medium hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Article
                    </button>
                  )}
                </div>
              </div>

              {/* Featured Image */}
              <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-fortress-gold" />
                  <h3 className="text-xs font-bold text-fortress-ivory uppercase tracking-widest">Featured Image</h3>
                </div>
                <div className="p-4">
                  {featuredImage ? (
                    <div className="relative group rounded-lg overflow-hidden border border-white/10 h-40">
                      <Image src={featuredImage} alt="" fill className="object-cover" sizes="288px" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="p-2 bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors" title="Change image">
                          <Upload className="w-4 h-4 text-white" />
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        <button
                          onClick={() => setFeaturedImage("")}
                          className="p-2 bg-white/10 hover:bg-red-500/30 rounded-lg transition-colors"
                          title="Remove image"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-3 h-36 border border-dashed border-white/10 rounded-lg hover:border-fortress-gold/30 cursor-pointer transition-colors bg-white/[0.02] hover:bg-white/5">
                      {imageUploading ? (
                        <div className="w-6 h-6 border-2 border-fortress-gold/40 border-t-fortress-gold rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-fortress-silver/30" />
                          <div className="text-center">
                            <p className="text-xs text-fortress-silver/60 font-medium">Click to upload</p>
                            <p className="text-[10px] text-fortress-silver/30">PNG, JPG, WebP up to 5MB</p>
                          </div>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={imageUploading} />
                    </label>
                  )}
                  {uploadError && (
                    <p className="text-[10px] text-red-400 mt-2">{uploadError}</p>
                  )}
                  {featuredImage && (
                    <p className="text-[10px] text-fortress-silver/30 mt-2 truncate">{featuredImage}</p>
                  )}
                </div>
              </div>

              {/* Category & Read Time */}
              <div className="bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-fortress-gold" />
                  <h3 className="text-xs font-bold text-fortress-ivory uppercase tracking-widest">Category & Metadata</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-3 py-2.5 focus:outline-none focus:border-fortress-gold/40 transition-colors rounded-lg appearance-none cursor-pointer"
                    >
                      {categories.map((c) => <option key={c} value={c} className="bg-[#07111D] text-fortress-ivory">{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fortress-silver/40 pointer-events-none" />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-fortress-silver/40 uppercase tracking-widest mb-2">
                      <Clock className="w-3 h-3" /> Read Time
                    </label>
                    <input
                      type="text"
                      value={readTime}
                      onChange={(e) => setReadTime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-fortress-ivory text-sm px-3 py-2.5 focus:outline-none focus:border-fortress-gold/40 transition-colors rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Preview link */}
              {!isNew && (
                <Link
                  href={`/insights/${slug}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 py-2.5 border border-white/10 text-fortress-silver/50 text-xs font-medium hover:border-fortress-gold/30 hover:text-fortress-gold transition-all rounded-xl"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview Live Article
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteModal
          title={title}
          featuredImage={featuredImage}
          onConfirm={handleDelete}
          onCancel={() => !deleteLoading && setShowDeleteModal(false)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
