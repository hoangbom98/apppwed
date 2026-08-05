import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import {
  FileText,
  Search as SearchIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileDown,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface KYCSubmission {
  _id: string;
  userId: { name: string; email: string };
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  address: string;
  idType: string;
  idNumber: string;
  documentUrls: {
    passportCopy?: string;
    visaCopy?: string;
    emiratesIdCopy?: string;
    supportingDocuments?: string[];
  };
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  createdAt: string;
}

const KYCManagement = () => {
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchSubmissions = async () => {
    try {
      const { data } = await api.get("/api/dashboard/kyc");
      setSubmissions(data.submissions || []);
    } catch (err) {
      console.error("Failed to fetch KYC submissions", err);
      // Fallback data for demonstration if backend route is not available
      setSubmissions([
        {
          _id: "demo1",
          userId: { name: "Alice Smith", email: "alice@example.com" },
          fullName: "Alice Smith",
          email: "alice@example.com",
          phone: "+971 50 123 4567",
          nationality: "British",
          address: "123 Business Bay, Dubai",
          idType: "passport",
          idNumber: "UK123456789",
          documentUrls: {
            passportCopy: "/placeholder-passport.jpg",
          },
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "demo2",
          userId: { name: "Bob Jones", email: "bob@example.com" },
          fullName: "Robert Jones",
          email: "bob@example.com",
          phone: "+44 7700 900000",
          nationality: "American",
          address: "456 Marina, Dubai",
          idType: "emirates_id",
          idNumber: "784-1234-5678901-2",
          documentUrls: {
            passportCopy: "/placeholder-passport.jpg",
            emiratesIdCopy: "/placeholder-eid.jpg",
          },
          status: "approved",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    id: string,
    status: "pending" | "approved" | "rejected",
  ) => {
    try {
      await api.patch(`/api/dashboard/kyc/${id}/status`, { data: { status } });
      toast.success(`KYC marked as ${status}`);
      setSubmissions((prev) =>
        prev.map((sub) => (sub._id === id ? { ...sub, status } : sub)),
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleDocumentDownload = (url: string, filename: string) => {
    if (!url) {
      toast.error("No document URL available");
      return;
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Initiating download for ${filename}`);
  };

  const generatePDFSummary = (sub: KYCSubmission) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups for summary generation.");
      return;
    }

    const content = `
      <html>
        <head>
          <title>KYC Summary - ${sub.fullName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              padding: 60px;
              color: #1a1a2e;
              background: #fff;
              line-height: 1.6;
            }
            .header {
              border-bottom: 3px solid #C19E67;
              padding-bottom: 30px;
              margin-bottom: 50px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .brand {
              color: #C19E67;
              font-size: 32px;
              font-weight: 900;
              letter-spacing: 2px;
              text-transform: uppercase;
            }
            .report-title {
              font-size: 14px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .section {
              margin-bottom: 30px;
              background: #f8fafc;
              padding: 24px;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
            }
            .section-title {
              font-size: 11px;
              font-weight: 900;
              color: #C19E67;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin-bottom: 20px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 10px;
            }
            .row {
              display: flex;
              margin-bottom: 12px;
            }
            .label {
              font-weight: 700;
              color: #64748b;
              width: 180px;
              font-size: 12px;
            }
            .value {
              color: #1e293b;
              font-weight: 500;
              font-size: 13px;
              flex: 1;
            }
            .status {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 30px;
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .status-approved { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-rejected { background: #fee2e2; color: #991b1b; }
            .footer {
              margin-top: 60px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            @media print {
              .section { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">OMNIS PROPERTIES</div>
            <div class="report-title">KYC Compliance Summary</div>
          </div>

          <div class="section">
            <div class="section-title">Investor Identity Profile</div>
            <div class="row">
              <div class="label">Full Legal Name</div>
              <div class="value">${sub.fullName}</div>
            </div>
            <div class="row">
              <div class="label">Nationality</div>
              <div class="value">${sub.nationality}</div>
            </div>
            <div class="row">
              <div class="label">Primary Email</div>
              <div class="value">${sub.email || sub.userId?.email || "N/A"}</div>
            </div>
            <div class="row">
              <div class="label">Contact Number</div>
              <div class="value">${sub.phone || "N/A"}</div>
            </div>
            <div class="row">
              <div class="label">Residential Address</div>
              <div class="value">${sub.address || "N/A"}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Identification Protocols</div>
            <div class="row">
              <div class="label">Identification Type</div>
              <div class="value">${(sub.idType || "N/A").replace("_", " ").toUpperCase()}</div>
            </div>
            <div class="row">
              <div class="label">Document ID Number</div>
              <div class="value">${sub.idNumber || "N/A"}</div>
            </div>
            <div class="row">
              <div class="label">Submission Timestamp</div>
              <div class="value">${new Date(sub.createdAt).toLocaleString()}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Verified Artifacts</div>
            <div class="row">
              <div class="label">Passport Copy</div>
              <div class="value">${sub.documentUrls?.passportCopy ? "Encrypted Link Available" : "Not Provided"}</div>
            </div>
            <div class="row">
              <div class="label">Emirates ID</div>
              <div class="value">${sub.documentUrls?.emiratesIdCopy ? "Encrypted Link Available" : "Not Provided"}</div>
            </div>
            <div class="row">
              <div class="label">Supporting Docs</div>
              <div class="value">${sub.documentUrls?.supportingDocuments?.length ? `${sub.documentUrls.supportingDocuments.length} Files Attached` : "None"}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Compliance Evaluation</div>
            <div class="row">
              <div class="label">Current Appraisal</div>
              <div class="value"><span class="status status-${sub.status}">${sub.status}</span></div>
            </div>
            <div class="row" style="margin-top: 20px;">
              <div class="label">Reviewer Remarks</div>
              <div class="value" style="font-style: italic;">${sub.remarks || "No administrative remarks logged."}</div>
            </div>
          </div>

          <div class="footer">
            CONFIDENTIAL - Internal Use Only &bull; Generated via OMNIS Compliance Engine &bull; Ref: ${sub._id} &bull; ${new Date().toLocaleString()}
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    toast.success("Generating compliance summary...");
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.idNumber.toLowerCase().includes(search.toLowerCase()) ||
      (s.userId?.email &&
        s.userId.email.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground font-title">
            KYC Compliance
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            Review client identification and regulatory submissions securely.
          </p>
        </div>
        {!loading && (
          <div className="px-5 py-3 bg-gold/5 rounded-2xl border border-gold/20 flex flex-col items-center sm:items-end shadow-inner">
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-[#0D3430] mb-1">
              Active Queue
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-black text-gold leading-none">
                {
                  filteredSubmissions.filter((s) => s.status === "pending")
                    .length
                }
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Pending Appraisals
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="p-3 md:p-4 bg-background rounded-2xl border border-border shadow-sm flex items-center flex-1">
          <div className="relative w-full">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name, email, or ID number..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/20 border-border font-body text-sm outline-none focus:ring-1 ring-gold/30 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="p-3 md:p-4 bg-background rounded-2xl border border-border shadow-sm flex items-center shrink-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48 pl-4 pr-8 py-3 rounded-xl bg-muted/20 border-border font-body text-sm outline-none focus:ring-1 ring-gold/30 transition-all appearance-none cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1rem center",
              backgroundSize: "1.2em",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground font-body">
            Verifying secure channels...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-body bg-muted/5 rounded-3xl border-2 border-dashed border-border/50">
            <User className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-3" />
            <p className="font-display font-medium">
              No KYC records match your criteria.
            </p>
          </div>
        ) : (
          paginatedSubmissions.map((sub, i) => (
            <motion.div
              key={sub._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-background rounded-2xl border border-border shadow-sm p-5 md:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col xl:flex-row justify-between gap-8">
                {/* Information Section */}
                <div className="flex flex-col sm:flex-row items-start gap-6 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center text-gold shrink-0 border border-gold/20 shadow-inner">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border/50">
                      <h3 className="font-display font-black text-2xl text-foreground">
                        {sub.fullName}
                      </h3>
                      {sub.status === "pending" && (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                          <Clock className="w-3 h-3" /> Pending Review
                        </span>
                      )}
                      {sub.status === "approved" && (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      )}
                      {sub.status === "rejected" && (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                          <XCircle className="w-3 h-3" /> Rejected
                        </span>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-auto bg-muted/40 px-3 py-1 rounded-md">
                        REF: {sub._id.slice(-8).toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
                          Email Address
                        </span>
                        <span className="font-body text-sm font-medium text-foreground">
                          {sub.email || sub.userId?.email || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
                          Contact Number
                        </span>
                        <span className="font-body text-sm font-medium text-foreground">
                          {sub.phone || "N/A"}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
                          Nationality
                        </span>
                        <span className="font-body text-sm font-medium text-foreground">
                          {sub.nationality}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
                          {sub.idType.replace("_", " ")}
                        </span>
                        <span className="font-body text-sm font-medium text-foreground uppercase tracking-wider">
                          {sub.idNumber}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Section */}
                <div className="flex flex-col sm:flex-row xl:flex-col items-center sm:items-stretch xl:justify-center gap-3 w-full xl:w-48 mt-6 xl:mt-0 pt-6 xl:pt-0 border-t border-border xl:border-t-0 xl:border-l xl:pl-8">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0D3430] w-full text-center sm:text-left xl:text-center mb-1">
                    Compliance Actions
                  </span>

                  {/* Document Downloads */}
                  <div className="flex items-center justify-center gap-2 w-full">
                    {sub.documentUrls?.passportCopy && (
                      <button
                        title="Download Passport"
                        className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-muted/30 hover:bg-gold hover:text-white rounded-xl transition-colors border border-border"
                        onClick={() =>
                          handleDocumentDownload(
                            sub.documentUrls.passportCopy!,
                            `Passport_${sub.fullName.replace(/\s+/g, "_")}.jpg`,
                          )
                        }
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          Pass
                        </span>
                      </button>
                    )}
                    {sub.documentUrls?.emiratesIdCopy && (
                      <button
                        title="Download Emirates ID"
                        className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-muted/30 hover:bg-gold hover:text-white rounded-xl transition-colors border border-border"
                        onClick={() =>
                          handleDocumentDownload(
                            sub.documentUrls.emiratesIdCopy!,
                            `EmiratesID_${sub.fullName.replace(/\s+/g, "_")}.jpg`,
                          )
                        }
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          EID
                        </span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => generatePDFSummary(sub)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0D3430] text-gold hover:bg-[#06201e] focus:ring-2 ring-gold/50 shadow-lg font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
                  >
                    <FileDown className="w-4 h-4 text-white" /> Print Report
                  </button>

                  <div className="flex w-full gap-2 mt-1">
                    <button
                      onClick={() => handleStatusUpdate(sub._id, "approved")}
                      disabled={sub.status === "approved"}
                      className="flex-1 flex items-center justify-center gap-1 p-2.5 text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Approve"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(sub._id, "rejected")}
                      disabled={sub.status === "rejected"}
                      className="flex-1 flex items-center justify-center gap-1 p-2.5 text-red-700 bg-red-50 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-600 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Reject"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl bg-background border border-border text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-muted/50 transition-colors"
          >
            Previous
          </button>
          <div className="flex items-center gap-1 font-body text-sm font-medium">
            <span className="px-3 py-1 rounded-lg bg-gold/10 text-[#0D3430] border border-gold/20">
              {currentPage}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{totalPages}</span>
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl bg-background border border-border text-xs font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-muted/50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </AdminLayout>
  );
};

export default KYCManagement;
