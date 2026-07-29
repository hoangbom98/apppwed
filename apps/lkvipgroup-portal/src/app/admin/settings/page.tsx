"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Save,
  Plus,
  Trash2,
  Building2,
  MessageCircle,
  Share2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";

interface SocialLink {
  platform: string;
  url: string;
}

interface SiteSettingsData {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  googleMap: string;
  whatsapp: string;
  socialLinks: SocialLink[];
  footer: string;
  logo: string;
  favicon: string;
}

const socialPlatforms = ["LinkedIn", "Instagram", "Facebook", "X (Twitter)", "YouTube", "TikTok", "Threads"];

const sections = [
  { key: "company", icon: Building2, label: "Company Information" },
  { key: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
  { key: "social", icon: Share2, label: "Social Media Links" },
  { key: "footer", icon: FileText, label: "Footer Content" },
  { key: "media", icon: ImageIcon, label: "Logo & Favicon" },
];

export default function SettingsPage() {
  const [data, setData] = useState<SiteSettingsData | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("company");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then(setData);
  }, []);

  function update<K extends keyof SiteSettingsData>(key: K, value: SiteSettingsData[K]) {
    setData((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function updateSocial(index: number, field: "platform" | "url", value: string) {
    setData((prev) => {
      if (!prev) return prev;
      const links = [...prev.socialLinks];
      links[index] = { ...links[index], [field]: value };
      return { ...prev, socialLinks: links };
    });
  }

  function addSocial() {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, socialLinks: [...prev.socialLinks, { platform: "", url: "" }] };
    });
  }

  function removeSocial(index: number) {
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, socialLinks: prev.socialLinks.filter((_, i) => i !== index) };
    });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");
      if (result.url) update("logo", result.url);
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");
      if (result.url) update("favicon", result.url);
      toast.success("Favicon uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function handleSave() {
    if (!data) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  function SectionNav() {
    return (
      <div className="flex gap-1 overflow-x-auto pb-1">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors rounded-md ${
                activeSection === s.key
                  ? "text-fortress-gold bg-fortress-gold/10 border-b-2 border-fortress-gold"
                  : "text-fortress-silver hover:text-fortress-ivory"
              }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#03080e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-fortress-gold border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03080e] flex selection:bg-fortress-gold/20 selection:text-fortress-champagne font-sans">
      <AdminSidebar active="Settings" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen relative">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-fortress-gold/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fortress-navy/50 rounded-full blur-[150px] pointer-events-none" />
        
        <AdminNavbar title="Settings" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-400 text-sm">General website configuration</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-fortress-gold text-fortress-navy text-sm font-bold hover:bg-fortress-champagne transition-colors disabled:opacity-50 rounded-lg">
                <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="md:hidden mb-4 bg-fortress-navy border border-white/5 rounded-lg">
            <SectionNav />
          </div>

          <div className="flex gap-5">
            <div className="hidden md:block w-44 shrink-0">
              <div className="bg-fortress-navy border-t-2 border-t-fortress-gold/30 rounded-lg sticky top-4">
                <div className="flex flex-col gap-0.5 p-2">
                  {sections.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setActiveSection(s.key)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-left transition-all rounded-md ${
                        activeSection === s.key
                          ? "text-fortress-gold bg-fortress-gold/10 border-l-2 border-fortress-gold"
                          : "text-fortress-silver hover:text-fortress-ivory hover:bg-fortress-deep border-l-2 border-transparent"
                      }`}
                    >
                      <s.icon className="w-3.5 h-3.5 shrink-0" />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-5">
              {activeSection === "company" && (
                <div className="bg-fortress-navy border-t-2 border-t-fortress-gold/30 p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <Building2 className="w-5 h-5 text-fortress-gold" />
                    <h2 className="text-sm font-bold text-fortress-ivory tracking-wide">Company Information</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-fortress-silver text-xs font-medium mb-1.5 tracking-wide">Company Name</label>
                      <input type="text" value={data.companyName} onChange={(e) => update("companyName", e.target.value)} className="w-full bg-fortress-deep border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/50 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-fortress-silver text-xs font-medium mb-1.5 tracking-wide">Phone Number</label>
                      <input type="text" value={data.phone} onChange={(e) => update("phone", e.target.value)} className="w-full bg-fortress-deep border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/50 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-fortress-silver text-xs font-medium mb-1.5 tracking-wide">Email Address</label>
                      <input type="email" value={data.email} onChange={(e) => update("email", e.target.value)} className="w-full bg-fortress-deep border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/50 rounded-lg" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-fortress-silver text-xs font-medium mb-1.5 tracking-wide">Office Address</label>
                      <input type="text" value={data.address} onChange={(e) => update("address", e.target.value)} className="w-full bg-fortress-deep border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/50 rounded-lg" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-fortress-silver text-xs font-medium mb-1.5 tracking-wide">Google Maps Embed URL</label>
                      <input type="text" value={data.googleMap} onChange={(e) => update("googleMap", e.target.value)} className="w-full bg-fortress-deep border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/50 rounded-lg" />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "whatsapp" && (
                <div className="bg-fortress-navy border-t-2 border-t-fortress-gold/30 p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <MessageCircle className="w-5 h-5 text-fortress-gold" />
                    <h2 className="text-sm font-bold text-fortress-ivory tracking-wide">WhatsApp</h2>
                  </div>
                  <div>
                    <label className="block text-fortress-silver text-xs font-medium mb-1.5 tracking-wide">WhatsApp Number</label>
                    <p className="text-fortress-silver/40 text-[10px] mb-2">Digits only, e.g. 971500000000</p>
                    <input type="text" value={data.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className="w-full bg-fortress-deep border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/50 rounded-lg" />
                  </div>
                </div>
              )}

              {activeSection === "social" && (
                <div className="bg-fortress-navy border-t-2 border-t-fortress-gold/30 p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <Share2 className="w-5 h-5 text-fortress-gold" />
                    <h2 className="text-sm font-bold text-fortress-ivory tracking-wide">Social Media Links</h2>
                  </div>
                  <div className="space-y-2.5">
                    {data.socialLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <select value={link.platform} onChange={(e) => updateSocial(i, "platform", e.target.value)} className="w-40 bg-fortress-deep border border-white/10 text-fortress-ivory text-sm px-3 py-3 focus:outline-none focus:border-fortress-gold/50 rounded-lg">
                          <option value="">Select...</option>
                          {socialPlatforms.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <input type="text" value={link.url} onChange={(e) => updateSocial(i, "url", e.target.value)} placeholder="https://..." className="flex-1 bg-fortress-deep border border-white/10 text-fortress-ivory text-sm px-3 py-3 focus:outline-none focus:border-fortress-gold/50 rounded-lg" />
                        <button onClick={() => removeSocial(i)} className="p-2 text-fortress-silver/30 hover:text-red-400 transition-colors shrink-0 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button onClick={addSocial} className="flex items-center gap-1.5 text-xs text-fortress-gold hover:text-fortress-champagne transition-colors mt-3 rounded-md"><Plus className="w-3.5 h-3.5" /> Add Social Link</button>
                  </div>
                </div>
              )}

              {activeSection === "footer" && (
                <div className="bg-fortress-navy border-t-2 border-t-fortress-gold/30 p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <FileText className="w-5 h-5 text-fortress-gold" />
                    <h2 className="text-sm font-bold text-fortress-ivory tracking-wide">Footer Content</h2>
                  </div>
                  <div>
                    <label className="block text-fortress-silver text-xs font-medium mb-1.5 tracking-wide">Footer Description</label>
                    <textarea value={data.footer} onChange={(e) => update("footer", e.target.value)} rows={4} className="w-full bg-fortress-deep border border-white/10 text-fortress-ivory text-sm px-4 py-3 focus:outline-none focus:border-fortress-gold/50 resize-none rounded-lg" />
                  </div>
                </div>
              )}

              {activeSection === "media" && (
                <div className="bg-fortress-navy border-t-2 border-t-fortress-gold/30 p-5 rounded-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <ImageIcon className="w-5 h-5 text-fortress-gold" />
                    <h2 className="text-sm font-bold text-fortress-ivory tracking-wide">Logo & Favicon</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-fortress-silver text-xs font-medium mb-2 tracking-wide">Logo</label>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {data.logo && <div className="mb-2 p-4 bg-fortress-deep border border-white/5 flex items-center justify-center rounded-lg"><img src={data.logo} alt="" className="h-12 w-auto object-contain" /></div>}
                      <label className="flex items-center justify-center gap-2 px-4 py-3.5 bg-fortress-deep border border-dashed border-white/10 text-fortress-silver text-xs hover:border-fortress-gold/40 cursor-pointer transition-colors rounded-lg">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        {data.logo ? "Change Logo" : "Upload Logo"}
                      </label>
                    </div>
                    <div>
                      <label className="block text-fortress-silver text-xs font-medium mb-2 tracking-wide">Favicon</label>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {data.favicon && <div className="mb-2 p-4 bg-fortress-deep border border-white/5 flex items-center justify-center rounded-lg"><img src={data.favicon} alt="" className="h-10 w-auto object-contain" /></div>}
                      <label className="flex items-center justify-center gap-2 px-4 py-3.5 bg-fortress-deep border border-dashed border-white/10 text-fortress-silver text-xs hover:border-fortress-gold/40 cursor-pointer transition-colors rounded-lg">
                        <input type="file" accept="image/*" onChange={handleFaviconUpload} className="hidden" />
                        {data.favicon ? "Change Favicon" : "Upload Favicon"}
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
