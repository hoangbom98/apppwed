import { useState, useRef } from "react";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { countries } from "@/data/countries";
import { CountryCodeSelector } from "@/components/CountryCodeSelector";

const KycOnboarding = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nationality: "",
    address: "",
    idType: "passport",
    idNumber: "",
  });

  const [passportRef, emiratesRef, supportRef] = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [emiratesFile, setEmiratesFile] = useState<File | null>(null);
  const [supportFiles, setSupportFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.nationality ||
      !formData.address
    ) {
      toast.error("Please fill all required personal details.");
      return;
    }

    if (!passportFile && formData.idType === "passport") {
      toast.error("Please attach your passport copy.");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "phone") {
          data.append(key, `${formData.countryCode} ${value}`);
        } else if (key !== "countryCode") {
          data.append(key, value);
        }
      });

      if (passportFile) data.append("passportCopy", passportFile);
      if (emiratesFile) data.append("emiratesIdCopy", emiratesFile);
      supportFiles.forEach((f) => data.append("supportingDocuments", f));

      await api.post("/api/public/kyc", { data });
      setSubmitted(true);
      toast.success("Documents successfully securely transmitted.");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          "Failed to process onboarding. Ensure files are < 10MB each.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <section className="min-h-screen py-32 flex items-center justify-center bg-background">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full p-8 bg-card rounded-2xl shadow-luxury border border-border text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-4">
              Secure Transmission Success
            </h1>
            <p className="text-muted-foreground font-body leading-relaxed mb-8">
              Your onboarding documents have been securely encrypted and
              transmitted to the Omnis Properties compliance division. An
              account director will review your status shortly.
            </p>
            <Button variant="gold" className="w-full" asChild>
              <a href="/">Return to Showcase</a>
            </Button>
          </motion.div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="pt-32 pb-20 bg-background min-h-[100svh]">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/10 mb-6 border border-gold/20">
              <Shield className="w-6 h-6 text-gold" />
            </div>
            <p className="text-gold font-body text-sm tracking-[0.2em] uppercase mb-2">
              Confidential Onboarding
            </p>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-4">
              Investor Credentials
            </h1>
            <p className="text-muted-foreground font-body text-lg max-w-xl mx-auto">
              Please provide your verifiable identification for exclusive access
              to high-yield portfolio acquisitions and legal transfer
              authorizations.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-3xl p-6 md:p-12 shadow-luxury border border-border"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <h3 className="font-display text-xl font-bold text-foreground border-b border-border pb-2">
                  1. Personal Identity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">
                      Legal Full Name
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:border-gold outline-none transition-colors"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">
                      Nationality
                    </label>
                    <input
                      required
                      type="text"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:border-gold outline-none transition-colors"
                      value={formData.nationality}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nationality: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:border-gold outline-none transition-colors"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">
                      Phone / WhatsApp
                    </label>
                    <div className="flex gap-2">
                      <CountryCodeSelector
                        value={formData.countryCode}
                        onChange={(value) =>
                          setFormData({
                            ...formData,
                            countryCode: value,
                          })
                        }
                        className="w-[130px] rounded-xl h-[50px]"
                      />
                      <input
                        required
                        type="tel"
                        className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:border-gold outline-none transition-colors"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="XX XXX XXXX"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-muted-foreground">
                      Primary Residential Address
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:border-gold outline-none transition-colors"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-6">
                <h3 className="font-display text-xl font-bold text-foreground border-b border-border pb-2">
                  2. Secure Attachments
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Passport Vault */}
                  <div
                    onClick={() => passportRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-gold bg-background/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px]"
                  >
                    <input
                      type="file"
                      ref={passportRef}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        e.target.files && setPassportFile(e.target.files[0])
                      }
                    />
                    {passportFile ? (
                      <div className="flex flex-col items-center">
                        <FileText className="w-10 h-10 text-gold mb-3" />
                        <span className="text-sm font-bold text-foreground">
                          {passportFile.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Click to replace
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                        <span className="text-sm font-bold text-foreground">
                          Upload Passport
                        </span>
                        <span className="text-xs text-muted-foreground opacity-70 mt-1">
                          Required (PDF/JPG/PNG)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Emirates ID Vault */}
                  <div
                    onClick={() => emiratesRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-gold bg-background/50 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px]"
                  >
                    <input
                      type="file"
                      ref={emiratesRef}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) =>
                        e.target.files && setEmiratesFile(e.target.files[0])
                      }
                    />
                    {emiratesFile ? (
                      <div className="flex flex-col items-center">
                        <FileText className="w-10 h-10 text-gold mb-3" />
                        <span className="text-sm font-bold text-foreground">
                          {emiratesFile.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Click to replace
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                        <span className="text-sm font-bold text-foreground">
                          Upload Emirates ID
                        </span>
                        <span className="text-xs text-muted-foreground opacity-70 mt-1">
                          If applicable (PDF/JPG/PNG)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-muted-foreground">
                    Additional Supporting Documents (Visas, PoA, etc)
                  </label>
                  <label className="flex items-center justify-center w-full min-h-[100px] border border-border border-dashed rounded-xl bg-background/50 hover:border-gold hover:bg-gold/5 transition-all cursor-pointer">
                    <span className="text-sm font-bold text-gold flex items-center gap-2">
                      <Upload className="w-4 h-4" /> Add Files
                    </span>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        if (e.target.files) {
                          setSupportFiles([
                            ...supportFiles,
                            ...Array.from(e.target.files),
                          ]);
                        }
                      }}
                    />
                  </label>
                  {supportFiles.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-3">
                      {supportFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg text-xs font-medium border border-border"
                        >
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">
                            {f.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSupportFiles(
                                supportFiles.filter((_, idx) => idx !== i),
                              )
                            }
                            className="text-red-500 hover:text-red-700 ml-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <Button
                  variant="gold"
                  size="xl"
                  className="w-full font-bold tracking-wider"
                  disabled={loading}
                >
                  {loading
                    ? "Transmitting Submissions..."
                    : "SECURELY SUBMIT COMPLIANCE DOSSIER"}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-2">
                  <Shield className="w-3 h-3" /> Vault secured with advanced
                  encryption.
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default KycOnboarding;
