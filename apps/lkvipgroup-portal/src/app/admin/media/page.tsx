"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Copy,
  Image as ImageIcon,
  RefreshCw,
  Search,
  X,
  CheckCircle2,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";

interface MediaItem {
  id: string;
  publicId: string;
  secureUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/media")
      .then((r) => r.json())
      .then((d) => { setMedia(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Upload failed"); }
      }
      toast.success(files.length > 1 ? `${files.length} files uploaded` : "File uploaded");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(item: MediaItem) {
    if (!confirm(`Delete "${item.fileName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/media?id=${item.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("File deleted");
      if (selected === item.id) setSelected(null);
      load();
    } catch {
      toast.error("Failed to delete file");
    }
  }

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id);
      toast.success("URL copied");
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const filtered = media.filter((m) =>
    m.fileName.toLowerCase().includes(search.toLowerCase())
  );
  const selectedItem = media.find((m) => m.id === selected);

  return (
    <div className="min-h-screen bg-[#03080e] flex selection:bg-fortress-gold/20 selection:text-fortress-champagne font-sans">
      <AdminSidebar active="Media" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen relative">
        {/* Ambient */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fortress-gold/5 rounded-full blur-[120px] pointer-events-none" />

        <AdminNavbar title="Media Library" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10 space-y-5">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-fortress-ivory">Media Library</h1>
              <p className="text-fortress-silver/50 text-sm mt-0.5">{media.length} files stored</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={load} disabled={loading} className="p-2.5 border border-white/10 text-fortress-silver/50 hover:text-fortress-gold hover:border-fortress-gold/30 transition-all rounded-lg">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
              <label className="flex items-center gap-2 px-4 py-2.5 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-all rounded-lg cursor-pointer shadow-lg shadow-fortress-gold/10">
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-fortress-navy/30 border-t-fortress-navy rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? "Uploading…" : "Upload Files"}
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Content */}
          <div className="flex gap-5 items-start">
            {/* Grid */}
            <div className="flex-1 min-w-0">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-fortress-silver/40" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 text-fortress-ivory text-sm rounded-lg placeholder:text-fortress-silver/30 focus:outline-none focus:border-fortress-gold/40 transition-colors"
                />
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                    <ImageIcon className="w-7 h-7 text-fortress-silver/20" />
                  </div>
                  <p className="text-fortress-ivory/60 font-medium mb-1">
                    {search ? "No files match your search" : "No media uploaded yet"}
                  </p>
                  <p className="text-fortress-silver/30 text-sm">Upload images to build your media library.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filtered.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelected(selected === item.id ? null : item.id)}
                      className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        selected === item.id
                          ? "border-fortress-gold shadow-lg shadow-fortress-gold/20"
                          : "border-white/5 hover:border-white/20"
                      }`}
                    >
                      <Image
                        src={item.secureUrl}
                        alt={item.fileName}
                        fill
                        className="object-cover"
                        sizes="(max-width:640px)50vw,(max-width:1024px)33vw,20vw"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                        <p className="text-[10px] text-white font-medium truncate w-full">{item.fileName}</p>
                      </div>
                      {selected === item.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-fortress-gold rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-fortress-navy" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selectedItem && (
              <div className="hidden lg:flex flex-col gap-3 w-64 shrink-0 bg-[#07111D]/60 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden">
                <div className="relative aspect-video">
                  <Image
                    src={selectedItem.secureUrl}
                    alt={selectedItem.fileName}
                    fill
                    className="object-cover"
                    sizes="256px"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <button
                    onClick={() => setSelected(null)}
                    className="absolute top-3 right-3 p-1 text-fortress-silver/40 hover:text-fortress-ivory transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div>
                    <p className="text-xs font-bold text-fortress-ivory truncate">{selectedItem.fileName}</p>
                    <p className="text-[10px] text-fortress-silver/40 mt-0.5">{formatBytes(selectedItem.fileSize)} · {timeAgo(selectedItem.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => copyUrl(selectedItem.secureUrl, selectedItem.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-fortress-gold/10 border border-fortress-gold/20 text-fortress-gold text-xs font-semibold hover:bg-fortress-gold/20 transition-colors rounded-lg"
                  >
                    {copied === selectedItem.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied === selectedItem.id ? "Copied!" : "Copy URL"}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedItem)}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-white/10 text-fortress-silver/50 text-xs font-medium hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/5 transition-all rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
