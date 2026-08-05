import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { api } from "@/lib/api";
import { type Property as PropertyType, formatPrice } from "@/data/properties";
import { Button } from "@/components/ui/button";
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  Building2,
  ArrowLeft,
  Phone,
  Calendar,
  Home,
  Car,
  Utensils,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  FileText,
  X,
  Heart,
  EyeOff,
  Share2,
  Link2,
  Mail,
  Box,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PriceDisplay from "@/components/PriceDisplay";
import DirhamIcon from "@/components/icons/DirhamIcon";
import { countries } from "@/data/countries";
import { cloudinaryUrl } from "@/lib/utils";
import { CountryCodeSelector } from "@/components/CountryCodeSelector";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const PropertyDetails = () => {
  const { slug } = useParams();
  const [property, setProperty] = useState<PropertyType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Enquiry Form State
  const [form, setForm] = useState({
    name: "",
    email: "",
    countryCode: "+971",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    setSubmitting(true);
    try {
      const submissionData = {
        ...form,
        phone: `${form.countryCode} ${form.phone}`,
        propertyId: property.id,
        propertyTitle: property.title,
      };
      await api.post("/api/public/inquiry", { data: submissionData });
      toast.success(
        "Enquiry securely transmitted. Our brokers will contact you shortly.",
      );
      setForm({
        name: "",
        email: "",
        countryCode: "+971",
        phone: "",
        message: "",
      });
    } catch (err) {
      toast.error("Failed to submit enquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const { data } = await api.get(`/api/public/properties/${slug}`);
        if (data && data.property) {
          const p = data.property;
          const mapped: PropertyType = {
            id: p.id,
            slug: p.slug,
            title: p.title,
            description: p.description,
            price: p.price,
            area: p.property_info?.sqft || 0,
            bedrooms: p.property_info?.bed || 0,
            bathrooms: p.property_info?.bath || 0,
            location: p.location || p.address,
            region: p.region,
            areaLocation: p.areaLocation,
            city: p.city,
            type: p.type?.toLowerCase() || "apartment",
            category:
              p.listedIn === "Off-Plan"
                ? "off-plan"
                : p.listedIn === "Rent"
                  ? "rental"
                  : "secondary",
            status: p.status === "active" ? "ready" : "off-plan",
            image:
              p.carousel_thumb?.[0]?.img || "/images/property-placeholder.jpg",
            images: p.carousel_thumb?.map((img: any) => img.img) || [],
            developer: p.developerName || p.owner?.name,
            amenities: p.amenities || [],
            yearBuilt: p.yearBuilt,
            kitchens: p.kitchens,
            garages: p.garages,
            garageSize: p.garageSize,
            floorsNo: p.floorsNo,
            videoUrl: p.videoUrl,
            technicalPdf: p.technicalPdf,
            floorPlans: p.floorPlans || [],
            // Off-plan fields
            unitTypes: p.unitTypes,
            handoverYear: p.handoverYear,
            totalFloors: p.totalFloors,
            paymentPlan: p.paymentPlan,
            theme: p.theme || "default",
          };
          console.log("DEBUG property data:", data.property);
          setProperty(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch property details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchProperty();
  }, [slug]);

  const handleDownload = async (url: string | undefined) => {
    if (!url) return;
    let downloadUrl = url;
    if (!url.startsWith("http")) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
      downloadUrl = `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
    }

    if (downloadUrl.includes("res.cloudinary.com") && downloadUrl.includes("/upload/")) {
      const filename = downloadUrl.split('/').pop()?.split('.')[0] || "Project_Brochure";
      downloadUrl = downloadUrl.replace("/upload/", `/upload/fl_attachment:${filename}/`);
    }

    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      const filename = downloadUrl.split('/').pop() || "Brochure.pdf";
      link.download = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Direct download failed:", error);
      window.open(downloadUrl, "_blank");
    }
  };

  const nextImage = useCallback(() => {
    if (property?.images) {
      setActiveImage((prev) => (prev + 1) % property.images!.length);
    }
  }, [property?.images]);

  const prevImage = () => {
    if (property?.images) {
      setActiveImage(
        (prev) =>
          (prev - 1 + property.images!.length) % property.images!.length,
      );
    }
  };

  // Auto-slide effect
  useEffect(() => {
    if (!property?.images || property.images.length <= 1) return;

    const timer = setInterval(() => {
      nextImage();
    }, 5000);

    return () => clearInterval(timer);
  }, [activeImage, property?.images, nextImage]);

  if (loading) {
    return (
      <Layout>
        <div className="pt-32 pb-20 text-center container mx-auto px-4">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-48 bg-muted/20 rounded mb-4" />
            <div className="h-4 w-64 bg-muted/10 rounded" />
            <div className="mt-12 h-[400px] w-full max-w-4xl bg-muted/5 rounded-2xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="pt-32 pb-20 text-center container mx-auto px-4">
          <h1 className="font-display text-3xl text-foreground mb-4">
            Property Not Found
          </h1>
          <Button variant="gold" asChild>
            <Link to="/properties">Back to Properties</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isOffPlan = property.category === "off-plan";

  if (property.theme === "modern") {
    return <Layout>{renderModernTheme(property, activeImage, setActiveImage, previewImage, setPreviewImage, form, setForm, submitting, handleEnquiry, handleDownload, nextImage, prevImage)}</Layout>;
  }

  if (property.theme === "minimal") {
    return <Layout>{renderMinimalTheme(property, activeImage, setActiveImage, previewImage, setPreviewImage, form, setForm, submitting, handleEnquiry, handleDownload, nextImage, prevImage)}</Layout>;
  }

  if (isOffPlan) {
    return (
      <Layout>
        <div className="pt-24 pb-20 bg-[#F9F9F7] font-body">
          <div className="container mx-auto px-4 max-w-7xl">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] md:text-[11px] font-black tracking-[0.2em] text-stone-500 uppercase mb-6 md:mb-8">
              <Link to="/" className="hover:text-[#0D3430] transition-colors">
                HOME
              </Link>
              <ChevronRight className="w-3 h-3 text-stone-300" />
              <Link
                to="/properties"
                className="hover:text-[#0D3430] transition-colors"
              >
                OFF-PLAN PROPERTIES
              </Link>
              <ChevronRight className="w-3 h-3 text-stone-300" />
              <span className="text-[#0D3430] truncate max-w-[150px] md:max-w-none">
                {property.title}
              </span>
            </nav>
          </div>

          {/* Wider Hero Section */}
          <div className="max-w-[1440px] mx-auto px-2 md:px-4 mb-20 md:mb-24">
            <div className="relative">
              <div className="relative h-[450px] sm:h-[500px] md:h-[650px] w-full bg-stone-100 overflow-hidden shadow-2xl transition-all rounded-[1rem] md:rounded-[1.25rem]">
                <img
                  src={cloudinaryUrl(property.images?.[activeImage] || property.image, { width: 1200 })}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                />

                {/* Top Right Badges */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 flex items-center gap-2">
                  <div className="bg-yellow-400 text-stone-900 rounded-lg shadow-xl px-4 py-1.5 sm:px-6 sm:py-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      {property.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="bg-[#0D3430] rounded-lg shadow-xl px-4 py-1.5 sm:px-6 sm:py-2">
                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                      OFF-PLAN
                    </span>
                  </div>
                </div>

                <div className="absolute top-16 md:top-24 left-4 sm:left-8 md:left-16 right-4 sm:right-8 md:right-16 drop-shadow-sm">
                  <div className="max-w-full overflow-hidden space-y-4 sm:space-y-6">
                    <h1 className="font-display text-[1.5rem] sm:text-[2.25rem] md:text-[3rem] lg:text-[3.5rem] font-bold text-primary tracking-tight leading-tight bg-white/30 backdrop-blur-md w-fit max-w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 rounded-[1.5rem] border border-white/20 shadow-sm whitespace-nowrap overflow-hidden text-ellipsis">
                      {property.title}
                    </h1>

                    <div className="flex items-center gap-2 sm:gap-3 text-stone-800 font-bold bg-white/95 backdrop-blur-md w-full sm:w-max max-w-full px-3 py-2 sm:px-6 sm:py-3 rounded-[1rem] shadow-xl border border-stone-100/50 overflow-hidden">
                      <div className="bg-[#EAD1B6]/30 p-1.5 sm:p-2 rounded-full shrink-0">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-[#DDB57A]" />
                      </div>
                      <span className="font-body text-xs sm:text-sm md:text-base pr-2 truncate">
                        {property.address || property.location}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Specs Bar - Refined according to visual design */}
              <div className="relative mx-auto -mt-16 z-20 md:mt-0 md:absolute md:-bottom-10 md:left-1/2 md:-translate-x-1/2 w-[95%] md:w-[90%] bg-white/95 backdrop-blur-3xl rounded-[1rem] md:rounded-[1.25rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] py-6 md:py-8 px-4 sm:px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-y-8 md:gap-y-0 md:divide-x divide-stone-100 transition-all border border-stone-100/50">
                <div className="flex flex-col items-center md:items-start md:pl-4 justify-center">
                  <div className="flex items-center gap-4 mb-1">
                    <Bed
                      className="w-5 h-5 md:w-6 md:h-6 text-[#DDB57A]"
                      strokeWidth={1.5}
                    />
                    <span className="font-display font-medium text-[1.75rem] md:text-[2rem] text-[#0D3430] leading-none tracking-tight">
                      {property.bedrooms}
                    </span>
                  </div>
                  <span className="text-[12px] font-medium text-stone-600 capitalize md:ml-10">
                    Bedrooms
                  </span>
                </div>

                <div className="flex flex-col items-center md:items-start md:pl-12 justify-center">
                  <div className="flex items-center gap-4 mb-1">
                    <Bath
                      className="w-5 h-5 md:w-6 md:h-6 text-[#DDB57A]"
                      strokeWidth={1.5}
                    />
                    <span className="font-display font-medium text-[1.75rem] md:text-[2rem] text-[#0D3430] leading-none tracking-tight">
                      {property.bathrooms}
                    </span>
                  </div>
                  <span className="text-[12px] font-medium text-stone-600 capitalize md:ml-10">
                    Bathrooms
                  </span>
                </div>

                <div className="flex flex-col items-center md:items-start md:pl-12 justify-center">
                  <div className="flex items-center gap-2 sm:gap-4 mb-1">
                    <DirhamIcon className="w-5 h-5 md:w-6 md:h-6 text-[#DDB57A]" />
                    <div className="flex flex-col text-left">
                      <span className="text-[10px] md:text-[11px] font-medium text-stone-600 mb-0.5 leading-none">
                        Starting from
                      </span>
                      <span className="font-display font-medium text-[1.25rem] md:text-[1.5rem] text-[#0D3430] leading-none tracking-tight whitespace-nowrap">
                        {property.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-start md:pl-12 justify-center">
                  <div className="flex items-center gap-4 mb-1">
                    <Maximize
                      className="w-5 h-5 md:w-6 md:h-6 text-[#DDB57A]"
                      strokeWidth={1.5}
                    />
                    <span className="font-display font-medium text-[1.75rem] md:text-[2rem] text-[#0D3430] leading-none tracking-tight">
                      {property.area}
                    </span>
                  </div>
                  <span className="text-[12px] font-medium text-stone-600 lowercase md:ml-10">
                    sq.ft.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 max-w-7xl">
            {/* Content Section */}
            <div className="mt-12 md:mt-20 space-y-16">
              {/* Project Overview */}
              <div className="space-y-4">
                <h2 className="font-display text-[2.5rem] font-bold text-[#0D3430] tracking-tight">
                  Project Overview
                </h2>
                <p className="text-stone-600 font-body leading-relaxed text-[15px] w-full max-w-none text-justify whitespace-pre-line">
                  {property.description}
                </p>

                {property.videoUrl && (
                  <div className="mt-16 rounded-[1.5rem] overflow-hidden shadow-2xl border-8 border-white aspect-video relative group">
                    <iframe
                      className="w-full h-full"
                      src={property.videoUrl.replace("watch?v=", "embed/")}
                      title="Project Virtual Tour"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                    <div className="absolute top-10 left-10 bg-[#0D3430] text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md">
                      Interactive Cinematic Tour
                    </div>
                  </div>
                )}

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                  {/* 1. Payment Plan */}
                  <div className="bg-white rounded-[1rem] p-8 shadow-sm border border-stone-100 flex flex-col hover:shadow-lg transition-shadow">
                    <h3 className="font-display text-[1.4rem] font-bold text-[#0D3430] mb-8 leading-none">
                      Payment Plan
                    </h3>
                    <div className="space-y-6 flex-1">
                      <div className="space-y-3 pb-3 border-b border-stone-100 group">
                        <div className="flex justify-between items-center text-stone-800">
                          <span className="text-[13px] font-medium text-stone-600">
                            On Booking
                          </span>
                          <span className="font-display font-black text-xl text-stone-900 group-hover:text-gold transition-colors">
                            {property.paymentPlan?.onBooking}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0D3430]"
                            style={{
                              width: `${property.paymentPlan?.onBooking}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-3 pb-3 border-b border-stone-100 group">
                        <div className="flex justify-between items-center text-stone-800">
                          <span className="text-[13px] font-medium text-stone-600">
                            During Construction
                          </span>
                          <span className="font-display font-black text-xl text-stone-900 group-hover:text-gold transition-colors">
                            {property.paymentPlan?.duringConstruction ?? 40}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0D3430]"
                            style={{
                              width: `${property.paymentPlan?.duringConstruction ?? 40}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-3 pb-3 group">
                        <div className="flex justify-between items-center text-stone-800">
                          <span className="text-[13px] font-medium text-stone-600">
                            On Handover
                          </span>
                          <span className="font-display font-black text-xl text-stone-900 group-hover:text-gold transition-colors">
                            {property.paymentPlan?.onHandover ?? 50}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0D3430]"
                            style={{
                              width: `${property.paymentPlan?.onHandover ?? 50}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Technical Profile (Redesigned as Project Overview) */}
                  <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-stone-100 h-full flex flex-col hover:shadow-lg transition-all duration-500">
                    <div className="mb-8">
                      <h3 className="font-display text-[1.5rem] md:text-[1.75rem] font-bold text-[#0D3430] leading-none mb-3">
                        Project Overview
                      </h3>
                      <div className="w-12 h-[2px] bg-[#0D3430]" />
                    </div>

                    <div className="space-y-8 flex-1">
                      <div className="flex items-center justify-between border-b border-stone-50 pb-6 group">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-stone-100 transition-colors">
                            <Building2 className="w-5 h-5 text-[#DDB57A]" />
                          </div>
                          <span className="text-[14px] font-medium text-stone-600">
                            Developer
                          </span>
                        </div>
                        <span className="font-display font-bold text-lg text-stone-900">
                          {property.developer || "TBA"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-stone-50 pb-6 group">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-stone-100 transition-colors">
                            <Calendar className="w-5 h-5 text-[#DDB57A]" />
                          </div>
                          <span className="text-[14px] font-medium text-stone-600">
                            Expected Handover
                          </span>
                        </div>
                        <span className="font-display font-bold text-lg text-stone-900">
                          {property.handoverYear || "TBA"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between border-b border-stone-50 pb-6 group">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-stone-100 transition-colors">
                            <Layers className="w-5 h-5 text-[#DDB57A]" />
                          </div>
                          <span className="text-[14px] font-medium text-stone-600">
                            Total Floors
                          </span>
                        </div>
                        <span className="font-display font-bold text-lg text-stone-900">
                          {property.totalFloors || "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-stone-100 transition-colors">
                            <Home className="w-5 h-5 text-[#DDB57A]" />
                          </div>
                          <span className="text-[14px] font-medium text-stone-600">
                            Development Type
                          </span>
                        </div>
                        <span className="font-display font-bold text-lg text-stone-900">
                          {property.type.charAt(0).toUpperCase() +
                            property.type.slice(1)}
                        </span>
                      </div>
                    </div>

                    <Button
                      asChild
                      className="w-full mt-12 bg-[#0D3430] hover:bg-[#06201e] text-white rounded-[0.5rem] h-14 font-bold uppercase tracking-[0.2em] text-[11px] flex items-center justify-between px-8 transition-all border-none shadow-xl shadow-[#0D3430]/10"
                    >
                      <a href="/contact">
                        <span>ENQUIRE NOW</span>
                        <ChevronRight
                          className="w-[16px] h-[16px]"
                          strokeWidth={3}
                        />
                      </a>
                    </Button>
                  </div>

                  {/* 3. Lifestyle Amenities */}
                  {(() => {
                    const filteredAmenities = (property.amenities || [])
                      .flatMap((a) =>
                        typeof a === "string" ? a.split(",") : [a],
                      )
                      .map((a) => (typeof a === "string" ? a.trim() : a));

                    if (filteredAmenities.length === 0) return null;

                    return (
                      <div className="bg-white rounded-[1rem] p-8 shadow-sm border border-stone-100 h-full hover:shadow-lg transition-shadow">
                        <h3 className="font-display text-[1.4rem] font-bold text-[#0D3430] mb-8 leading-none">
                          Lifestyle Amenities
                        </h3>
                        <div className="flex flex-col gap-5">
                          {filteredAmenities.slice(0, 8).map((amenity, idx) => {
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-4 group"
                              >
                                <svg
                                  className="w-[14px] h-[14px] text-stone-700 shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <span className="text-[14px] font-medium text-stone-600 truncate group-hover:text-[#0D3430] transition-colors">
                                  {amenity}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Extended Sections */}
              <div className="mt-20 space-y-16">
                {/* Location Map */}
                <div className="bg-white rounded-[1.5rem] p-8 md:p-12 shadow-sm border border-stone-100">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-[3px] bg-gold rounded-full" />
                    <h3 className="font-display text-3xl font-black text-stone-900 tracking-tight">
                      Prime Location
                    </h3>
                  </div>
                  <div className="h-[500px] w-full rounded-[1rem] overflow-hidden border border-stone-100 shadow-inner">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      scrolling="no"
                      marginHeight={0}
                      marginWidth={0}
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        [
                          property.location,
                          property.areaLocation,
                          property.region,
                          property.city,
                        ]
                          .filter(Boolean)
                          .join(", "),
                      )}&t=&z=14&ie=UTF8&iwloc=B&output=embed`}
                    ></iframe>
                  </div>
                </div>

                {/* Gallery Showcase */}
                {property.images && property.images.length > 0 && (
                  <div className="bg-white rounded-[1.5rem] p-8 md:p-12 shadow-sm border border-stone-100">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-[3px] bg-gold rounded-full" />
                      <h3 className="font-display text-3xl font-black text-stone-900 tracking-tight">
                        Project Visual Anthology
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      {property.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-[4/3] group cursor-pointer overflow-hidden rounded-[1rem] border border-stone-50"
                          onClick={() => {
                            setActiveImage(idx);
                            setPreviewImage(img);
                          }}
                        >
                          <img
                            src={cloudinaryUrl(img, { width: 400, height: 300 })}
                            alt={`${property.title} - Render ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                            <span className="text-white text-[10px] font-black uppercase tracking-[0.3em] bg-[#0D3430]/90 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border border-white/10 scale-90 group-hover:scale-100 transition-transform">
                              Expand View
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Floor Plans */}
                {property.floorPlans && property.floorPlans.length > 0 && (
                  <div className="bg-white rounded-[1.5rem] p-8 md:p-12 shadow-sm border border-stone-100">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-[3px] bg-gold rounded-full" />
                      <h3 className="font-display text-3xl font-black text-stone-900 tracking-tight">
                        Architectural Blueprints
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {property.floorPlans.map((plan, idx) => (
                        <div
                          key={idx}
                          className="p-10 rounded-[1.25rem] border border-stone-100 bg-stone-50/50 flex flex-col items-center gap-6 group hover:border-gold/30 hover:bg-white transition-all cursor-pointer shadow-sm hover:shadow-xl"
                          onClick={() => setPreviewImage(plan)}
                        >
                          <div className="w-full h-64 overflow-hidden rounded-xl">
                            <img
                              src={cloudinaryUrl(plan, { width: 800 })}
                              alt={`Floor Plan ${idx + 1}`}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                              loading="lazy"
                            />
                          </div>
                          <span className="text-[11px] font-black text-stone-400 group-hover:text-gold uppercase tracking-[0.3em] transition-colors">
                            Floor Plan Layout Index 0{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Official Brochure (PDF) - Off-Plan View */}
                {property.technicalPdf && property.technicalPdf !== "null" && property.technicalPdf.trim() !== "" && (
                  <div className="bg-white rounded-[1.5rem] p-8 md:p-12 shadow-sm border border-stone-100 flex flex-col items-center text-center">
                    <div className="flex items-center gap-4 mb-6 justify-center">
                      <div className="w-12 h-[3px] bg-gold rounded-full" />
                      <h3 className="font-display text-3xl font-black text-stone-900 tracking-tight">
                        Project Brochure
                      </h3>
                      <div className="w-12 h-[3px] bg-gold rounded-full" />
                    </div>
                    <p className="text-stone-500 font-body text-sm mb-8 max-w-lg">
                      Download the official project brochure to view full floor
                      plans, payment details, and technical specifications.
                    </p>
                    <button
                      onClick={() => handleDownload(property.technicalPdf)}
                      className="flex items-center gap-4 bg-[#0D3430] hover:bg-[#06201e] text-white font-bold uppercase tracking-[0.2em] text-[12px] px-12 py-5 rounded-full transition-all shadow-2xl hover:shadow-[0_20px_40px_-15px_rgba(13,52,48,0.4)] group"
                    >
                      <FileText className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
                      Download Official Brochure (PDF)
                    </button>
                  </div>
                )}

                {/* Contact Section */}
                <div
                  id="enquire"
                  className="bg-[#0D3430] rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-20 text-white shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -mr-64 -mt-64 blur-[100px] pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gold/5 rounded-full -ml-64 -mb-64 blur-[100px] pointer-events-none" />

                  <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
                    <div>
                      <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-black mb-6 md:mb-8 leading-[1.1] tracking-tighter">
                        Experience <br />{" "}
                        <span className="text-gold">Dubai's Future</span>
                      </h2>
                      <p className="text-white/60 font-body text-base md:text-xl mb-8 md:mb-12 max-w-lg leading-relaxed">
                        Register your interest today to receive exclusive
                        whitepapers, private pricing tables, and VIP launch
                        event access.
                      </p>
                      <div className="space-y-4 md:space-y-6">
                        <div className="flex flex-col gap-3 md:gap-5">
                          {[
                            { flag: "🇦🇪", num: "+971 58 825 1088", wa: "971588251088", tel: "+971588251088" },
                            { flag: "🇦🇪", num: "+971 58 153 0100", wa: "971581530100", tel: "+971581530100" },
                            { flag: "🇮🇳", num: "+91 76786 51405", wa: "917678651405", tel: "+917678651405" },
                          ].map((contact, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 md:p-3 rounded-xl border border-white/10 bg-white/5 group hover:border-gold/30 transition-all">
                              <div className="flex items-center gap-2 md:gap-3 text-white/90 font-body text-xs md:text-sm">
                                <span className="text-base md:text-base shrink-0">{contact.flag}</span>
                                <span className="font-medium whitespace-nowrap tracking-wide">{contact.num}</span>
                              </div>
                              <div className="flex items-center gap-2 md:gap-2.5 ml-1">
                                <a
                                  href={`https://wa.me/${contact.wa}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-all shadow-sm"
                                  title="WhatsApp Business"
                                >
                                  <WhatsAppIcon className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                </a>
                                {contact.tel && (
                                  <a
                                    href={`tel:${contact.tel}`}
                                    className="w-6 h-6 md:w-7 md:h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-white hover:text-white transition-all"
                                    title="Call Now"
                                  >
                                    <Phone className="w-3 h-3 md:w-3.5 md:h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <form
                      onSubmit={handleEnquiry}
                      className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-12 space-y-5 md:space-y-6 shadow-2xl"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-1 md:space-y-2">
                          <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            className="w-full bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-stone-900 text-sm focus:border-gold outline-none transition-all shadow-inner"
                            value={form.name}
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1 md:space-y-2">
                          <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            required
                            className="w-full bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-stone-900 text-sm focus:border-gold outline-none transition-all shadow-inner"
                            value={form.email}
                            onChange={(e) =>
                              setForm({ ...form, email: e.target.value })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          required
                          className="w-full bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-stone-900 text-sm focus:border-gold outline-none transition-all shadow-inner"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1 md:space-y-2">
                        <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">
                          Personal Message
                        </label>
                        <textarea
                          rows={3}
                          className="w-full bg-stone-50 border border-stone-100 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 text-stone-900 text-sm focus:border-gold outline-none transition-all resize-none shadow-inner"
                          placeholder="I'm interested in this project..."
                          value={form.message}
                          onChange={(e) =>
                            setForm({ ...form, message: e.target.value })
                          }
                        />
                      </div>
                      <Button
                        disabled={submitting}
                        className="w-full bg-[#0D3430] hover:bg-gold text-white rounded-[1.5rem] h-12 md:h-16 text-[11px] md:text-base font-black uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-xl shadow-[#0D3430]/10 transition-all active:scale-95"
                      >
                        {submitting
                          ? "Connecting..."
                          : "Get Priority Access"}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>

              {/* Global Image Preview Lightbox */}
              <AnimatePresence>
                {previewImage && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 md:p-10"
                    onClick={() => setPreviewImage(null)}
                  >
                    <motion.button
                      className="absolute top-10 right-10 p-5 text-white/30 hover:text-white transition-colors z-[110]"
                      whileHover={{ rotate: 90, scale: 1.2 }}
                      onClick={() => setPreviewImage(null)}
                    >
                      <X className="w-10 h-10" />
                    </motion.button>

                    <motion.div
                      className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center p-4"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      transition={{
                        type: "spring",
                        damping: 30,
                        stiffness: 200,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={cloudinaryUrl(previewImage, { width: 1400 })}
                        alt="High Definition Preview"
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5"
                      />

                      {/* Overlay labels if it's a floor plan */}
                      {property.floorPlans?.includes(previewImage) && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gold/90 backdrop-blur-xl px-10 py-4 rounded-full shadow-2xl border border-white/20">
                          <span className="text-xs font-black text-[#0D3430] uppercase tracking-[0.3em]">
                            Architectural Blueprint Overview
                          </span>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const categoryLabel = {
    "off-plan": "Off-Plan",
    secondary: "Resale",
    rental: "Rental",
  };

  return (
    <Layout>
      <div className="pt-20">
        {/* Gallery Hero */}
        <div className="relative h-[60vh] md:h-[75vh] w-full bg-black overflow-hidden group">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              src={property.images?.[activeImage] || property.image}
              alt={property.title}
              className="w-full h-full object-cover opacity-80 cursor-zoom-in"
              onClick={() =>
                setPreviewImage(
                  property.images?.[activeImage] || property.image,
                )
              }
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 pointer-events-none" />

          {/* Gallery Controls */}
          {property.images && property.images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-gold transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-gold transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                {property.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`h-1 rounded-full transition-all ${idx === activeImage ? "w-8 bg-gold" : "w-2 bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute top-10 left-6 flex items-center gap-4">
            <Button
              variant="hero-outline"
              size="sm"
              asChild
              className="backdrop-blur-md bg-white/5 border-white/20"
            >
              <Link to="/properties">
                <ArrowLeft className="w-4 h-4 mr-2" /> All Properties
              </Link>
            </Button>
            <Badge className="bg-gold text-accent-foreground font-display py-1.5 px-4 rounded-full tracking-widest text-[10px] uppercase font-black">
              {categoryLabel[property.category]}
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <div className="container mx-auto px-4 lg:px-8 -mt-24 relative z-20 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background/80 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/10"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                  <div>
                    <h1 className="font-display text-4xl md:text-5xl font-black text-foreground tracking-tighter mb-4">
                      {property.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 text-muted-foreground font-body">
                      <div className="p-2 rounded-lg bg-gold/10 shrink-0">
                        <MapPin className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-sm font-medium tracking-wide">
                        {[
                          property.location,
                          property.areaLocation,
                          property.region,
                          property.city,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </span>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">
                      Asking Price
                    </p>
                    <div className="font-display text-4xl md:text-5xl font-black text-foreground">
                      <PriceDisplay
                        price={property.price}
                        category={property.category}
                        iconSize={32}
                        iconClassName="w-8 h-8 md:w-10 md:h-10 inline-block mr-1 mb-1.5 opacity-80"
                      />
                    </div>
                  </div>
                </div>

                {/* Core Specs Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-muted/30 rounded-3xl border border-border/50">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center mb-3 shadow-inner">
                      <Bed className="w-5 h-5 text-gold" />
                    </div>
                    <p className="font-display text-xl font-black text-foreground">
                      {property.category === "off-plan"
                        ? property.unitTypes || "Various"
                        : property.bedrooms === 0
                          ? "Studio"
                          : property.bedrooms}
                    </p>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      {property.category === "off-plan"
                        ? "Unit Types"
                        : property.bedrooms === 0
                          ? "Unit Type"
                          : "Bedrooms"}
                    </p>
                  </div>
                  {property.category !== "off-plan" &&
                    Number(property.bathrooms) > 0 && (
                      <div className="flex flex-col items-center border-l border-border/50">
                        <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center mb-3 shadow-inner">
                          <Bath className="w-5 h-5 text-gold" />
                        </div>
                        <p className="font-display text-xl font-black text-foreground">
                          {property.bathrooms}
                        </p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                          Bathrooms
                        </p>
                      </div>
                    )}
                  {property.category === "off-plan" &&
                    property.handoverYear && (
                      <div className="flex flex-col items-center border-l border-border/50">
                        <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center mb-3 shadow-inner">
                          <Calendar className="w-5 h-5 text-gold" />
                        </div>
                        <p className="font-display text-xl font-black text-foreground">
                          {property.handoverYear}
                        </p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                          Handover
                        </p>
                      </div>
                    )}
                  {Number(property.area) > 0 && (
                    <div className="flex flex-col items-center border-l border-border/50">
                      <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center mb-3 shadow-inner">
                        <Maximize className="w-5 h-5 text-gold" />
                      </div>
                      <p className="font-display text-xl font-black text-foreground">
                        {typeof property.area === "number"
                          ? property.area.toLocaleString()
                          : property.area}
                      </p>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        Sq. Ft.
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col items-center border-l border-border/50">
                    <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center mb-3 shadow-inner">
                      <Home className="w-5 h-5 text-gold" />
                    </div>
                    <p className="font-display text-base font-black text-foreground capitalize">
                      {property.type}
                    </p>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      Type
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-12">
                  <h2 className="font-display text-2xl font-black text-foreground mb-6 flex items-center gap-3 uppercase tracking-tighter">
                    <div className="w-8 h-1 bg-gold rounded-full" />
                    Property Narrative
                  </h2>
                  <div className="prose prose-stone max-w-none w-full">
                    <p className="text-muted-foreground font-body leading-[1.8] text-base whitespace-pre-line text-justify w-full max-w-none">
                      {property.description ||
                        `Experience high-end urban living in this pristine ${property.type}. Located in the heart of ${property.location}, this residence combines architectural excellence with panoramic views.`}
                    </p>
                  </div>
                </div>

                {/* Payment Plan for Off-Plan */}
                {property.category === "off-plan" && property.paymentPlan && (
                  <div className="mt-12 pt-12 border-t border-border">
                    <h2 className="font-display text-2xl font-black text-foreground mb-8 uppercase tracking-tighter flex items-center gap-3">
                      <div className="w-7 h-7 flex items-center justify-center text-gold shrink-0 border border-gold/40 rounded-[4px] p-0.5">
                        <DirhamIcon className="w-full h-full" />
                      </div>{" "}
                      Payment Strategy
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-2xl bg-gold/5 border border-gold/10">
                        <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-2">
                          On Booking
                        </p>
                        <p className="font-display text-3xl font-black text-foreground">
                          {property.paymentPlan.onBooking}%
                        </p>
                      </div>
                      <div className="p-6 rounded-2xl bg-muted/30 border border-border text-center md:text-left">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
                          During Construction
                        </p>
                        <p className="font-display text-3xl font-black text-foreground">
                          {property.paymentPlan.duringConstruction}%
                        </p>
                      </div>
                      <div className="p-6 rounded-2xl bg-muted/30 border border-border text-center md:text-left">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">
                          On Handover
                        </p>
                        <p className="font-display text-3xl font-black text-foreground">
                          {property.paymentPlan.onHandover}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Technical Specs */}
                <div className="mt-12 pt-12 border-t border-border">
                  <h2 className="font-display text-2xl font-black text-foreground mb-8 uppercase tracking-tighter">
                    Technical Profile
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    {property.developer && (
                      <div className="flex items-center gap-4">
                        <Building2 className="w-5 h-5 text-[#0D3430]" />
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Developer
                          </p>
                          <p className="text-sm font-bold">{property.developer}</p>
                        </div>
                      </div>
                    )}
                    {Number(property.yearBuilt) > 0 && (
                      <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-[#0D3430]" />
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            {property.category === "off-plan"
                              ? "Target Handover"
                              : "Year Built"}
                          </p>
                          <p className="text-sm font-bold">
                            {property.category === "off-plan"
                              ? property.handoverYear
                              : property.yearBuilt}
                          </p>
                        </div>
                      </div>
                    )}
                    {Number(property.kitchens) > 0 && (
                      <div className="flex items-center gap-4">
                        <Utensils className="w-5 h-5 text-[#0D3430]" />
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Kitchens
                          </p>
                          <p className="text-sm font-bold">
                            {property.kitchens}
                          </p>
                        </div>
                      </div>
                    )}
                    {Number(property.garages) > 0 && (
                      <div className="flex items-center gap-4">
                        <Car className="w-5 h-5 text-[#0D3430]" />
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Parking
                          </p>
                          <p className="text-sm font-bold">
                            {property.garages}{" "}
                            {property.garageSize
                              ? `(${property.garageSize} sqft)`
                              : "Spaces"}
                          </p>
                        </div>
                      </div>
                    )}
                    {Number(property.floorsNo) > 0 && (
                      <div className="flex items-center gap-4">
                        <Layers className="w-5 h-5 text-[#0D3430]" />
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            Total Floors
                          </p>
                          <p className="text-sm font-bold">
                            {property.floorsNo}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Amenities */}
                {(() => {
                  const filteredAmenities = (property.amenities || [])
                    .flatMap((a) =>
                      typeof a === "string" ? a.split(",") : [a],
                    )
                    .map((a) => (typeof a === "string" ? a.trim() : a));

                  if (filteredAmenities.length === 0) return null;

                  return (
                    <div className="mt-12 pt-12 border-t border-border">
                      <h2 className="font-display text-2xl font-black text-foreground mb-8 uppercase tracking-tighter">
                        Lifestyle Amenities
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {filteredAmenities.map((amenity, idx) => {
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-4 p-4 rounded-2xl bg-[#0D3430]/5 border border-[#0D3430]/10 group hover:border-gold/30 hover:bg-white transition-all shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4 text-[#0D3430] shrink-0 fill-none" />
                              <span className="text-[10px] font-black text-stone-600 group-hover:text-[#0D3430] transition-colors uppercase tracking-widest truncate">
                                {amenity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                {/* Location Map */}
                <div className="mt-12 pt-12 border-t border-border">
                  <h2 className="font-display text-2xl font-black text-foreground mb-8 uppercase tracking-tighter flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-gold" /> Location Map
                  </h2>
                  <div className="w-full bg-muted/20 rounded-xl overflow-hidden border border-border h-[400px]">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(
                        [
                          property.location,
                          property.areaLocation,
                          property.region,
                          property.city,
                        ]
                          .filter(Boolean)
                          .join(", "),
                      )}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                    ></iframe>
                  </div>
                </div>

                {/* All Images Grid */}
                {property.images && property.images.length > 0 && (
                  <div className="mt-12 pt-12 border-t border-border">
                    <h2 className="font-display text-2xl font-black text-foreground mb-8 uppercase tracking-tighter">
                      Visual Showcase
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {property.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-[4/3] group cursor-pointer overflow-hidden rounded-xl border border-border"
                          onClick={() => {
                            setActiveImage(idx);
                            setPreviewImage(img);
                          }}
                        >
                          <img
                            src={cloudinaryUrl(img, { width: 400, height: 300 })}
                            alt={`${property.title} - Space ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Maximize className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Blueprints Grid Section (Floor Plans) */}
              {property.floorPlans && property.floorPlans.length > 0 && (
                <div className="bg-background/80 backdrop-blur-2xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/10 mt-8">
                  <h2 className="font-display text-2xl font-black text-foreground mb-8 flex items-center gap-3 uppercase tracking-tighter">
                    <div className="w-8 h-1 bg-gold rounded-full" />
                    Architectural Floor Plans (Blueprints)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {property.floorPlans.map((plan, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-zoom-in overflow-hidden rounded-xl border border-border bg-muted/30 aspect-video flex items-center justify-center"
                        onClick={() => setPreviewImage(plan)}
                      >
                        <img
                          src={cloudinaryUrl(plan, { width: 800 })}
                          alt={`Floor Plan ${idx + 1}`}
                          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                          <Maximize className="w-8 h-8 mb-2" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-center px-4 leading-normal">
                            Expand Blueprint {idx + 1}
                          </span>
                        </div>
                        <div className="absolute top-4 right-4 bg-primary/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest group-hover:text-gold transition-colors">
                            Plan {idx + 1}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Brochure (PDF) - Regular Property View */}
              {property.technicalPdf && property.technicalPdf !== "null" && property.technicalPdf.trim() !== "" && (
                <div className="bg-background/80 backdrop-blur-2xl rounded-3xl shadow-xl p-8 md:p-12 border border-white/10 mt-8 flex flex-col items-center text-center">
                  <div className="flex items-center gap-4 mb-6 justify-center">
                    <div className="w-8 h-1 bg-gold rounded-full" />
                    <h2 className="font-display text-2xl font-black text-foreground uppercase tracking-tighter">
                      Official Brochure
                    </h2>
                    <div className="w-8 h-1 bg-gold rounded-full" />
                  </div>
                  <p className="text-muted-foreground font-body text-sm mb-8 max-w-lg">
                    Access the complete technical documentation and
                    specifications for this property.
                  </p>
                  <Button
                    variant="gold"
                    className="rounded-full px-16 py-8 font-bold uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:shadow-gold/20 group"
                    onClick={() => handleDownload(property.technicalPdf)}
                  >
                    <FileText className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                    Download Brochure (PDF)
                  </Button>
                </div>
              )}
            </div>

            {/* Sticky Interaction Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                <div className="bg-background rounded-3xl p-8 border border-border shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16 blur-3xl" />

                  <h3 className="font-display font-black text-xs uppercase tracking-[0.3em] text-gold mb-6">
                    Expert Consultation
                  </h3>

                  <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center font-display font-black text-white text-xl">
                      V
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Portfolio Manager
                      </p>
                      <p className="font-bold text-foreground">Vikas Kumar</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <form
                      onSubmit={handleEnquiry}
                      className="flex flex-col gap-3"
                    >
                      <input
                        required
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-body outline-none focus:border-gold transition-colors"
                        placeholder="Full Name *"
                      />
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-body outline-none focus:border-gold transition-colors"
                        placeholder="Email Address *"
                      />
                      <div className="flex gap-2">
                        <CountryCodeSelector
                          value={form.countryCode}
                          onChange={(value) =>
                            setForm({ ...form, countryCode: value })
                          }
                          className="w-[130px] rounded-xl h-[46px]"
                          isDark
                        />
                        <input
                          required
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                          className="flex-1 bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-body outline-none focus:border-gold transition-colors"
                          placeholder="Phone Number *"
                        />
                      </div>
                      <textarea
                        required
                        rows={3}
                        value={form.message}
                        onChange={(e) =>
                          setForm({ ...form, message: e.target.value })
                        }
                        className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-body outline-none focus:border-gold transition-colors resize-none mb-1"
                        placeholder="I am interested in this property..."
                      />
                    </form>

                    <div className="space-y-3">
                      {[
                        { flag: "🇦🇪", num: "+971 58 825 1088", wa: "971588251088", tel: "+971588251088" },
                        { flag: "🇦🇪", num: "+971 58 153 0100", wa: "971581530100", tel: "+971581530100" },
                        { flag: "🇮🇳", num: "+91 76786 51405", wa: "917678651405" },
                      ].map((contact, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 group hover:border-gold/30 transition-all">
                          <div className="flex items-center gap-3 text-foreground/90 font-body text-sm">
                            <span className="text-base shrink-0">{contact.flag}</span>
                            <span className="font-medium whitespace-nowrap tracking-wide">{contact.num}</span>
                          </div>
                          <div className="flex items-center gap-2.5 ml-1">
                            <a
                              href={`https://wa.me/${contact.wa}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-all shadow-sm"
                              title="WhatsApp Business"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5" />
                            </a>
                            {contact.tel && (
                              <a
                                href={`tel:${contact.tel}`}
                                className="w-7 h-7 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-all"
                                title="Call Now"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 flex justify-center gap-6 border-t border-border mt-2">
                      <a
                        href="mailto:info@omnisrealty.com"
                        className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
                      >
                         <Mail className="w-5 h-5" /> info@omnisrealty.com
                      </a>
                    </div>
                  </div>
                </div>

                {property.videoUrl && (
                  <div className="bg-primary text-white rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl shadow-primary/30 group">
                    <div className="relative">
                      <PlayCircle className="w-12 h-12 text-gold mb-4 group-hover:scale-110 transition-transform" />
                      <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl scale-150 animate-pulse" />
                    </div>
                    <h3 className="font-display font-black text-lg uppercase mb-2">
                      Cinematic Video Tour
                    </h3>
                    <p className="text-white/60 text-xs mb-6 px-4">
                      Experience the spatial atmosphere through our professional
                      4K virtual walkthrough.
                    </p>
                    <Button
                      variant="gold"
                      className="rounded-full px-10 py-6"
                      asChild
                    >
                      <a
                        href={property.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Enter Virtual Experience
                      </a>
                    </Button>
                  </div>
                )}

                <div className="bg-primary/5 rounded-3xl p-8 border border-gold/10">
                  <Building2 className="w-8 h-8 text-gold mb-4" />
                  <h4 className="font-display font-black text-sm uppercase mb-2">
                    Investment Security
                  </h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    All property transactions are handled through RERA-regulated
                    escrow accounts ensuring full investor protection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Image Preview Lightbox */}
        <AnimatePresence>
          {previewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10"
              onClick={() => setPreviewImage(null)}
            >
              <motion.button
                className="absolute top-6 right-6 p-4 text-white/50 hover:text-white transition-colors z-[110]"
                whileHover={{ rotate: 90 }}
                onClick={() => setPreviewImage(null)}
              >
                <X className="w-8 h-8" />
              </motion.button>

              <motion.div
                className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center p-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={cloudinaryUrl(previewImage, { width: 1400 })}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                />

                {/* Overlay labels if it's a floor plan */}
                {property.floorPlans?.includes(previewImage) && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gold/90 backdrop-blur-md px-6 py-2 rounded-full">
                    <span className="text-[10px] font-black text-accent-foreground uppercase tracking-[0.2em]">
                      Technical Blueprint View
                    </span>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-20" />
      </div>
    </Layout>
  );
};

function renderModernTheme(
  property: PropertyType,
  activeImage: number,
  setActiveImage: (n: number) => void,
  previewImage: string | null,
  setPreviewImage: (s: string | null) => void,
  form: { name: string; email: string; countryCode: string; phone: string; message: string },
  setForm: (f: any) => void,
  submitting: boolean,
  handleEnquiry: (e: React.FormEvent) => Promise<void>,
  handleDownload: (url: string | undefined) => Promise<void>,
  nextImage: () => void,
  prevImage: () => void,
) {
  const images = property.images && property.images.length > 0 ? property.images : [property.image];
  const gridImages = [...images];
  while (gridImages.length < 5) {
    gridImages.push(gridImages[gridImages.length % images.length]);
  }

  const agentName = "Avenew Development";
  const agentPhone = "+971 58 825 1088";
  const agentEmail = "info@omnisrealty.com";

  const pricePerSqft = property.area ? Math.round(property.price / property.area) : 83;
  const homiqEstimate = Math.round(property.price * 0.5);

  const filteredAmenities = (property.amenities || []).flatMap((a) =>
    typeof a === "string" ? a.split(",") : [a],
  ).map((a) => typeof a === "string" ? a.trim() : a);

  return (
    <div className="bg-[#f8f9fa] min-h-screen font-body text-stone-900 pt-20 pb-20">
      {/* Top Navigation Sub-header / Section Tabs */}
      <div className="bg-white border-b border-stone-200 py-3 mb-6 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-wrap items-center justify-between gap-4">
          {/* Section Tabs */}
          <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm font-semibold text-stone-600 overflow-x-auto py-1 no-scrollbar">
            <a href="#overview" className="text-stone-900 font-bold border-b-2 border-stone-900 pb-1 shrink-0">Overview</a>
            <a href="#highlights" className="hover:text-stone-900 transition-colors shrink-0">Highlights</a>
            <a href="#details" className="hover:text-stone-900 transition-colors shrink-0">Home details</a>
            <a href="#map" className="hover:text-stone-900 transition-colors shrink-0">Map</a>
          </div>

          {/* Action Links */}
          <div className="flex items-center gap-4 text-xs sm:text-sm font-medium text-stone-600">
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard");
              }}
              className="flex items-center gap-2 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-stone-600" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">

        {/* 5-Image Gallery Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-8">
          {/* Main Large Image (Left half) */}
          <div className="relative aspect-[4/3] sm:aspect-[16/11] lg:h-[460px] w-full rounded-2xl overflow-hidden group shadow-xs bg-stone-200">
            <img
              src={cloudinaryUrl(gridImages[activeImage % gridImages.length], { width: 1200 })}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 cursor-pointer"
              onClick={() => setPreviewImage(gridImages[activeImage % gridImages.length])}
            />

            {/* Left / Right Carousel Controls */}
            <button
              onClick={prevImage}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 text-stone-800 flex items-center justify-center shadow-md hover:bg-white transition-all opacity-80 hover:opacity-100 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 text-stone-800 flex items-center justify-center shadow-md hover:bg-white transition-all opacity-80 hover:opacity-100 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Bottom-Left Overlay Pills (Floor Plans & Layouts, Project Brochure, Street View) */}
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex flex-wrap items-center gap-1.5 sm:gap-2 z-10">
              <button
                onClick={() => {
                  const detailsElement = document.getElementById("details");
                  detailsElement?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-white/95 text-stone-900 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-white transition-all border border-stone-200/50 backdrop-blur-sm cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-stone-700" />
                <span className="whitespace-nowrap">Floor Plans & Layouts</span>
              </button>
              <button
                onClick={() => {
                  if (property.technicalPdf && property.technicalPdf !== "null" && property.technicalPdf.trim() !== "") {
                    handleDownload(property.technicalPdf);
                  } else {
                    toast.info("Brochure document available upon inquiry.");
                  }
                }}
                className="bg-white/95 text-stone-900 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-white transition-all border border-stone-200/50 backdrop-blur-sm cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-stone-700" />
                <span className="whitespace-nowrap">Project Brochure</span>
              </button>
              <button
                onClick={() => {
                  const mapElement = document.getElementById("map");
                  mapElement?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-white/95 text-stone-900 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-white transition-all border border-stone-200/50 backdrop-blur-sm cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-stone-700" />
                <span className="whitespace-nowrap">Street View</span>
              </button>
            </div>

            {/* Bottom-Right Overlay Pill (Photo Count) */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
              <button
                onClick={() => setPreviewImage(gridImages[activeImage % gridImages.length])}
                className="bg-white/95 text-stone-900 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-white transition-all border border-stone-200/50 backdrop-blur-sm cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-stone-700" />
                <span>{activeImage + 1}/{property.images && property.images.length > 0 ? property.images.length : images.length}</span>
              </button>
            </div>
          </div>

          {/* Right 2x2 Grid (4 Thumbnails) */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 h-full">
            {gridImages.slice(1, 5).map((img, idx) => {
              const actualIndex = (idx + 1) % gridImages.length;
              const isLast = idx === 3;
              return (
                <div
                  key={idx}
                  className="relative h-[180px] sm:h-[210px] md:h-[222px] w-full rounded-2xl overflow-hidden group cursor-pointer bg-stone-200"
                  onClick={() => {
                    setActiveImage(actualIndex);
                    setPreviewImage(img);
                  }}
                >
                  <img
                    src={cloudinaryUrl(img, { width: 600, height: 450 })}
                    alt={`Property thumbnail ${idx + 2}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Valid Photos Overlay Pill on 4th Thumbnail */}
                  {isLast && (
                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(img);
                        }}
                        className="bg-white/95 text-stone-900 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 shadow-md hover:bg-white transition-all border border-stone-200/50 backdrop-blur-sm cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-stone-700" />
                        <span>{property.images && property.images.length > 0 ? property.images.length : images.length} photos</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Layout: Left 2/3 (Details) & Right 1/3 (Agent Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12 items-start">

          {/* Left Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Price, Address & Inline Metrics Header Card */}
            <div className="bg-white p-5 sm:p-7 rounded-2xl border border-stone-200/90 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-stone-100">
                <div className="space-y-1.5">
                  <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 tracking-tight flex items-center flex-wrap gap-1.5">
                    <PriceDisplay
                      price={property.price || 5000000}
                      category={property.category}
                      iconSize={18}
                      iconClassName="w-4 h-4 sm:w-5 sm:h-5 inline-block text-stone-900 mb-0.5"
                    />
                  </h1>
                  <p className="text-stone-600 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span>{property.address || property.location || "Motor City, Dubai, United Arab Emirates"}</span>
                  </p>
                </div>

                {/* Beds | Baths | Sqft Inline Row */}
                <div className="flex items-center gap-4 sm:gap-6 self-start sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100 w-full sm:w-auto justify-between sm:justify-start">
                  <div className="text-center sm:text-left min-w-[50px] sm:min-w-0">
                    <p className="font-display text-lg sm:text-2xl md:text-3xl font-bold text-stone-900 leading-tight">
                      {property.category === "off-plan" && property.unitTypes
                        ? property.unitTypes
                        : property.bedrooms || 4}
                    </p>
                    <p className="text-stone-500 text-xs sm:text-sm font-medium">Beds</p>
                  </div>
                  <div className="h-8 sm:h-10 w-[1px] bg-stone-200 shrink-0" />
                  <div className="text-center sm:text-left min-w-[50px] sm:min-w-0">
                    <p className="font-display text-lg sm:text-2xl md:text-3xl font-bold text-stone-900 leading-tight">
                      {property.bathrooms ? property.bathrooms : "1-3"}
                    </p>
                    <p className="text-stone-500 text-xs sm:text-sm font-medium">Baths</p>
                  </div>
                  <div className="h-8 sm:h-10 w-[1px] bg-stone-200 shrink-0" />
                  <div className="text-center sm:text-left min-w-[70px] sm:min-w-0">
                    <p className="font-display text-lg sm:text-2xl md:text-3xl font-bold text-stone-900 leading-tight whitespace-nowrap">
                      {typeof property.area === 'number'
                        ? property.area.toLocaleString()
                        : property.area || "1,963-5,479"}
                    </p>
                    <p className="text-stone-500 text-xs sm:text-sm font-medium">Sqft</p>
                  </div>
                </div>
              </div>

            {/* 2 Rows x 3 Columns Badge Pill Cards (Fully Responsive & Clean Alignment) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="bg-[#f4f4f5] rounded-xl p-3 sm:p-4 flex items-center gap-2.5 text-stone-800 text-xs sm:text-sm font-medium border border-stone-200/50">
                <Link2 className="w-4 h-4 text-stone-600 shrink-0" />
                <span className="truncate">{property.type ? property.type.charAt(0).toUpperCase() + property.type.slice(1) : "Single Family Residence"}</span>
              </div>
              <div className="bg-[#f4f4f5] rounded-xl p-3 sm:p-4 flex items-center gap-2.5 text-stone-800 text-xs sm:text-sm font-medium border border-stone-200/50">
                <Link2 className="w-4 h-4 text-stone-600 shrink-0" />
                <span className="truncate">Built in {property.yearBuilt || 2024}</span>
              </div>
              <div className="bg-[#f4f4f5] rounded-xl p-3 sm:p-4 flex items-center gap-2.5 text-stone-800 text-xs sm:text-sm font-medium border border-stone-200/50">
                <Link2 className="w-4 h-4 text-stone-600 shrink-0" />
                <span className="truncate">0.44 Acres Lot</span>
              </div>

              <div className="bg-[#f4f4f5] rounded-xl p-3 sm:p-4 flex items-center gap-2.5 text-stone-800 text-xs sm:text-sm font-medium border border-stone-200/50">
                <DirhamIcon className="w-4 h-4 text-stone-600 shrink-0 inline-block" />
                <span className="truncate">{homiqEstimate.toLocaleString()} Homiq®</span>
              </div>
              <div className="bg-[#f4f4f5] rounded-xl p-3 sm:p-4 flex items-center gap-2.5 text-stone-800 text-xs sm:text-sm font-medium border border-stone-200/50">
                <DirhamIcon className="w-4 h-4 text-stone-600 shrink-0 inline-block" />
                <span className="truncate">{pricePerSqft}/sqft</span>
              </div>
              <div className="bg-[#f4f4f5] rounded-xl p-3 sm:p-4 flex items-center gap-2.5 text-stone-800 text-xs sm:text-sm font-medium border border-stone-200/50">
                <Link2 className="w-4 h-4 text-stone-600 shrink-0" />
                <span className="truncate">10/mo HOA</span>
              </div>
            </div>
            </div>

            {/* About This Home */}
            <div id="overview" className="pt-4">
              <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900 mb-4">About This Home</h2>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {property.description ||
                  `Welcome to this beautifully upgraded single-story home in the heart of Sun City Summerlin! This 2-bedroom, 2-bathroom gem features an open floor plan that's perfect for entertaining. The spacious kitchen boasts an oversized island, stainless steel appliances, and plenty of cabinet space—ideal for any home chef. Enjoy cozy evenings by the fireplace in the inviting family room. You'll love the upgraded flooring throughout, as well as the modern finishes in both bathrooms. The large backyard is a private oasis with stylish pavers and room to relax or entertain.`}
              </p>
            </div>

            {/* Highlights & Amenities */}
            {filteredAmenities.length > 0 && (
              <div id="highlights" className="pt-8 border-t border-stone-200">
                <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900 mb-6">Highlights & Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredAmenities.map((amenity, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200/80 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-[#1c4d32] shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-stone-700 truncate">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Home Details & Technical Specifications */}
            <div id="details" className="pt-8 border-t border-stone-200">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900 mb-6">Home Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 bg-white p-6 rounded-2xl border border-stone-200/80 shadow-2xs">
                {property.developer && (
                  <div>
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Developer</p>
                    <p className="text-sm sm:text-base font-bold text-stone-900">{property.developer}</p>
                  </div>
                )}
                {property.yearBuilt && (
                  <div>
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Year Built</p>
                    <p className="text-sm sm:text-base font-bold text-stone-900">{property.yearBuilt}</p>
                  </div>
                )}
                {property.garages && (
                  <div>
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Parking</p>
                    <p className="text-sm sm:text-base font-bold text-stone-900">{property.garages} Spaces</p>
                  </div>
                )}
                {property.floorsNo && (
                  <div>
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Floors</p>
                    <p className="text-sm sm:text-base font-bold text-stone-900">{property.floorsNo}</p>
                  </div>
                )}
                {property.kitchens && (
                  <div>
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Kitchens</p>
                    <p className="text-sm sm:text-base font-bold text-stone-900">{property.kitchens}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Architectural Blueprints / Floor Plans */}
            {property.floorPlans && property.floorPlans.length > 0 && (
              <div className="pt-8 border-t border-stone-200">
                <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900 mb-6">Floor Plans</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {property.floorPlans.map((plan, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-2xl border border-stone-200 cursor-pointer hover:shadow-md transition-all flex flex-col items-center"
                      onClick={() => setPreviewImage(plan)}
                    >
                      <img src={cloudinaryUrl(plan, { width: 800 })} alt={`Floor Plan ${idx + 1}`} className="h-48 object-contain mb-3" />
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Floor Plan {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Brochure PDF */}
            {property.technicalPdf && property.technicalPdf !== "null" && (
              <div className="pt-8 border-t border-stone-200">
                <div className="bg-white p-6 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-stone-900 mb-1">Official Brochure</h4>
                    <p className="text-stone-500 text-xs sm:text-sm">Download property documents and technical specs.</p>
                  </div>
                  <button
                    onClick={() => handleDownload(property.technicalPdf)}
                    className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </div>
            )}

            {/* Google Map Section */}
            <div id="map" className="pt-8 border-t border-stone-200">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900 mb-6">Location Map</h3>
              <div className="h-[300px] sm:h-[380px] w-full rounded-2xl overflow-hidden border border-stone-200 shadow-2xs">
                <iframe
                  width="100%" height="100%" frameBorder="0" scrolling="no"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent([property.location, property.areaLocation, property.region, property.city].filter(Boolean).join(", "))}&t=&z=14&ie=UTF8&iwloc=B&output=embed`}
                />
              </div>
            </div>
          </div>

          {/* Right Sticky Sidebar (Listing Agent Box) */}
          <div className="lg:col-span-1 sticky top-24">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <p className="text-stone-500 text-xs font-semibold mb-1">Listing Agent</p>
                <h3 className="text-xl font-bold text-stone-900">{agentName}</h3>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-stone-100 bg-stone-50/50">
                  <div className="flex items-center gap-2 text-stone-800 text-xs sm:text-sm font-medium">
                    <span className="text-base shrink-0">🇦🇪</span>
                    <span className="font-semibold tracking-wide">{agentPhone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="https://wa.me/971588251088"
                      target="_blank"
                      rel="noreferrer"
                      className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-xs"
                      title="WhatsApp Business"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="tel:+971588251088"
                      className="w-7 h-7 rounded-full border border-stone-300 flex items-center justify-center text-stone-600 hover:border-stone-800 hover:text-stone-900 transition-all"
                      title="Call Now"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-stone-700 text-xs sm:text-sm font-medium px-1">
                  <Mail className="w-4 h-4 text-stone-500 shrink-0" />
                  <span className="truncate">{agentEmail}</span>
                </div>
              </div>

              {/* Form matching Experience Dubai's Future form fields */}
              <form onSubmit={handleEnquiry} className="space-y-3.5 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 outline-none focus:border-stone-400 transition-colors shadow-inner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="name@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 outline-none focus:border-stone-400 transition-colors shadow-inner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <CountryCodeSelector
                      value={form.countryCode}
                      onChange={(value) => setForm({ ...form, countryCode: value })}
                      className="w-[110px] sm:w-[120px] rounded-xl h-[38px] text-xs bg-stone-50 border-stone-200"
                    />
                    <input
                      required
                      type="tel"
                      placeholder="58 825 1088"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-800 outline-none focus:border-stone-400 transition-colors shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-stone-400 tracking-widest pl-1">
                    Personal Message
                  </label>
                  <textarea
                    rows={3}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 outline-none focus:border-stone-400 transition-colors resize-none shadow-inner placeholder:text-stone-400"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder={`Hi ${agentName}, I would like to know more about this listing.`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#1c4d32] hover:bg-[#153a26] text-white font-semibold py-3 px-4 rounded-xl text-center shadow-xs transition-all text-xs uppercase tracking-wider cursor-pointer active:scale-95"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>

              <p className="text-stone-400 text-[10px] sm:text-[11px] text-center font-normal pt-1">
                Only Homes.com connects you to the Listing Agent.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Lightbox / Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 md:p-10"
            onClick={() => setPreviewImage(null)}
          >
            <motion.button
              className="absolute top-6 right-6 p-3 text-white/50 hover:text-white transition-colors z-[110]"
              whileHover={{ rotate: 90 }}
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-8 h-8" />
            </motion.button>

            <motion.div
              className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={cloudinaryUrl(previewImage, { width: 1400 })}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function renderMinimalTheme(
  property: PropertyType,
  activeImage: number,
  setActiveImage: (n: number) => void,
  previewImage: string | null,
  setPreviewImage: (s: string | null) => void,
  form: { name: string; email: string; countryCode: string; phone: string; message: string },
  setForm: (f: any) => void,
  submitting: boolean,
  handleEnquiry: (e: React.FormEvent) => Promise<void>,
  handleDownload: (url: string | undefined) => Promise<void>,
  nextImage: () => void,
  prevImage: () => void,
) {
  const images = property.images && property.images.length > 0 ? property.images : [property.image];
  const gridImages = [...images];
  while (gridImages.length < 3) {
    gridImages.push(gridImages[gridImages.length % images.length]);
  }

  const agentName = property.developerName || property.developer || "Avenew Development";
  const displayAddress = property.address || property.location || "2464 Royal Ln. Mesa, New Jersey";

  const filteredAmenities = (property.amenities || []).flatMap((a) =>
    typeof a === "string" ? a.split(",") : [a],
  ).map((a) => typeof a === "string" ? a.trim() : a);

  return (
    <div className="bg-[#f8fafc] min-h-screen font-body text-stone-900 pt-20 pb-20">

      {/* Breadcrumb Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center gap-2 text-stone-700 text-xs sm:text-sm font-semibold">
          <Link to="/properties" className="hover:text-stone-900 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4 text-stone-700" />
            <span>Property details</span>
          </Link>
          <span className="text-stone-400">/</span>
          <span className="text-stone-500 font-medium">{property.title || "Home"}</span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* Left Side Main Content */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">

          {/* 3-Image Collage Gallery Container with Premium Equal-Height Alignment */}
          <div className="bg-white p-3 sm:p-4 rounded-3xl border border-stone-200/80 shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 sm:h-[380px] md:h-[440px] lg:h-[460px]">
              {/* Large Main Image (Left 2 cols, Full Grid Height) */}
              <div className="sm:col-span-2 relative h-full w-full rounded-2xl overflow-hidden bg-stone-100 group shadow-2xs">
                <img
                  src={cloudinaryUrl(gridImages[activeImage % gridImages.length], { width: 1200 })}
                  alt={property.title}
                  className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-[1.02]"
                  onClick={() => setPreviewImage(gridImages[activeImage % gridImages.length])}
                />
                {/* Subtle top & bottom shadow gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/25 pointer-events-none" />

                {/* Carousel Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-stone-800 flex items-center justify-center shadow-md hover:bg-white hover:scale-105 transition-all cursor-pointer z-10"
                >
                  <ChevronLeft className="w-5 h-5 text-stone-800" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-stone-800 flex items-center justify-center shadow-md hover:bg-white hover:scale-105 transition-all cursor-pointer z-10"
                >
                  <ChevronRight className="w-5 h-5 text-stone-800" />
                </button>
              </div>

              {/* Right 2 Stacked Thumbnails (Flex-1 Split to Equal Half Height) */}
              <div className="flex flex-col gap-3 md:gap-4 h-full">
                <div
                  className="relative flex-1 h-1/2 w-full rounded-2xl overflow-hidden bg-stone-100 cursor-pointer shadow-2xs group"
                  onClick={() => { setActiveImage(1); setPreviewImage(gridImages[1]); }}
                >
                  <img
                    src={cloudinaryUrl(gridImages[1], { width: 600 })}
                    alt="Thumbnail 1"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div
                  className="relative flex-1 h-1/2 w-full rounded-2xl overflow-hidden bg-stone-100 cursor-pointer shadow-2xs group"
                  onClick={() => { setActiveImage(2); setPreviewImage(gridImages[2]); }}
                >
                  <img
                    src={cloudinaryUrl(gridImages[2], { width: 600 })}
                    alt="Thumbnail 2"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="bg-white/95 backdrop-blur-md text-stone-900 text-xs font-bold px-3.5 py-2 rounded-full shadow-md flex items-center gap-1.5 border border-white/40">
                      <ImageIcon className="w-3.5 h-3.5 text-stone-700" />
                      + {property.images && property.images.length > 0 ? property.images.length : images.length} Photos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price, Address & Specs Card */}
          <div className="bg-white rounded-2xl p-5 sm:p-7 border border-stone-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-center gap-2">
                  <PriceDisplay
                    price={property.price || 125650}
                    category={property.category}
                    iconSize={24}
                    iconClassName="w-6 h-6 inline-block text-stone-900 mb-0.5"
                  />
                </div>
                <p className="text-stone-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 mt-1.5">
                  <MapPin className="w-4 h-4 text-stone-500 shrink-0" />
                  <span>{displayAddress}</span>
                </p>
              </div>
            </div>

            {/* Features Sub-row (Beds, Baths, Parking, Sqft) */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 border-t border-stone-100 text-stone-700 text-xs sm:text-sm font-semibold">
              <div className="flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{property.bedrooms || 4} Bed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{property.bathrooms || 4} Baths</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{property.garages || 2} Parking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Maximize className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{typeof property.area === 'number' ? property.area.toLocaleString() : property.area || "1254"} Sq Ft</span>
              </div>
            </div>
          </div>

          {/* Property Information Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-3">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-stone-900">Property information</h2>
            <p className="text-stone-600 text-xs sm:text-sm sm:leading-relaxed whitespace-pre-line">
              {property.description ||
                "Charming lakefront cottage located right on the shoreline of Lake Bellaire! Share 150 of beautiful sandy frontage on the west side with six other cottages. Moor your boat right in front of your cottage, with or without a hoist. Freshly painted exterior, brand new split unit A/C with heat, brand new Amana range."}
            </p>
          </div>

          {/* Detailed Property Specifications & Characteristics */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
            <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900">Specifications & Overview</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {property.propertyType && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Property Type</p>
                  <p className="text-xs sm:text-sm font-bold text-stone-900 capitalize">{property.propertyType}</p>
                </div>
              )}
              {property.listedIn && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Listing Type</p>
                  <p className="text-xs sm:text-sm font-bold text-stone-900">{property.listedIn}</p>
                </div>
              )}
              {property.yearBuilt && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Year Built</p>
                  <p className="text-xs sm:text-sm font-bold text-stone-900">{property.yearBuilt}</p>
                </div>
              )}
              {property.kitchens && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Kitchens</p>
                  <p className="text-xs sm:text-sm font-bold text-stone-900">{property.kitchens}</p>
                </div>
              )}
              {property.garages && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Garages / Parking</p>
                  <p className="text-xs sm:text-sm font-bold text-stone-900">{property.garages} Spaces</p>
                </div>
              )}
              {property.floorsNo && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Floors</p>
                  <p className="text-xs sm:text-sm font-bold text-stone-900">{property.floorsNo}</p>
                </div>
              )}
              {property.developerName && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Developer</p>
                  <p className="text-xs sm:text-sm font-bold text-stone-900">{property.developerName}</p>
                </div>
              )}
              {property.handoverYear && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Handover Year</p>
                  <p className="text-xs sm:text-sm font-bold text-stone-900">{property.handoverYear}</p>
                </div>
              )}
              {property.unitTypes && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1">Unit Types</p>
                  <p className="text-xs sm:text-sm font-bold text-stone-900">{property.unitTypes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Plan (If Off-Plan) */}
          {property.paymentPlan && (property.paymentPlan.onBooking !== undefined || property.paymentPlan.duringConstruction !== undefined || property.paymentPlan.onHandover !== undefined) && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900">Payment Plan</h3>
              <div className="grid grid-cols-3 gap-4">
                {property.paymentPlan.onBooking !== undefined && (
                  <div className="bg-stone-50 rounded-xl p-4 sm:p-6 text-center border border-stone-200/80">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">On Booking</p>
                    <p className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">{property.paymentPlan.onBooking}%</p>
                  </div>
                )}
                {property.paymentPlan.duringConstruction !== undefined && (
                  <div className="bg-stone-50 rounded-xl p-4 sm:p-6 text-center border border-stone-200/80">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">During Construction</p>
                    <p className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">{property.paymentPlan.duringConstruction}%</p>
                  </div>
                )}
                {property.paymentPlan.onHandover !== undefined && (
                  <div className="bg-stone-50 rounded-xl p-4 sm:p-6 text-center border border-stone-200/80">
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">On Handover</p>
                    <p className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900">{property.paymentPlan.onHandover}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Highlights & Amenities */}
          {filteredAmenities.length > 0 && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900">Amenities & Features</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredAmenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200/80">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-stone-700 truncate">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architectural Floor Plans */}
          {property.floorPlans && property.floorPlans.length > 0 && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs space-y-6">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900">Floor Plans</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {property.floorPlans.map((plan, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-50 p-4 rounded-xl border border-stone-200/80 cursor-pointer hover:shadow-md transition-all flex flex-col items-center"
                    onClick={() => setPreviewImage(plan)}
                  >
                    <img src={cloudinaryUrl(plan, { width: 800 })} alt={`Floor Plan ${idx + 1}`} className="h-44 object-contain mb-3" />
                    <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Floor Plan {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Official Brochure PDF Download */}
          {property.technicalPdf && property.technicalPdf !== "null" && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-base sm:text-lg text-stone-900 mb-1">Project Brochure</h4>
                <p className="text-stone-500 text-xs sm:text-sm">Download property documents and technical specs PDF.</p>
              </div>
              <button
                onClick={() => handleDownload(property.technicalPdf)}
                className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Download Brochure
              </button>
            </div>
          )}

        </div>

        {/* Right Sidebar (Agent Details, Inspection Times, Location Map, Enquiry) */}
        <div id="agent-sidebar" className="lg:col-span-1 space-y-6">

          {/* Agent Details Card */}
          <div className="bg-sky-50/40 rounded-2xl p-6 border border-sky-200/80 shadow-xs space-y-4">
            <h3 className="font-display text-base font-bold text-stone-900">Agent details</h3>
            <div>
              <p className="text-sm font-bold text-stone-900">Omnis</p>
              <p className="text-xs text-stone-500 mt-0.5">{displayAddress}</p>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-white">
              <div className="flex items-center gap-2 text-stone-800 text-xs font-semibold">
                <span>🇦🇪</span>
                <span>+971 58 825 1088</span>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="https://wa.me/971588251088"
                  target="_blank"
                  rel="noreferrer"
                  className="w-6 h-6 rounded-full bg-[#25D366] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-2xs"
                  title="WhatsApp"
                >
                  <WhatsAppIcon className="w-3 h-3" />
                </a>
                <a
                  href="tel:+971588251088"
                  className="w-6 h-6 rounded-full border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs"
                  title="Call Agent"
                >
                  <Phone className="w-3 h-3" />
                </a>
              </div>
            </div>
            <a
              href="tel:+971588251088"
              className="w-full bg-white hover:bg-stone-50 text-stone-800 font-semibold py-2.5 px-4 rounded-xl border border-stone-300 text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-stone-700" />
              <span>Contact Agent</span>
            </a>
          </div>

          {/* Share to Social Media Card */}
          <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-stone-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-stone-700" />
                <span>Share Property</span>
              </h3>
              <p className="text-xs text-stone-500 mt-1">Share this listing across social networks</p>
            </div>

            <div className="grid grid-cols-5 gap-2 pt-1">
              {/* 1. WhatsApp */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this property: ${property.title} - ${window.location.href}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-[#25D366] hover:bg-[#25D366]/10 text-stone-700 hover:text-[#25D366] transition-all group cursor-pointer"
                title="Share on WhatsApp"
              >
                <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
                <span className="text-[10px] font-semibold mt-1">WhatsApp</span>
              </a>

              {/* 2. Facebook */}
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-[#1877F2] hover:bg-[#1877F2]/10 text-stone-700 hover:text-[#1877F2] transition-all group cursor-pointer"
                title="Share on Facebook"
              >
                <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-[10px] font-semibold mt-1">Facebook</span>
              </a>

              {/* 3. X / Twitter */}
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Check out ${property.title}`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-stone-900 hover:bg-stone-900/10 text-stone-700 hover:text-stone-900 transition-all group cursor-pointer"
                title="Share on X"
              >
                <svg className="w-5 h-5 fill-stone-900" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-[10px] font-semibold mt-1">Twitter</span>
              </a>

              {/* 4. LinkedIn */}
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-[#0A66C2] hover:bg-[#0A66C2]/10 text-stone-700 hover:text-[#0A66C2] transition-all group cursor-pointer"
                title="Share on LinkedIn"
              >
                <svg className="w-5 h-5 fill-[#0A66C2]" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                <span className="text-[10px] font-semibold mt-1">LinkedIn</span>
              </a>

              {/* 5. Telegram */}
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(property.title)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-stone-50 border border-stone-200 hover:border-[#0088cc] hover:bg-[#0088cc]/10 text-stone-700 hover:text-[#0088cc] transition-all group cursor-pointer"
                title="Share on Telegram"
              >
                <svg className="w-5 h-5 fill-[#0088cc]" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span className="text-[10px] font-semibold mt-1">Telegram</span>
              </a>
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Property link copied to clipboard!");
              }}
              className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold py-2.5 px-4 rounded-xl border border-stone-200 text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5 text-stone-700" />
              <span>Copy Link</span>
            </button>
          </div>

          {/* Google Location Map */}
          <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-xs h-[280px]">
            <iframe
              width="100%" height="100%" frameBorder="0" scrolling="no"
              src={`https://maps.google.com/maps?q=${encodeURIComponent([property.location, property.areaLocation, property.region, property.city].filter(Boolean).join(", "))}&t=&z=14&ie=UTF8&iwloc=B&output=embed`}
            />
          </div>

          {/* Quick Enquiry Form */}
          <div id="enquiry-form" className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-xs space-y-4">
            <h3 className="font-display font-bold text-sm text-stone-900">Contact & Enquiry</h3>
            <form onSubmit={handleEnquiry} className="space-y-3">
              <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-stone-800 transition-colors" placeholder="Full Name *" />
              <input required type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-stone-800 transition-colors" placeholder="Email *" />
              <div className="flex gap-2">
                <CountryCodeSelector value={form.countryCode} onChange={(val) => setForm({...form, countryCode: val})} className="w-[110px] rounded-xl h-[38px] text-xs" />
                <input required type="tel" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-stone-800 transition-colors" placeholder="Phone *" />
              </div>
              <textarea required rows={3} value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-stone-800 transition-colors resize-none" placeholder="Write message..." />
              <Button disabled={submitting} type="submit" className="w-full bg-stone-900 text-white hover:bg-stone-800 rounded-xl py-3 text-xs font-bold">{submitting ? "Sending..." : "Send Message"}</Button>
            </form>
          </div>

        </div>

      </div>

      {/* Lightbox / Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-10"
            onClick={() => setPreviewImage(null)}
          >
            <motion.button
              className="absolute top-6 right-6 p-3 text-white/50 hover:text-white transition-colors z-[110]"
              whileHover={{ rotate: 90 }}
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-8 h-8" />
            </motion.button>
            <motion.div
              className="relative max-w-6xl max-h-full w-full h-full flex items-center justify-center"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <img src={cloudinaryUrl(previewImage, { width: 1400 })} alt="" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PropertyDetails;
