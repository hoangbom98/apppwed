import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import {
  MessageSquare,
  Calendar,
  Search as SearchIcon,
  Mail,
  Phone as PhoneIcon,
  Trash2,
  CheckCircle2,
  Building2,
  Download,
  Filter,
  DollarSign,
  ChevronRight,
  Inbox,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Inquiry {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  budget?: string;
  propertyTitle?: string;
  createdAt: string;
  status?: string;
}

const ManageInquiries = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [propertyList, setPropertyList] = useState<string[]>([]);
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(
    null,
  );

  const fetchInquiries = async () => {
    try {
      const { data } = await api.get("/api/dashboard/recent-messages");
      const mapped = (data.messages || []).map((m: any) => ({
        ...m,
        id: m._id || m.id,
      }));
      setInquiries(mapped);

      const titles = Array.from(
        new Set(
          mapped
            .map((m: any) => m.propertyTitle)
            .filter((t: any) => t !== undefined && t !== ""),
        ),
      ) as string[];
      setPropertyList(titles);

      // Auto-select first active if available
      if (mapped.length > 0) {
        setSelectedInquiryId(mapped[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch inquiries", err);
      toast.error("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (filteredInquiries.length === 0) {
      toast.error("No leads to export");
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Phone",
      "Budget",
      "Property",
      "Message",
      "Status",
      "Date",
    ];
    const rows = filteredInquiries.map((i) => [
      i.name,
      i.email,
      i.phone,
      i.budget || "N/A",
      i.propertyTitle || "General",
      `"${i.message.replace(/"/g, '""')}"`,
      i.status || "new",
      new Date(i.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `dubai-dreams-leads-${new Date().toISOString().split("T")[0]}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Leads exported successfully");
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.patch(`/api/dashboard/inquiry/${id}/status`, {
        data: { status },
      });
      toast.success(`Inquiry marked as ${status}`);
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status } : inq)),
      );
      if (status === "archived") {
        setSelectedInquiryId(null);
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const filteredInquiries = inquiries.filter(
    (i) =>
      i.status !== "archived" &&
      (propertyFilter === "all" || i.propertyTitle === propertyFilter) &&
      (i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.email.toLowerCase().includes(search.toLowerCase()) ||
        (i.propertyTitle &&
          i.propertyTitle.toLowerCase().includes(search.toLowerCase()))),
  );

  const selectedInquiry = inquiries.find((i) => i.id === selectedInquiryId);

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground font-title">
            Lead CRM Hub
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            Manage your client pipeline and property inquiries efficiently.
          </p>
        </div>
        {!loading && (
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-muted/20 rounded-lg border border-border flex items-center justify-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/70">
                Total Leads
              </span>
              <span className="text-sm font-display font-bold text-foreground bg-muted/30 px-2 py-0.5 rounded-md">
                {filteredInquiries.length}
              </span>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-1.5 rounded-lg bg-gold text-white font-display font-bold text-[10px] uppercase tracking-widest hover:bg-gold/90 transition-all flex items-center gap-2 active:scale-95 shadow-md shadow-gold/20"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        )}
      </div>

      <div className="bg-background rounded-3xl border border-border shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[70vh]">
        {/* Left Pane - Inbox List */}
        <div className="w-full lg:w-96 flex flex-col border-r border-border bg-muted/5">
          <div className="p-4 border-b border-border space-y-4 bg-background z-10">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search leads..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-muted/30 border border-transparent focus:border-gold focus:bg-background font-body text-sm outline-none transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {propertyList.length > 0 && (
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/70" />
                <select
                  value={propertyFilter}
                  onChange={(e) => setPropertyFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-muted/30 border border-transparent focus:border-gold focus:bg-background font-body text-sm outline-none transition-all appearance-none cursor-pointer text-ellipsis overflow-hidden"
                >
                  <option value="all">All Properties</option>
                  {propertyList.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-[300px] lg:min-h-0 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm">Syncing pipeline...</p>
              </div>
            ) : filteredInquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 opacity-60">
                <Inbox className="w-12 h-12 mb-4" />
                <p className="font-display font-medium text-center">
                  Inbox is empty
                </p>
                <p className="text-xs text-center mt-2">
                  No matching leads found.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredInquiries.map((inquiry) => {
                  const isSelected = selectedInquiryId === inquiry.id;
                  return (
                    <div
                      key={inquiry.id}
                      onClick={() => setSelectedInquiryId(inquiry.id)}
                      className={`p-4 cursor-pointer transition-all border-l-4 ${
                        isSelected
                          ? "bg-gold/5 border-l-gold"
                          : "bg-transparent border-l-transparent hover:bg-muted/10 hover:border-l-gold/30"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4
                          className={`font-display font-bold text-sm ${isSelected ? "text-foreground" : "text-foreground/80"}`}
                        >
                          {inquiry.name}
                        </h4>
                        <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap ml-2">
                          {new Date(inquiry.createdAt).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-2">
                        {inquiry.propertyTitle || "General Inquiry"}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${
                            inquiry.status === "resolved"
                              ? "bg-emerald/10 text-emerald border border-emerald/20"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                          }`}
                        >
                          {inquiry.status}
                        </span>
                        {isSelected && (
                          <ChevronRight className="w-4 h-4 text-gold" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Pane - Detail View */}
        <div className="flex-1 bg-background flex flex-col min-h-[500px]">
          {selectedInquiry ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedInquiry.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 flex flex-col h-full"
              >
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-border bg-muted/5 flex flex-wrap gap-4 items-start justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center border border-gold/20 shrink-0">
                      <span className="font-display font-black text-2xl text-gold uppercase">
                        {selectedInquiry.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
                        {selectedInquiry.name}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(selectedInquiry.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedInquiry.status !== "resolved" && (
                      <button
                        onClick={() =>
                          handleStatusUpdate(selectedInquiry.id, "resolved")
                        }
                        className="p-2 sm:px-4 sm:py-2 bg-emerald/10 hover:bg-emerald text-emerald hover:text-white rounded-lg transition-all flex items-center gap-2 font-bold text-xs uppercase border border-emerald/20"
                        title="Mark as Resolved"
                      >
                        <CheckCircle2 className="w-4 h-4" />{" "}
                        <span className="hidden sm:inline">Resolve</span>
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleStatusUpdate(selectedInquiry.id, "archived")
                      }
                      className="p-2 sm:px-4 sm:py-2 bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-all flex items-center gap-2 font-bold text-xs uppercase border border-border"
                      title="Archive Lead"
                    >
                      <Trash2 className="w-4 h-4" />{" "}
                      <span className="hidden sm:inline">Archive</span>
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 md:p-8 flex-1 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground border-b border-border pb-2">
                        Contact Information
                      </h3>
                      <div className="space-y-3">
                        <a
                          href={`mailto:${selectedInquiry.email}`}
                          className="flex items-center gap-3 text-sm text-foreground hover:text-gold transition-colors group p-2 rounded-lg hover:bg-gold/5 -ml-2"
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-gold/20">
                            <Mail className="w-4 h-4" />
                          </div>
                          {selectedInquiry.email}
                        </a>
                        <a
                          href={`tel:${selectedInquiry.phone}`}
                          className="flex items-center gap-3 text-sm text-foreground hover:text-gold transition-colors group p-2 rounded-lg hover:bg-gold/5 -ml-2"
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-gold/20">
                            <PhoneIcon className="w-4 h-4" />
                          </div>
                          {selectedInquiry.phone}
                        </a>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground border-b border-border pb-2">
                        Lead Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-foreground p-2 rounded-lg -ml-2">
                          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center font-bold">
                            <Building2 className="w-4 h-4 text-gold" />
                          </div>
                          <span className="font-medium text-gold/90">
                            {selectedInquiry.propertyTitle || "General Inquiry"}
                          </span>
                        </div>
                        {selectedInquiry.budget && (
                          <div className="flex items-center gap-3 text-sm text-foreground p-2 rounded-lg -ml-2">
                            <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-emerald" />
                            </div>
                            <span className="font-mono text-emerald/90 uppercase">
                              {selectedInquiry.budget}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] uppercase font-black tracking-widest text-muted-foreground border-b border-border pb-2">
                      Message Payload
                    </h3>
                    <div className="bg-muted/10 p-6 rounded-2xl border border-border/50 text-foreground/80 font-body leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                      "{selectedInquiry.message}"
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-border bg-muted/5 flex justify-end gap-4 mt-auto">
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=RE: Inquiry for ${selectedInquiry.propertyTitle || "Dubai Dreams Real Estate"}`}
                    className="px-6 py-3 rounded-xl bg-primary text-white font-display font-medium text-sm hover:bg-primary-light transition-all shadow-sm"
                  >
                    Reply via Email
                  </a>
                  <a
                    href={`https://wa.me/${selectedInquiry.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 rounded-xl bg-[#25D366] text-white font-display font-medium text-sm hover:bg-[#128C7E] transition-all shadow-sm shadow-[#25D366]/20 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 p-8 my-auto min-h-[400px]">
              <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                <User className="w-10 h-10 opacity-50" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground/70 mb-2">
                No Lead Selected
              </h3>
              <p className="font-body text-sm text-center max-w-xs">
                Select an inquiry from the inbox sidebar to view full lead
                details and take action.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ManageInquiries;
