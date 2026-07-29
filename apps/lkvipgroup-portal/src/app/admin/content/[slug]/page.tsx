"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";
import { toast } from "sonner";
import { ArrowLeft, Save, Eye } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";

const pageLabels: Record<string, string> = {
  home: "Home",
  about: "About Us",
  "investment-focus": "Investment Focus",
  "our-approach": "Our Approach",
  "partner-with-us": "Partner With Us",
  contact: "Contact Us",
  "privacy-policy": "Privacy Policy",
  "terms-of-use": "Terms of Use",
  "investment-disclaimer": "Investment Disclaimer",
};

export default function PageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/content?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setTitle(data.title || "");
        setContent(data.content || "");
      });
  }, [slug]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, title, content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Page saved");
    } catch {
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#03080e] flex selection:bg-fortress-gold/20 selection:text-fortress-champagne font-sans">
      <AdminSidebar active="Content" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen relative">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fortress-gold/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fortress-navy/50 rounded-full blur-[150px] pointer-events-none" />
        
        <AdminNavbar title={pageLabels[slug] || slug} />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Link href="/admin/content" className="flex items-center gap-1.5 text-fortress-silver/50 hover:text-fortress-gold text-xs transition-colors mb-2">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Content
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-colors disabled:opacity-50 rounded-lg"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-fortress-navy border-t-2 border-t-fortress-gold/30 p-5 rounded-lg">
              <label className="block text-fortress-silver text-xs font-medium mb-2 tracking-wide">Page Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-fortress-deep border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/50 transition-colors rounded-lg"
              />
            </div>

            <div className="bg-fortress-navy border-t-2 border-t-fortress-gold/30 p-5 rounded-lg">
              <label className="block text-fortress-silver text-xs font-medium mb-2 tracking-wide">Content</label>
              <RichTextEditor value={content} onChange={setContent} />
            </div>

            <div className="bg-fortress-navy border-t-2 border-t-fortress-gold/30 p-5 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-fortress-gold" />
                <label className="text-fortress-silver text-xs font-medium tracking-wide">Preview</label>
              </div>
              <div className="border border-white/5 p-5 bg-fortress-deep rounded-lg">
                <div className="prose max-w-none text-fortress-ivory text-sm" dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
