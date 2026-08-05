import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Building2,
  MapPin,
  Tag,
  Info,
  Bed,
  Bath,
  Square,
  Calendar,
  Home,
  Car,
  DollarSign,
  FileText,
  Video,
  Upload,
  X,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";
import DirhamIcon from "@/components/icons/DirhamIcon";
const AddProperty = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");

  // File handling for New Assets
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [floorPlans, setFloorPlans] = useState<File[]>([]);
  const [floorPlanPreviews, setFloorPlanPreviews] = useState<string[]>([]);

  const [technicalPdf, setTechnicalPdf] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    address: "",
    price: "",
    propertyType: "apartment",
    status: "active",
    listedIn: "Buy",
    bedrooms: "",
    bathrooms: "",
    area: "",
    city: "",
    state: "",
    region: "",
    areaLocation: "",
    zipCode: "",
    country: "United Arab Emirates",
    yearBuilt: new Date().getFullYear().toString(),
    kitchens: "1",
    garages: "0",
    garageSize: "0",
    floorsNo: "1",
    yearlyTaxRate: "0",
    videoUrl: "",
    // Off-plan fields
    developerName: "",
    unitTypes: "",
    handoverYear: new Date().getFullYear().toString(),
    totalFloors: "",
    paymentPlanOnBooking: "",
    paymentPlanDuringConstruction: "",
    paymentPlanOnHandover: "",
    theme: "default",
  });

  const isOffPlan = formData.listedIn === "Off-Plan";

  const handleFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "images" | "floorPlans",
  ) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

      if (type === "images") {
        setImages((prev) => [...prev, ...newFiles]);
        setImagePreviews((prev) => [...prev, ...newPreviews]);
      } else {
        setFloorPlans((prev) => [...prev, ...newFiles]);
        setFloorPlanPreviews((prev) => [...prev, ...newPreviews]);
      }
    }
  };

  const removeFile = (index: number, type: "images" | "floorPlans") => {
    if (type === "images") {
      setImages((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => {
        URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setFloorPlans((prev) => prev.filter((_, i) => i !== index));
      setFloorPlanPreviews((prev) => {
        URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = new FormData();

      // Basic fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== "") data.append(key, value);
      });

      // Arrays
      selectedAmenities.forEach((a) => data.append("amenities", a));

      // Files
      images.forEach((file) => data.append("images", file));
      floorPlans.forEach((file) => data.append("floorPlans", file));
      if (technicalPdf) data.append("technicalPdf", technicalPdf);
      if (thumbnail) data.append("thumbnail", thumbnail);

      await api.post("/api/dashboard/properties", { data });
      toast.success(
        isOffPlan
          ? "New project launched successfully"
          : "New property listed successfully",
      );
      navigate("/admin/properties");
    } catch (err: any) {
      console.error("Create error:", err);
      toast.error(err.response?.data?.message || "Failed to list property");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <Button
          variant="ghost"
          asChild
          className="mb-4 -ml-4 text-muted-foreground hover:text-gold"
        >
          <Link to="/admin/properties">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Properties
          </Link>
        </Button>
        <h1 className="font-display text-2xl md:text-4xl font-black text-foreground tracking-tighter">
          {isOffPlan ? "Launch Off-Plan Project" : "List New Property"}
        </h1>
        <p className="text-muted-foreground font-body text-sm">
          {isOffPlan
            ? "Create a comprehensive project showcase with payment plans and unit types."
            : "Create a premium showcase listing for your portfolio."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* 1. General Content */}
            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <Building2 className="w-5 h-5 text-gold" />
                <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-widest">
                  {isOffPlan ? "Project Overview" : "General Content"}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                      {isOffPlan ? "Project Name*" : "Property Title*"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        isOffPlan
                          ? "e.g. Radisson Blu Residences"
                          : "e.g. Ultra Luxury Penthouse at 22 Karat"
                      }
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold transition-all"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                      Developer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Emaar Properties"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold transition-all"
                      value={formData.developerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          developerName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                    {isOffPlan ? "Project Description*" : "Full Description*"}
                  </label>
                  <textarea
                    required
                    rows={6}
                    placeholder={
                      isOffPlan
                        ? "Describe the off-plan project, available units, and vision..."
                        : "Describe the architectural marvel and exclusive amenities..."
                    }
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold transition-all"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gold" />{" "}
                    {isOffPlan
                      ? "Project Location / Address"
                      : "Specific Location / Street"}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Palm Jumeirah West Crescent"
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold transition-all"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>

                {/* Geographical Taxonomy */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                      Area/Community
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Palm Jumeirah"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold transition-all"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                      Region
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dubai Marina Area"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold transition-all"
                      value={formData.region}
                      onChange={(e) =>
                        setFormData({ ...formData, region: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                      District
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. West Crescent"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold transition-all"
                      value={formData.areaLocation}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          areaLocation: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dubai"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold transition-all"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Media Manager */}
            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <ImageIcon className="w-5 h-5 text-gold" />
                <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-widest">
                  {isOffPlan ? "Project Visuals" : "Gallery & Assets"}
                </h2>
              </div>

              {/* Photos */}
              <div className="space-y-4">
                <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                  {isOffPlan
                    ? "Project Renders (Max 10)"
                    : "Exclusive Gallery (Max 10)"}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-body font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2">
                       < ImageIcon className="w-3.5 h-3.5" /> CARD THUMBNAIL (REQ)
                    </label>
                    {thumbnailPreview ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-gold shadow-lg shadow-gold/10 group">
                        <img src={thumbnailPreview} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setThumbnail(null);
                            setThumbnailPreview(null);
                          }}
                          className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="aspect-video rounded-2xl border-2 border-dashed border-border hover:border-gold flex flex-col items-center justify-center bg-muted/10 cursor-pointer transition-all hover:bg-gold/5 group">
                        <Upload className="w-8 h-8 text-gold mb-2 group-hover:-translate-y-1 transition-transform" />
                        <span className="text-[10px] text-muted-foreground font-black tracking-widest">
                          CHOOSE THUMBNAIL
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                             if (e.target.files?.[0]) {
                               const file = e.target.files[0];
                               setThumbnail(file);
                               setThumbnailPreview(URL.createObjectURL(file));
                             }
                          }}
                        />
                      </label>
                    )}
                    <p className="text-[9px] text-muted-foreground italic font-body"> This is the image that appears on the website Homepage cards. </p>
                  </div>
                </div>
                <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest mt-6 block">
                  IMAGE GALLERY (MAX 10)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {imagePreviews.map((prev, idx) => (
                    <div
                      key={`new-img-${idx}`}
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gold/20 border-dashed"
                    >
                      <img src={prev} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(idx, "images")}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-gold flex flex-col items-center justify-center bg-muted/10 cursor-pointer transition-all hover:bg-gold/5">
                    <Upload className="w-6 h-6 text-gold mb-1" />
                    <span className="text-[9px] text-muted-foreground font-black tracking-tighter">
                      ADD PHOTO
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFilesChange(e, "images")}
                    />
                  </label>
                </div>
              </div>

              {/* Floor Plans */}
              <div className="space-y-4 pt-6 border-t border-border">
                <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                  {isOffPlan
                    ? "Typical Floor Plans & Layouts"
                    : "Technical Floor Plans"}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {floorPlanPreviews.map((prev, idx) => (
                    <div
                      key={`new-plan-${idx}`}
                      className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gold/20 border-dashed bg-muted/10 flex items-center justify-center"
                    >
                      <FileText className="w-7 h-7 text-gold opacity-50" />
                      <button
                        type="button"
                        onClick={() => removeFile(idx, "floorPlans")}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-gold flex flex-col items-center justify-center bg-muted/10 cursor-pointer transition-all hover:bg-gold/5">
                    <FileText className="w-6 h-6 text-gold mb-1" />
                    <span className="text-[9px] text-muted-foreground font-black tracking-tighter">
                      ADD PLAN
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFilesChange(e, "floorPlans")}
                    />
                  </label>
                </div>
              </div>

              {/* Official Brochure (PDF) */}
              <div className="space-y-4 pt-6 border-t border-border">
                <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />{" "}
                  {isOffPlan
                    ? "Project Brochure & Material"
                    : "Official Brochure (PDF)"}
                </label>
                <div className="flex items-center gap-4">
                  {technicalPdf ? (
                    <div className="flex-1 flex items-center justify-between bg-gold/10 border border-gold/20 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-5 h-5 text-gold shrink-0" />
                        <span className="text-xs font-bold text-foreground truncate">
                          {technicalPdf.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTechnicalPdf(null)}
                        className="p-1 hover:bg-gold/20 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gold" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex-1 border-2 border-dashed border-border hover:border-gold rounded-xl py-4 flex flex-col items-center justify-center bg-muted/5 cursor-pointer transition-all hover:bg-gold/5">
                      <Upload className="w-6 h-6 text-gold mb-1" />
                      <span className="text-[10px] text-muted-foreground font-black tracking-tighter uppercase">
                        Attach Technical PDF
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="application/pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0])
                            setTechnicalPdf(e.target.files[0]);
                        }}
                      />
                    </label>
                  )}
                </div>
                <p className="text-[9px] text-muted-foreground opacity-60 italic">
                  This file will be used for the "Download High-Res PDF" button
                  on the details page.
                </p>
              </div>
            </div>

            {/* 3. Specs Grid */}
            <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <Square className="w-5 h-5 text-gold" />
                <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-widest">
                  {isOffPlan ? "Project Profile" : "Dimensions & Specs"}
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {isOffPlan ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                        Unit Types
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1 & 2 BR Apartments"
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                        value={formData.unitTypes}
                        onChange={(e) =>
                          setFormData({ ...formData, unitTypes: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                        Bedrooms Range
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1-3"
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                        value={formData.bedrooms}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bedrooms: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                        Bathrooms Range
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1-3"
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                        value={formData.bathrooms}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bathrooms: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                        SQFT Range
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 815 - 2350"
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                        value={formData.area}
                        onChange={(e) =>
                          setFormData({ ...formData, area: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                        Handover Year
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2026"
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                        value={formData.handoverYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            handoverYear: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                        Total Floors
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 24"
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                        value={formData.totalFloors}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalFloors: e.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                        Beds
                      </label>
                      <input
                        type="number"
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                        value={formData.bedrooms}
                        onChange={(e) =>
                          setFormData({ ...formData, bedrooms: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                        Baths
                      </label>
                      <input
                        type="number"
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                        value={formData.bathrooms}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bathrooms: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                        Kitchens
                      </label>
                      <input
                        type="number"
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                        value={formData.kitchens}
                        onChange={(e) =>
                          setFormData({ ...formData, kitchens: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                        SQFT
                      </label>
                      <input
                        type="number"
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                        value={formData.area}
                        onChange={(e) =>
                          setFormData({ ...formData, area: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {isOffPlan && (
              <div className="bg-background rounded-2xl p-6 md:p-8 shadow-sm border border-border space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <DollarSign className="w-5 h-5 text-gold" />
                  <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-widest">
                    Payment Plan (%)
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                      On Booking
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                      value={formData.paymentPlanOnBooking}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentPlanOnBooking: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                      During Construction
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 40"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                      value={formData.paymentPlanDuringConstruction}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentPlanDuringConstruction: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                      On Handover
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      className="w-full bg-muted/30 border border-border rounded-xl px-4 py-2.5 outline-none font-body text-sm focus:border-gold"
                      value={formData.paymentPlanOnHandover}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentPlanOnHandover: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            <div className="bg-background rounded-2xl p-6 shadow-sm border border-border space-y-6">
              <h3 className="font-display font-black text-xs uppercase tracking-widest text-gold border-b border-gold/10 pb-2">
                Publishing Desk
              </h3>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                    Portfolio Segment
                  </label>
                  <select
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold appearance-none"
                    value={formData.listedIn}
                    onChange={(e) =>
                      setFormData({ ...formData, listedIn: e.target.value })
                    }
                  >
                    <option value="Buy">Premium Sale</option>
                    <option value="Rent">Luxury Rental</option>
                    <option value="Off-Plan">Off-Plan Offering</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest text-gold">
                    Project Category
                  </label>
                  <select
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold appearance-none"
                    value={formData.propertyType}
                    onChange={(e) =>
                      setFormData({ ...formData, propertyType: e.target.value })
                    }
                  >
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="penthouse">Penthouse</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest text-gold flex items-center gap-1">
                    {isOffPlan ? "Starting Price (" : "Offer Value ("}
                    <DirhamIcon size={10} strokeWidth={4} />
                    {")*"}
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Enter valuation..."
                    className="w-full bg-primary text-white border-none rounded-xl px-5 py-4 outline-none font-display font-bold text-2xl placeholder:text-white/20"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                    Initial Status
                  </label>
                  <select
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold appearance-none"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="active">Active Listing</option>
                    <option value="pending">Draft Mode</option>
                    <option value="sold">Already Sold</option>
                    <option value="rented">Leased</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-body font-black text-muted-foreground uppercase tracking-widest">
                    Detail Page Theme
                  </label>
                  <select
                    className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 outline-none font-body text-sm focus:border-gold appearance-none"
                    value={formData.theme || "default"}
                    onChange={(e) =>
                      setFormData({ ...formData, theme: e.target.value })
                    }
                  >
                    <option value="default">Classic (Default)</option>
                    <option value="modern">Modern Dark</option>
                    <option value="minimal">Minimal Light</option>
                  </select>
                  <p className="text-[9px] text-muted-foreground opacity-60 mt-1">
                    Choose the layout style for the property detail page.
                  </p>
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  variant="gold"
                  className="w-full py-7 text-lg rounded-2xl shadow-xl shadow-gold/20"
                  type="submit"
                  disabled={saving}
                >
                  <Save className="w-5 h-5 mr-3" />
                  {saving
                    ? "Finalizing..."
                    : isOffPlan
                      ? "Launch Project"
                      : "Publish Listing"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-6 rounded-xl border-dashed"
                  asChild
                  disabled={saving}
                >
                  <Link to="/admin/properties">Abort & Exit</Link>
                </Button>
              </div>
            </div>

            {/* Lifestyle Amenities Selection */}
            <div className="bg-background rounded-2xl p-6 shadow-sm border border-border space-y-4">
              <div className="flex items-center gap-2 text-gold">
                <CheckCircle2 className="w-4 h-4" />
                <h3 className="font-display font-black text-[10px] uppercase tracking-widest">
                  Lifestyle Amenities
                </h3>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const trimmed = amenityInput.trim();
                      if (trimmed && !selectedAmenities.includes(trimmed)) {
                        setSelectedAmenities((prev) => [...prev, trimmed]);
                        setAmenityInput("");
                      }
                    }
                  }}
                  placeholder="Type an amenity and press Enter..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-muted/20 border border-border/50 text-xs font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 transition-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-xl border-gold/30 text-gold hover:bg-gold/10 hover:text-gold"
                  disabled={!amenityInput.trim()}
                  onClick={() => {
                    const trimmed = amenityInput.trim();
                    if (trimmed && !selectedAmenities.includes(trimmed)) {
                      setSelectedAmenities((prev) => [...prev, trimmed]);
                      setAmenityInput("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {selectedAmenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedAmenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-[10px] font-black text-gold uppercase tracking-wider"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAmenities((prev) =>
                            prev.filter((_, i) => i !== idx),
                          )
                        }
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground opacity-60">
                Add custom amenities. Press Enter or click Add to include each one.
              </p>
            </div>

            <div className="bg-primary/5 rounded-2xl p-6 border border-gold/10">
              <div className="flex items-center gap-2 text-gold mb-3">
                <Info className="w-4 h-4" />
                <h3 className="font-display font-black text-[10px] uppercase tracking-widest">
                  Asset Sync
                </h3>
              </div>
              <p className="text-[10px] text-muted-foreground font-body leading-relaxed">
                Images will be automatically optimized for high-retina displays.
                Ensure floor plans are clearly legible.
              </p>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AddProperty;
