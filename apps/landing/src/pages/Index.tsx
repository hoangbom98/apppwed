import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Building2,
  Shield,
  Globe,
  TrendingUp,
  Search,
  MapPin,
  ChevronDown,
  Users,
  CheckCircle,
  Zap,
  Award,
  Quote,
  Bed,
  DollarSign,
  ChevronLeft,
} from "lucide-react";
import DirhamIcon from "@/components/icons/DirhamIcon";
import { motion } from "framer-motion";
import PropertyCard from "@/components/PropertyCard";
import Layout from "@/components/Layout";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Property as PropertyType } from "@/data/properties";
import useEmblaCarousel from "embla-carousel-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState("buy");
  const [locationValue, setLocationValue] = useState("");
  const [propType, setPropType] = useState("all");
  const [beds, setBeds] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [homeStats, setHomeStats] = useState<any[]>([]);
  const [homeHotspots, setHomeHotspots] = useState<any[]>([]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (locationValue) params.set("search", locationValue);
    if (propType !== "all") params.set("type", propType);
    if (beds !== "all") params.set("beds", beds);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    // Map searchType to category
    let category = "all";
    if (searchType === "off-plan") category = "off-plan";
    if (searchType === "rent") category = "rental";
    if (searchType === "buy") category = "secondary";

    params.set("category", category);

    navigate(`/properties?${params.toString()}`);
  };
  // ... (rest of the component structure)

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const { data } = await api.get("/api/public/properties");
        if (data && data.properties) {
          const mapped: PropertyType[] = data.properties.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            price: p.price,
            area: p.property_info?.sqft || 0,
            bedrooms: p.property_info?.bed || 0,
            bathrooms: p.property_info?.bath || 0,
            location: p.location || p.address,
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
            featured: true, // For home page we'll show them as featured
          }));
          setProperties(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch featured properties:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();

    const fetchStats = async () => {
      try {
        const { data } = await api.get("/api/public/stats");
        setHomeStats(data.stats || []);
        setHomeHotspots(data.hotspots || []);
      } catch (err) {
        console.error("Failed to fetch home stats", err);
      }
    };
    fetchStats();
  }, []);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  useEffect(() => {
    if (!emblaApi) return;
    const intervalId = setInterval(() => {
      emblaApi.scrollNext();
    }, 3000); // Scroll every 4 seconds for a professional pace
    return () => clearInterval(intervalId);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const [testimonialRef, testimonialApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  useEffect(() => {
    if (!testimonialApi) return;
    const intervalId = setInterval(() => {
      testimonialApi.scrollNext();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [testimonialApi]);

  const scrollTestimonialPrev = useCallback(() => {
    if (testimonialApi) testimonialApi.scrollPrev();
  }, [testimonialApi]);

  const scrollTestimonialNext = useCallback(() => {
    if (testimonialApi) testimonialApi.scrollNext();
  }, [testimonialApi]);

  const featuredProperties = properties.slice(0, 6); // Just show the first 6 for featured

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[100svh] flex items-center py-20 lg:py-0">
        <img
          src="/images/hero-dubai-v2.png"
          alt="Dubai Luxury Living"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />

        <div className="relative z-10 container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl pt-24 lg:pt-32"
          >
            <p className="text-gold font-body text-sm tracking-[0.3em] uppercase mb-4">
              Dubai's Premier Real Estate
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-6">
              Discover Luxury
              <br />
              <span className="text-gradient-gold">Living in Dubai</span>
            </h1>
            <p className="text-primary-foreground/70 font-body text-lg md:text-xl max-w-xl mb-8 leading-relaxed">
              Off-plan investments, premium resale properties, and exclusive
              rentals — curated for discerning investors worldwide.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="xl" asChild>
                <Link to="/properties">
                  Explore Properties
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="hero-outline" size="xl" asChild>
                <Link to="/contact">Schedule a Viewing</Link>
              </Button>
            </div>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-12 max-w-4xl"
          >
            <div className="bg-primary-foreground/10 backdrop-blur-xl rounded-xl p-2 border border-primary-foreground/10">
              <div className="flex flex-wrap gap-1 mb-3 px-1 sm:px-2">
                {["buy", "rent", "off-plan"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSearchType(t)}
                    className={`font-body text-[10px] sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all ${
                      searchType === t
                        ? "bg-gold text-accent-foreground"
                        : "text-primary-foreground/70 hover:text-primary-foreground"
                    }`}
                  >
                    {t === "off-plan"
                      ? "Off-Plan"
                      : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
                {/* Location */}
                <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-4 py-3 min-w-0 lg:col-span-2">
                  <MapPin className="w-4 h-4 text-gold shrink-0" />
                  <input
                    type="text"
                    value={locationValue}
                    onChange={(e) => setLocationValue(e.target.value)}
                    placeholder="Search by location..."
                    className="bg-transparent text-primary-foreground placeholder:text-primary-foreground/40 font-body text-sm w-full outline-none"
                  />
                </div>

                {/* Property Type */}
                <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-4 py-3 min-w-0">
                  <Building2 className="w-4 h-4 text-gold shrink-0" />
                  <select
                    value={propType}
                    onChange={(e) => setPropType(e.target.value)}
                    className="bg-transparent text-primary-foreground font-body text-sm outline-none cursor-pointer appearance-none pr-6 w-full"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right center",
                      backgroundSize: "1rem",
                    }}
                  >
                    <option value="all" className="bg-primary text-white">
                      All Types
                    </option>
                    <option value="apartment" className="bg-primary text-white">
                      Apartment
                    </option>
                    <option value="villa" className="bg-primary text-white">
                      Villa
                    </option>
                    <option value="townhouse" className="bg-primary text-white">
                      Townhouse
                    </option>
                    <option value="penthouse" className="bg-primary text-white">
                      Penthouse
                    </option>
                  </select>
                </div>

                {/* Bedrooms */}
                <div className="flex items-center gap-2 bg-primary-foreground/10 rounded-lg px-4 py-3 min-w-0">
                  <Bed className="w-4 h-4 text-gold shrink-0" />
                  <select
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
                    className="bg-transparent text-primary-foreground font-body text-sm outline-none cursor-pointer appearance-none pr-6 w-full"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgba(255,255,255,0.4)'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right center",
                      backgroundSize: "1rem",
                    }}
                  >
                    <option value="all" className="bg-primary text-white">
                      Beds (All)
                    </option>
                    <option value="0" className="bg-primary text-white">
                      Studio
                    </option>
                    <option value="1" className="bg-primary text-white">
                      1 Bed
                    </option>
                    <option value="2" className="bg-primary text-white">
                      2 Beds
                    </option>
                    <option value="3" className="bg-primary text-white">
                      3 Beds
                    </option>
                    <option value="4" className="bg-primary text-white">
                      4+ Beds
                    </option>
                  </select>
                </div>

                {/* Search Button */}
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full h-full min-h-[50px] font-bold"
                  onClick={handleSearch}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              {/* Advanced Search Toggle */}
              <div className="mt-3 flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-xs font-body uppercase tracking-widest text-primary-foreground/70 hover:text-gold transition-colors font-bold"
                >
                  Advanced Search
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Expanded Filters */}
                {showAdvanced && (
                  <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <span className="text-primary-foreground/40 text-xs font-body uppercase tracking-wider flex items-center gap-1">
                      Price Range (
                      <DirhamIcon
                        size={10}
                        strokeWidth={3}
                        className="pt-0.5"
                      />
                      ):
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-24 bg-primary-foreground/5 border border-primary-foreground/10 rounded-md px-3 py-1.5 text-xs text-primary-foreground outline-none focus:ring-1 ring-gold/50 transition-all"
                      />
                      <span className="text-primary-foreground/20">—</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-24 bg-primary-foreground/5 border border-primary-foreground/10 rounded-md px-3 py-1.5 text-xs text-primary-foreground outline-none focus:ring-1 ring-gold/50 transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end md:justify-between mb-12"
          >
            <div>
              <p className="text-gold font-body text-sm tracking-[0.2em] uppercase mb-2">
                Handpicked Selection
              </p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                Featured Properties
              </h2>
            </div>
            <Link
              to="/properties"
              className="text-emerald hover:text-gold font-body text-sm font-medium flex items-center gap-1 mt-4 md:mt-0 transition-colors"
            >
              View All Properties <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-[400px] w-full bg-muted/20 animate-pulse rounded-xl"
                />
              ))
            ) : featuredProperties.length > 0 ? (
              featuredProperties.map((property, i) => (
                <PropertyCard key={property.id} property={property} index={i} />
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                <p className="font-display text-xl">
                  No featured properties at the moment.
                </p>
                <p className="font-body mt-2">
                  Check back soon for our latest exclusive listings.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Partners & Developers */}
      <section className="py-32 bg-primary relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header section with editorial feel */}
            <div className="text-center mb-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <span className="inline-block text-gold font-body text-xs uppercase tracking-[0.5em] font-bold">
                  Institutional Trust
                </span>
                <h2 className="font-display text-4xl md:text-6xl font-bold text-white leading-tight uppercase">
                  Regulatory{" "}
                  <span className="text-white/90 font-display">Compliance</span>
                </h2>
                <div className="w-20 h-[1px] bg-gold mx-auto mt-8" />
                <p className="text-white/40 font-body text-lg max-w-2xl mx-auto leading-relaxed mt-8">
                  Licensed and regulated by the world's leading real estate
                  authorities, ensuring your investments are protected by the
                  highest legal standards.
                </p>
              </motion.div>
            </div>

            {/* Partners Grid - Minimalist Editorial Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-px bg-white/5 border border-white/5 mb-32 max-w-4xl mx-auto">
              {[
                {
                  name: "DET",
                  label: "Dubai Department of Economy & Tourism",
                  sub: "Primary Business Licensing Authority",
                  no: "Trade License No: 765450",
                },
                {
                  name: "DLD",
                  label: "Dubai Land Department",
                  sub: "Legal Registration",
                  no: "RERA ORN: 17250",
                },
              ].map((partner, i) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-primary p-16 flex flex-col items-center text-center group hover:bg-white/[0.02] transition-colors"
                >
                  <div className="text-gold font-display font-black text-5xl mb-6 tracking-tighter group-hover:scale-110 transition-transform duration-500">
                    {partner.name}
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-display text-sm uppercase tracking-widest font-bold">
                      {partner.label}
                    </p>
                    <p className="text-gold/40 font-body text-[10px] uppercase tracking-widest">
                      {partner.sub}
                    </p>
                    {partner.no && (
                      <p className="text-white/60 font-body text-[10px] uppercase tracking-wider mt-2 border-t border-white/5 pt-2 w-full">
                        {partner.no}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Strategic Network Carousel */}
            <div className="relative mt-24">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
                <div className="space-y-2">
                  <span className="text-gold font-body text-[10px] uppercase tracking-[0.3em] font-bold">
                    Strategic Network
                  </span>
                  <h2 className="text-center md:text-left font-display text-4xl md:text-6xl font-bold text-white leading-tight uppercase">
                    Our Developer{" "}
                    <span className="text-white/40">Network</span>
                  </h2>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="hero-outline"
                    size="icon"
                    onClick={scrollPrev}
                    className="rounded-full w-14 h-14 border-white/10 hover:bg-gold hover:text-primary transition-all group"
                  >
                    <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </Button>
                  <Button
                    variant="hero-outline"
                    size="icon"
                    onClick={scrollNext}
                    className="rounded-full w-14 h-14 border-white/10 hover:bg-gold hover:text-primary transition-all group"
                  >
                    <ArrowRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  </Button>
                </div>
              </div>

              {/* Carousel container */}
              <div className="relative">
                {/* Visual fading masks */}
                <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-primary via-primary/50 to-transparent z-10 pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-primary via-primary/50 to-transparent z-10 pointer-events-none" />

                <div
                  className="overflow-hidden cursor-grab active:cursor-grabbing px-4"
                  ref={emblaRef}
                >
                  <div className="flex -ml-8 py-6">
                    {[...Array(31)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-[0_0_240px] min-w-0 pl-8 shrink-0"
                      >
                        <div className="bg-white rounded-2xl p-4 flex items-center justify-center h-32 shadow-luxury transition-all duration-500 hover:scale-[1.05] hover:shadow-gold/30 border border-white/10">
                          <img
                            src={`/LOGOS/${i + 1}.png`}
                            alt={`Developer ${i + 1}`}
                            className="max-h-full max-w-full object-contain drop-shadow-sm p-1"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom border element */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/10 to-transparent" />
      </section>

      {/* Categories */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-gold font-body text-sm tracking-[0.2em] uppercase mb-2">
              Browse By Category
            </p>
            <h2 className="text-center font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground uppercase">
              What Are You Looking For?
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                title: "Off-Plan",
                desc: "Invest early in Dubai's most anticipated developments with flexible payment plans.",
                image: "/images/property-offplan.jpg",
                link: "/properties?category=off-plan",
              },
              {
                title: "Resale",
                desc: "Ready-to-move premium properties in Dubai's most sought-after communities.",
                image: "/images/property-villa.jpg",
                link: "/properties?category=secondary",
              },
              {
                title: "Rentals",
                desc: "Premium furnished and unfurnished rental options across Dubai.",
                image: "/images/property-marina.jpg",
                link: "/properties?category=rental",
              },
            ].map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Link
                  to={cat.link}
                  className="group relative block h-80 rounded-xl overflow-hidden shadow-luxury"
                >
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-left font-display text-2xl font-bold text-primary-foreground mb-2 uppercase">
                      {cat.title}
                    </h3>
                    <p className="text-left text-primary-foreground/70 font-body text-sm leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Hotspots */}
      <section className="py-20 lg:py-28 overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <p className="text-gold font-body text-sm tracking-[0.2em] uppercase mb-2">
              Premium Districts
            </p>
            <h2 className="text-left font-display text-3xl md:text-4xl font-bold text-foreground uppercase">
              Investment Hotspots
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            {[
              {
                name: "Downtown Dubai",
                properties: "450+ Properties",
                img: "/images/hero-dubai.jpg",
                tag: "High ROI",
              },
              {
                name: "Palm Jumeirah",
                properties: "120+ Properties",
                img: "/images/property-villa.jpg",
                tag: "Exclusive",
              },
              {
                name: "Dubai Marina",
                properties: "380+ Properties",
                img: "/images/property-marina.jpg",
                tag: "High Yield",
              },
              {
                name: "Business Bay",
                properties: "290+ Properties",
                img: "/images/property-offplan.jpg",
                tag: "Commercial",
              },
            ].map((area, i) => (
              <motion.div
                key={area.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/properties?search=${area.name}`}
                  className="group relative block h-[400px] rounded-xl overflow-hidden cursor-pointer"
                >
                  <img
                    src={area.img}
                    alt={area.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-gold text-accent-foreground text-[10px] font-black uppercase tracking-widest rounded-full">
                      {area.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-left font-display text-2xl font-bold text-white mb-1 uppercase">
                      {area.name}
                    </h3>
                    <p className="text-left text-white/60 font-body text-sm">
                      {area.properties}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Omnis */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <p className="text-gold font-body text-sm tracking-[0.2em] uppercase mb-2">
              Why Choose Us
            </p>
            <h2 className="text-center font-display text-3xl md:text-4xl font-bold text-foreground uppercase">
              The Omnis Advantage
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Globe,
                title: "Global Reach",
                desc: "Serving investors from across the globe with dedicated multilingual support.",
              },
              {
                icon: Shield,
                title: "Trusted Partner",
                desc: "Licensed and regulated by Dubai’s Department of Economy & Tourism (DET) and Dubai Land Department (DLD).",
              },
              {
                icon: TrendingUp,
                title: "Market Insights",
                desc: "In-depth market analysis and investment guidance for maximum ROI.",
              },
              {
                icon: Building2,
                title: "Premium Portfolio",
                desc: "Exclusive access to Dubai's most prestigious developments and communities.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-emerald mb-5 group-hover:shadow-gold transition-shadow duration-300">
                  <item.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="text-center font-display text-lg font-semibold text-foreground mb-2 uppercase">
                  {item.title}
                </h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* List Your Property */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <span className="inline-block text-gold font-body text-xs uppercase tracking-[0.4em] font-bold mb-4">
              Partner With Us
            </span>
            <h2 className="text-center font-display text-4xl md:text-5xl font-bold text-primary mb-8 uppercase">
              List Your Property With Us
            </h2>
            <div className="w-16 h-[1px] bg-gold mx-auto mb-8" />

            <div className="space-y-6 text-muted-foreground font-body text-lg leading-relaxed mb-10">
              <p>
                If you are looking to sell or rent your property in Dubai or the UAE, OMNIS Properties offers a professional and transparent platform to get started. Property owners can list their properties with us at no upfront listing cost, allowing access to a network of genuine buyers, investors, and tenants.
              </p>
              <p>
                Our team supports you with property presentation, enquiry management, and connecting with serious prospects through our investor network and marketing channels.
              </p>
            </div>

            <Button variant="hero" size="xl" asChild>
              <Link to="/contact">
                Contact Our Team <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 bg-primary relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />

        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                <span className="inline-block text-gold font-body text-xs uppercase tracking-[0.5em] font-bold">
                  Client Success
                </span>
                <h2 className="text-center font-display text-4xl md:text-6xl font-bold text-white leading-tight uppercase">
                  What Our Elite <br />
                  <span className="text-white/90">Clients Say</span>
                </h2>
                <div className="w-20 h-[1px] bg-gold mx-auto mt-8" />
              </motion.div>
            </div>

            <div className="relative">
              {/* Navigation Buttons */}
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 md:-left-12 z-10 hidden sm:block">
                <Button
                  variant="hero-outline"
                  size="icon"
                  onClick={scrollTestimonialPrev}
                  className="rounded-full w-12 h-12 border-white/10 bg-primary hover:bg-gold hover:text-primary transition-all group shadow-xl"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 -right-4 md:-right-12 z-10 hidden sm:block">
                <Button
                  variant="hero-outline"
                  size="icon"
                  onClick={scrollTestimonialNext}
                  className="rounded-full w-12 h-12 border-white/10 bg-primary hover:bg-gold hover:text-primary transition-all group shadow-xl"
                >
                  <ArrowRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </Button>
              </div>

              {/* Slider Container */}
              <div
                className="overflow-hidden cursor-grab active:cursor-grabbing px-2"
                ref={testimonialRef}
              >
                <div className="flex gap-4 md:gap-8 min-h-[350px]">
                  {[
                    {
                      quote:
                        "OMNIS Properties provided excellent guidance throughout my property investment in Dubai. The team handled everything from project selection to documentation, making the entire process smooth and transparent.",
                      author: "Rahul Sharma",
                      role: "Investor",
                    },
                    {
                      quote:
                        "A very professional and reliable team. They explained every step clearly and helped me find the right property that matched my investment goals. I truly appreciate their end-to-end support.",
                      author: "Priya Nair",
                      role: "Investor",
                    },
                    {
                      quote:
                        "My experience with OMNIS Properties was outstanding. From the initial consultation to final booking, the team ensured everything was handled efficiently and professionally.",
                      author: "Amit Patel",
                      role: "Investor",
                    },
                    {
                      quote:
                        "The team at OMNIS Properties made the entire property buying process simple and stress-free. Their knowledge of the Dubai market and honest advice made a big difference.",
                      author: "Sneha Reddy",
                      role: "Investor",
                    },
                    {
                      quote:
                        "I was impressed by the transparency and professionalism of OMNIS Properties. They provided detailed insights into the projects and helped me make a confident investment decision.",
                      author: "Vikram Singh",
                      role: "Investor",
                    },
                    {
                      quote:
                        "OMNIS Properties provided great support throughout the investment process. Their team was very responsive and helped me understand the Dubai real estate market clearly before making my decision.",
                      author: "Ahmed Khan",
                      role: "Investor",
                    },
                    {
                      quote:
                        "A very smooth experience from start to finish. The team guided me through every step and made the entire property purchase process simple and well organized.",
                      author: "Usman Ali",
                      role: "Investor",
                    },
                    {
                      quote:
                        "OMNIS Properties delivered a very smooth and well-organized property investment experience. Their market knowledge and clear communication made the process extremely comfortable.",
                      author: "Michael Thompson",
                      role: "Investor",
                    },
                    {
                      quote:
                        "The team was very supportive from start to finish. They provided valuable insights about the Dubai real estate market and helped me choose the right investment opportunity.",
                      author: "Sarah Williams",
                      role: "Investor",
                    },
                    {
                      quote:
                        "I appreciated the professionalism and structured approach of OMNIS Properties. Their team handled the entire process efficiently and ensured every detail was taken care of.",
                      author: "Jhonson Anderson",
                      role: "Investor",
                    },
                  ].map((t) => (
                    <div
                      key={t.author}
                      className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.333%] h-auto flex"
                    >
                      <div className="bg-white/5 border border-white/10 p-8 flex flex-col justify-between group hover:bg-white/[0.08] transition-colors w-full h-full">
                        <div>
                          <Quote className="w-10 h-10 text-gold mb-8 opacity-50 group-hover:opacity-100 transition-opacity" />
                          <p className="text-white/80 font-body text-base italic leading-relaxed mb-8">
                            "{t.quote}"
                          </p>
                        </div>
                        <div>
                          <div className="w-10 h-[1px] bg-gold/30 mb-6 group-hover:bg-gold transition-colors" />
                          <div className="font-display text-xl font-bold text-white mb-1">
                            {t.author}
                          </div>
                          <div className="text-gold/60 text-[10px] uppercase font-black tracking-[0.2em]">
                            {t.role}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/about-dubai.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="relative z-10 container mx-auto px-4 lg:px-8 text-center sm:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center"
          >
            <h2 className="text-center font-display text-2xl md:text-5xl font-bold text-primary-foreground mb-4 max-w-2xl px-4 uppercase">
              Ready to Invest in Dubai?
            </h2>
            <p className="text-center text-primary-foreground/70 font-body text-sm md:text-lg max-w-2xl mx-auto mb-8 px-4">
              Let our team of experts guide you through Dubai's dynamic real
              estate market. Schedule a free consultation today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto px-4">
              <Button
                variant="hero"
                size="xl"
                asChild
                className="w-full sm:w-auto"
              >
                <Link to="/contact">Get In Touch</Link>
              </Button>
              <Button
                variant="hero-outline"
                size="xl"
                asChild
                className="w-full sm:w-auto"
              >
                <a
                  href="https://wa.me/971588251088"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp Us
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
