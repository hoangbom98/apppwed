import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import DirhamIcon from "@/components/icons/DirhamIcon";
interface Property {
  id: string;
  _id?: string;
  title: string;
  description: string;
  location: string;
  address?: string;
  price: number;
  propertyType: string;
  status: string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  area?: number | string;
  amenities?: string[];
  yearBuilt?: number;
  kitchens?: number;
  garages?: number;
  garageSize?: number;
  floorsNo?: number;
  listedIn?: string;
  yearlyTaxRate?: number;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  region?: string;
  areaLocation?: string;
  videoUrl?: string;
  images: string[];
  thumbnailUrl?: string;
  floorPlans: string[];
  // Off-plan fields
  developerName?: string;
  unitTypes?: string;
  handoverYear?: string;
  totalFloors?: number | string;
  paymentPlan?: {
    onBooking?: number;
    duringConstruction?: number;
    onHandover?: number;
  };
}

const EditProperty = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [amenityInput, setAmenityInput] = useState("");

  // File handling
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [newFloorPlans, setNewFloorPlans] = useState<File[]>([]);
  const [floorPlanPreviews, setFloorPlanPreviews] = useState<string[]>([]);
  const [existingFloorPlans, setExistingFloorPlans] = useState<string[]>([]);

  const [newTechnicalPdf, setNewTechnicalPdf] = useState<File | null>(null);
  const [existingTechnicalPdf, setExistingTechnicalPdf] = useState<
    string | null
  >(null);
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(
    null,
  );

  const [formData, setFormData] = useState<Partial<Property>>({
    title: "",
    description: "",
    location: "",
    address: "",
    price: 0,
    propertyType: "apartment",
    status: "pending",
    listedIn: "Buy",
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    city: "",
    state: "",
    zipCode: "",
    country: "United Arab Emirates",
    yearBuilt: new Date().getFullYear(),
    kitchens: 1,
    garages: 0,
    garageSize: 0,
    floorsNo: 1,
    yearlyTaxRate: 0,
    videoUrl: "",
    images: [],
    floorPlans: [],
    // Off-plan fields
    developerName: "",
    unitTypes: "",
    handoverYear: "",
    totalFloors: 0,
    paymentPlan: {
      onBooking: 0,
      duringConstruction: 0,
      onHandover: 0,
    },
    theme: "default",
  });

  const isOffPlan = formData.listedIn === "Off-Plan";

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await api.get(`/api/dashboard/properties/${id}`);
        const found = data.property;

        if (found) {
          setFormData({
            ...found,
            id: found._id || found.id,
            paymentPlanOnBooking: found.paymentPlan?.onBooking || "",
            paymentPlanDuringConstruction:
              found.paymentPlan?.duringConstruction || "",
            paymentPlanOnHandover: found.paymentPlan?.onHandover || "",
          });
          setExistingImages(found.images || []);
          setExistingFloorPlans(found.floorPlans || []);
          setExistingTechnicalPdf(
            found.technicalPdf && found.technicalPdf !== "null"
              ? found.technicalPdf
              : null,
          );
          setExistingThumbnail(found.thumbnailUrl || null);
          if (found.amenities && Array.isArray(found.amenities)) {
            setSelectedAmenities(found.amenities);
          }
        } else {
          toast.error("Property not found");
          navigate("/admin/properties");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        toast.error("Failed to load property details");
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate]);

  const handleNewFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "images" | "floorPlans",
  ) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));

      if (type === "images") {
        setNewImages((prev) => [...prev, ...newFiles]);
        setImagePreviews((prev) => [...prev, ...newPreviews]);
      } else {
        setNewFloorPlans((prev) => [...prev, ...newFiles]);
        setFloorPlanPreviews((prev) => [...prev, ...newPreviews]);
      }
    }
  };

  const removeExistingFile = (index: number, type: "images" | "floorPlans") => {
    if (type === "images") {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setExistingFloorPlans((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const removeNewFile = (index: number, type: "images" | "floorPlans") => {
    if (type === "images") {
      setNewImages((prev) => prev.filter((_, i) => i !== index));
      setImagePreviews((prev) => {
        URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setNewFloorPlans((prev) => prev.filter((_, i) => i !== index));
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
      const allAmenities = selectedAmenities;

      // Use FormData for file updates
      const data = new FormData();

      // Basic fields
      const {
        id: _,
        _id: __,
        ownerId,
        createdAt,
        updatedAt,
        views,
        favouritedBy,
        images,
        floorPlans,
        technicalPdf: ___,
        paymentPlan: ____, // Omit the object, use the flattened fields
        ...updateFields
      } = formData as any;

      Object.entries(updateFields).forEach(([key, value]) => {
        // Skip arrays (handled separately) and plain objects
        if (Array.isArray(value) || (value !== null && typeof value === "object")) return;
        if (value !== undefined && value !== null && value !== "") {
          data.append(key, String(value));
        }
      });

      // Special handling for arrays
      allAmenities.forEach((a) => data.append("amenities", a));

      // Existing files to KEEP
      existingImages.forEach((img) => data.append("images", img));
      existingFloorPlans.forEach((plan) => data.append("floorPlans", plan));

      // NEW files to upload
      newImages.forEach((file) => data.append("images", file));
      newFloorPlans.forEach((file) => data.append("floorPlans", file));
      if (newTechnicalPdf) {
        data.append("technicalPdf", newTechnicalPdf);
      } else if (existingTechnicalPdf) {
        data.append("technicalPdf", existingTechnicalPdf);
      } else {
        data.append("technicalPdf", ""); // Explicably clear it in the database
      }

      if (newThumbnail) {
        data.append("thumbnail", newThumbnail);
      } else if (existingThumbnail) {
        data.append("thumbnail", existingThumbnail);
      }

      await api.patch(`/api/dashboard/properties/${id}`, { data });
      toast.success(
        isOffPlan
          ? "Project updated successfully"
          : "Property updated successfully",
      );
      navigate("/admin/properties");
    } catch (err: any) {
      console.error("Update error:", err);
      toast.error(err.response?.data?.message || "Failed to update property");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      </AdminLayout>
    );

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
        <h1 className="font-display text-3xl font-bold text-foreground">
          {isOffPlan ? "Project Architect" : "Advanced Editor"}
        </h1>
        <p className="text-muted-foreground font-body">
          {isOffPlan
            ? `Managing master plan and specifications for "${formData.title}"`
            : `Managing assets and specifications for "${formData.title}"`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Content & Location */}
            <div className="bg-background rounded-xl p-8 shadow-sm border border-border space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <Building2 className="w-5 h-5 text-gold" />
                <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-widest">
                  {isOffPlan ? "Project Vision" : "General Content"}
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                      {isOffPlan ? "Project Title" : "Property Title"}
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                      value={formData.title || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                      Developer Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Emaar Properties"
                      className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                      value={formData.developerName || ""}
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
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                    Description
                  </label>
                  <textarea
                    required
                    rows={6}
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-gold" />{" "}
                    {isOffPlan ? "Project Address" : "Street Address"}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>

                {/* Geographical Taxonomy */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                      Location
                    </label>
                    <input
                      type="text"
                      className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                      value={formData.location || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                      Region
                    </label>
                    <input
                      type="text"
                      className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                      value={formData.region || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, region: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                      Area
                    </label>
                    <input
                      type="text"
                      className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                      value={formData.areaLocation || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          areaLocation: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                      City
                    </label>
                    <input
                      type="text"
                      className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none font-body text-sm focus:border-gold transition-colors"
                      value={formData.city || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Media Manager */}
            <div className="bg-background rounded-xl p-8 shadow-sm border border-border space-y-8">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <ImageIcon className="w-5 h-5 text-gold" />
                <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-widest">
                  {isOffPlan ? "Project Assets" : "Asset Management"}
                </h2>
              </div>

              {/* Photos */}
              <div className="space-y-4">
                <label className="text-xs font-body font-bold text-muted-foreground uppercase flex items-center gap-2">
                  {isOffPlan ? "Project Renders" : "Images & Gallery"}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                  <div className="space-y-4">
                    <label className="text-[10px] font-body font-black text-gold uppercase tracking-[0.2em] flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5" /> CARD THUMBNAIL (REQ)
                    </label>
                    {thumbnailPreview || existingThumbnail ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-gold shadow-lg shadow-gold/10 group">
                        <img
                          src={
                            thumbnailPreview ||
                            (existingThumbnail?.startsWith("http")
                              ? existingThumbnail
                              : `http://localhost:5000/${existingThumbnail}`)
                          }
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewThumbnail(null);
                            setThumbnailPreview(null);
                            setExistingThumbnail(null);
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
                              setNewThumbnail(file);
                              setThumbnailPreview(URL.createObjectURL(file));
                            }
                          }}
                        />
                      </label>
                    )}
                    <p className="text-[9px] text-muted-foreground italic font-body">
                      {" "}
                      This is the image that appears on the website Homepage
                      cards.{" "}
                    </p>
                  </div>
                </div>

                {/* Existing Images */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mb-4">
                  {existingImages.map((img, idx) => (
                    <div
                      key={`exist-img-${idx}`}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={
                          img.startsWith("http")
                            ? img
                            : `http://localhost:5000/${img}`
                        }
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingFile(idx, "images")}
                        className="absolute inset-0 bg-red-600/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {/* New Previews */}
                  {imagePreviews.map((prev, idx) => (
                    <div
                      key={`new-img-${idx}`}
                      className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gold/50 border-dashed"
                    >
                      <img src={prev} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewFile(idx, "images")}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-gold flex flex-col items-center justify-center bg-muted/10 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-gold mb-1" />
                    <span className="text-[10px] text-muted-foreground font-bold">
                      ADD NEW
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleNewFilesChange(e, "images")}
                    />
                  </label>
                </div>
              </div>

              {/* Floor Plans */}
              <div className="space-y-4 pt-6 border-t border-border">
                <label className="text-xs font-body font-bold text-muted-foreground uppercase flex items-center gap-2">
                  {isOffPlan
                    ? "Floor Plans & Layouts"
                    : "Floor Plans (Blueprints)"}
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {existingFloorPlans.map((plan, idx) => (
                    <div
                      key={`exist-plan-${idx}`}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted/20 flex items-center justify-center"
                    >
                      <FileText className="w-6 h-6 text-muted-foreground" />
                      <button
                        type="button"
                        onClick={() => removeExistingFile(idx, "floorPlans")}
                        className="absolute inset-0 bg-red-600/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {floorPlanPreviews.map((prev, idx) => (
                    <div
                      key={`new-plan-${idx}`}
                      className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gold/50 border-dashed bg-muted/10 flex items-center justify-center"
                    >
                      <FileText className="w-6 h-6 text-gold" />
                      <button
                        type="button"
                        onClick={() => removeNewFile(idx, "floorPlans")}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-gold flex flex-col items-center justify-center bg-muted/10 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-gold mb-1" />
                    <span className="text-[10px] text-muted-foreground font-bold">
                      ADD PLAN
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(e) => handleNewFilesChange(e, "floorPlans")}
                    />
                  </label>
                </div>
              </div>

              {/* Official Brochure (PDF) */}
              <div className="space-y-4 pt-6 border-t border-border">
                <label className="text-xs font-body font-bold text-muted-foreground uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />{" "}
                  {isOffPlan ? "Project Brochure" : "Official Brochure (PDF)"}
                </label>
                <div className="flex items-center gap-4">
                  {existingTechnicalPdf || newTechnicalPdf ? (
                    <div className="flex-1 flex items-center justify-between bg-gold/10 border border-gold/20 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-5 h-5 text-gold shrink-0" />
                        <span className="text-xs font-bold text-foreground truncate">
                          {newTechnicalPdf
                            ? newTechnicalPdf.name
                            : existingTechnicalPdf
                              ? existingTechnicalPdf.split("/").pop()
                              : "Existing Brochure.pdf"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewTechnicalPdf(null);
                          setExistingTechnicalPdf(null);
                        }}
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
                            setNewTechnicalPdf(e.target.files[0]);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Specs Grid */}
            <div className="bg-background rounded-xl p-8 shadow-sm border border-border space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <Square className="w-5 h-5 text-gold" />
                <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-widest">
                  {isOffPlan ? "Project Specs" : "Dimensions & Specs"}
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {isOffPlan ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                        Unit Types
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1 & 2 BR Apartments"
                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                        value={formData.unitTypes || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            unitTypes: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                        Bedrooms Range
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1-3"
                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                        value={formData.bedrooms || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bedrooms: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                        Bathrooms Range
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 1-3"
                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                        value={formData.bathrooms || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bathrooms: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                        SQFT Range
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 815 - 2350"
                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                        value={formData.area || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, area: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                        Handover Year
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2026"
                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                        value={formData.handoverYear || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            handoverYear: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                        Total Floors
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 24"
                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                        value={formData.totalFloors || ""}
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
                      <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                        Beds
                      </label>
                      <input
                        type="number"
                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                        value={formData.bedrooms || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bedrooms: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                        Baths
                      </label>
                      <input
                        type="number"
                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                        value={formData.bathrooms || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bathrooms: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                        Kitchens
                      </label>
                      <input
                        type="number"
                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                        value={formData.kitchens || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            kitchens: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                        Area (SQFT)
                      </label>
                      <input
                        type="number"
                        className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                        value={formData.area || 0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            area: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {isOffPlan && (
              <div className="bg-background rounded-xl p-8 shadow-sm border border-border space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <DollarSign className="w-5 h-5 text-gold" />
                  <h2 className="font-display font-bold text-lg text-foreground uppercase tracking-widest">
                    Payment Plan (%)
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                      On Booking
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 10"
                      className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                      value={(formData as any).paymentPlanOnBooking || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ["paymentPlanOnBooking" as any]: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                      During Construction
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 40"
                      className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                      value={
                        (formData as any).paymentPlanDuringConstruction || ""
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ["paymentPlanDuringConstruction" as any]:
                            e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                      On Handover
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                      value={(formData as any).paymentPlanOnHandover || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ["paymentPlanOnHandover" as any]: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-background rounded-xl p-6 shadow-sm border border-border space-y-6">
              <h3 className="font-display font-bold text-sm uppercase tracking-widest text-gold text-bold">
                Project Control
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                    Portfolio Segment*
                  </label>
                  <select
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
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
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                    Asset Class*
                  </label>
                  <select
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
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
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase text-gold font-bold flex items-center gap-1">
                    {isOffPlan ? "Starting Price (" : "Price ("}
                    <DirhamIcon size={12} strokeWidth={4} />
                    {")*"}
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full bg-primary text-white border-none rounded-lg px-4 py-3 outline-none font-display font-bold text-xl"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                    Availability Status
                  </label>
                  <select
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-body font-bold text-muted-foreground uppercase">
                    Detail Page Theme
                  </label>
                  <select
                    className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 outline-none font-body text-sm focus:border-gold"
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
                  className="w-full py-6 text-lg"
                  type="submit"
                  disabled={saving}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? "Saving..." : "Update Listing"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  asChild
                  disabled={saving}
                >
                  <Link to="/admin/properties">Cancel</Link>
                </Button>
              </div>
            </div>

            {/* Lifestyle Amenities Selection */}
            <div className="bg-background rounded-xl p-6 shadow-sm border border-border space-y-4">
              <div className="flex items-center gap-2 text-gold">
                <CheckCircle2 className="w-4 h-4" />
                <h3 className="font-display font-bold text-xs uppercase tracking-widest">
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
              <p className="text-[10px] text-muted-foreground">
                Add custom amenities. Press Enter or click Add to include each one.
              </p>
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};

// Redundant import removed

export default EditProperty;
