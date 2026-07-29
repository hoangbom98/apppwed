"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Download,
  Trash2,
  CheckCheck,
  Mail,
  Phone,
  Building2,
  TrendingUp,
} from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminNavbar from "@/components/AdminNavbar";

interface EnquiryItem {
  id: string;
  type: "contact" | "submission";
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
  details: {
    phone?: string;
    company?: string;
    investmentRange?: string;
    fileName?: string;
  };
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

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryItem[]>([]);
  const [selected, setSelected] = useState<EnquiryItem | null>(null);
  const [filter, setFilter] = useState<"all" | "contact" | "submission">("all");

  function load() {
    fetch("/api/admin/enquiries")
      .then((r) => r.json())
      .then(setEnquiries);
  }

  useEffect(load, []);

  async function handleMarkRead(id: string) {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Marked as read");
      load();
    } catch {
      toast.error("Failed to update enquiry");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this enquiry?")) return;
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Enquiry deleted");
      setSelected(null);
      load();
    } catch {
      toast.error("Failed to delete enquiry");
    }
  }

  const filtered = enquiries.filter((e) => filter === "all" || e.type === filter);
  const unread = enquiries.filter((e) => !e.read).length;

  return (
    <div className="min-h-screen bg-[#03080e] flex selection:bg-fortress-gold/20 selection:text-fortress-champagne font-sans">
      <AdminSidebar active="Enquiries" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-screen relative">
        <AdminNavbar title="Enquiries" />
        <div className="flex flex-col md:flex-row flex-1 min-h-[calc(100vh-64px)] relative z-10">
        <div className={`w-full md:w-[420px] border-b md:border-b-0 md:border-r border-fortress-gold/10 flex flex-col bg-[#07111D]/80 backdrop-blur-xl ${selected ? "hidden md:flex" : ""}`}>
          <div className="p-4 border-b border-fortress-charcoal">
            <div className="flex items-center justify-between mb-3">
              {unread > 0 && <span className="text-[10px] bg-fortress-gold/15 text-fortress-gold font-bold px-2 py-0.5 rounded-full tracking-wide">{unread} unread</span>}
            </div>
            <div className="flex gap-1 p-1 bg-fortress-deep rounded-lg">
              {(["all", "contact", "submission"] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors tracking-wide rounded-md ${filter === f ? "bg-fortress-navy text-fortress-ivory shadow-sm" : "text-fortress-silver hover:text-fortress-ivory hover:bg-fortress-charcoal"}`}>
                  {f === "all" ? "All" : f === "contact" ? "Contacts" : "Submissions"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-auto space-y-0.5 p-2">
            {filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => setSelected(e)}
                className={`w-full text-left p-3 transition-all rounded-lg ${selected?.id === e.id ? "bg-fortress-navy border-l-2 border-fortress-gold" : "hover:bg-fortress-deep/30 border-l-2 border-transparent"} ${!e.read ? "border-fortress-gold" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm truncate ${selected?.id === e.id ? "font-semibold text-fortress-ivory" : !e.read ? "font-semibold text-fortress-navy" : "font-medium text-fortress-navy/70"}`}>{e.name}</p>
                  <span className="text-[10px] text-fortress-silver whitespace-nowrap">{timeAgo(e.createdAt)}</span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${selected?.id === e.id ? "text-fortress-silver" : "text-fortress-navy/50"}`}>{e.subject}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] uppercase tracking-wider ${selected?.id === e.id ? "text-fortress-silver/60" : "text-fortress-silver"}`}>{e.type}</span>
                  {!e.read && <span className="w-1.5 h-1.5 bg-fortress-gold rounded-full" />}
                </div>
              </button>
            ))}
            {filtered.length === 0 && <p className="text-center text-fortress-silver text-xs py-10">No enquiries found</p>}
          </div>
        </div>

        <div className={`flex-1 p-5 md:p-8 overflow-auto bg-[#03080e] ${!selected ? "hidden md:flex md:items-center md:justify-center" : ""}`}>
          {selected ? (
            <div className="max-w-2xl mx-auto space-y-6 w-full">
              <button onClick={() => setSelected(null)} className="md:hidden flex items-center gap-1.5 text-fortress-silver hover:text-fortress-navy text-xs transition-colors mb-3 rounded-md">
                <svg className="w-3.5 h-3.5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                Back to list
              </button>

              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-fortress-navy tracking-tight">{selected.name}</h2>
                  <a href={`mailto:${selected.email}`} className="text-fortress-gold text-sm hover:text-fortress-champagne inline-flex items-center gap-1.5 mt-1">
                    <Mail className="w-4 h-4" /> {selected.email}
                  </a>
                  <p className="text-fortress-silver text-xs mt-3 capitalize flex items-center gap-2">
                    <span className="px-2 py-1 bg-fortress-deep border border-fortress-charcoal rounded-md text-fortress-silver text-[10px] font-medium tracking-wide">{selected.type}</span>
                    {selected.subject}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-fortress-deep border border-fortress-charcoal rounded-lg p-1">
                  {!selected.read && (
                    <button onClick={() => handleMarkRead(selected.id)} className="p-2 text-fortress-silver hover:text-fortress-champagne transition-colors rounded-md hover:bg-fortress-charcoal" title="Mark as read">
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(selected.id)} className="p-2 text-fortress-silver hover:text-fortress-champagne transition-colors rounded-md hover:bg-fortress-charcoal" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {selected.details?.phone && (
                  <div className="flex items-center gap-2 text-xs text-fortress-silver bg-fortress-deep border border-fortress-charcoal rounded-lg px-3 py-2">
                    <Phone className="w-3.5 h-3.5 text-fortress-gold" />
                    <span className="text-fortress-ivory font-medium">{selected.details.phone}</span>
                  </div>
                )}
                {selected.details?.company && (
                  <div className="flex items-center gap-2 text-xs text-fortress-silver bg-fortress-deep border border-fortress-charcoal rounded-lg px-3 py-2">
                    <Building2 className="w-3.5 h-3.5 text-fortress-gold" />
                    <span className="text-fortress-ivory font-medium">{selected.details.company}</span>
                  </div>
                )}
                {selected.details?.investmentRange && (
                  <div className="flex items-center gap-2 text-xs text-fortress-silver bg-fortress-deep border border-fortress-charcoal rounded-lg px-3 py-2">
                    <TrendingUp className="w-3.5 h-3.5 text-fortress-gold" />
                    <span className="text-fortress-ivory font-medium">{selected.details.investmentRange}</span>
                  </div>
                )}
              </div>

              <div className="bg-fortress-navy border border-fortress-charcoal rounded-xl p-6">
                <p className="text-fortress-silver text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>

              {selected.details?.fileName && (
                <div className="flex items-center gap-3 p-4 bg-fortress-deep border border-fortress-charcoal rounded-xl hover:border-fortress-gold/30 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-fortress-navy flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4 text-fortress-gold" />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-fortress-ivory">{selected.details.fileName}</span>
                    <span className="block text-xs text-fortress-silver/60 mt-0.5">Uploaded document</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center max-w-sm mx-auto">
              <div className="w-16 h-16 bg-fortress-deep border border-fortress-charcoal rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-fortress-gold/40" />
              </div>
              <h3 className="text-fortress-navy font-medium mb-1">No enquiry selected</h3>
              <p className="text-fortress-silver text-sm">Select an enquiry from the list to view its details</p>
            </div>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}
