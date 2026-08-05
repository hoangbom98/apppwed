import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import PropertyCard from "@/components/PropertyCard";
import { api } from "@/lib/api";
import { type Property as PropertyType } from "@/data/properties";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import DirhamIcon from "@/components/icons/DirhamIcon";

const Properties = () => {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialType = searchParams.get("type") || "all";

  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [propertyType, setPropertyType] = useState(initialType);
  const [bedrooms, setBedrooms] = useState(searchParams.get("beds") || "all");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [handoverYear, setHandoverYear] = useState(
    searchParams.get("handoverYear") || "all",
  );
  // Mobile sidebar toggle
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    setCategory(searchParams.get("category") || "all");
    setSearch(searchParams.get("search") || "");
    setPropertyType(searchParams.get("type") || "all");
    setBedrooms(searchParams.get("beds") || "all");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setHandoverYear(searchParams.get("handoverYear") || "all");
  }, [searchParams]);

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
            developer: p.developerName || p.owner?.name,
            unitTypes: p.unitTypes,
            handoverYear: p.handoverYear,
            totalFloors: p.totalFloors,
            paymentPlan: p.paymentPlan,
          }));
          setProperties(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const filtered = useMemo(() => {
    return properties.filter((p: PropertyType) => {
      if (category !== "all" && p.category !== category) return false;
      if (propertyType !== "all" && p.type !== propertyType) return false;
      if (
        bedrooms !== "all" &&
        bedrooms !== "4" &&
        p.bedrooms !== Number(bedrooms)
      )
        return false;
      if (bedrooms === "4" && Number(p.bedrooms) < 4) return false;
      if (minPrice && p.price < Number(minPrice)) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;
      if (
        category === "off-plan" &&
        handoverYear !== "all" &&
        p.handoverYear !== handoverYear
      )
        return false;
      if (
        search &&
        !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !p.location.toLowerCase().includes(search.toLowerCase()) &&
        !p.amenities?.some((a) =>
          a.toLowerCase().includes(search.toLowerCase()),
        )
      )
        return false;
      return true;
    });
  }, [
    properties,
    search,
    category,
    propertyType,
    bedrooms,
    minPrice,
    maxPrice,
    handoverYear,
  ]);

  const categories = [
    { value: "all", label: "All" },
    { value: "off-plan", label: "Off-Plan" },
    { value: "secondary", label: "Resale" },
    { value: "rental", label: "Rental" },
  ];

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setPropertyType("all");
    setBedrooms("all");
    setMinPrice("");
    setMaxPrice("");
    setHandoverYear("all");
  };

  const activeFilterCount = [
    category !== "all",
    propertyType !== "all",
    bedrooms !== "all",
    !!minPrice,
    !!maxPrice,
    handoverYear !== "all",
  ].filter(Boolean).length;

  // ─── Shared sidebar content ────────────────────────────────────────────────
  const SidebarContent = () => (
    <div>
      {/* Sidebar Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-lg font-bold text-[#0D3430]">
            Filter Properties
          </h2>
          <p className="text-stone-400 text-xs mt-0.5">Refine your search</p>
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="text-xs text-gold hover:text-[#0D3430] font-semibold transition-colors"
          >
            Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      <div className="space-y-7">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
            Search
          </label>
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 focus-within:border-gold transition-colors">
            <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              type="text"
              placeholder="Name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-stone-800 placeholder:text-stone-400 font-body text-sm w-full outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="w-3.5 h-3.5 text-stone-400 hover:text-stone-700" />
              </button>
            )}
          </div>
        </div>

        {/* Main Category */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
            Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`font-body text-sm px-3 py-2.5 rounded-xl border transition-all ${
                  category === cat.value
                    ? "bg-[#0D3430] border-[#0D3430] text-white shadow-md"
                    : "bg-white border-stone-200 text-stone-600 hover:border-[#0D3430]/30 hover:text-[#0D3430]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Property Type */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
            {category === "off-plan" ? "Unit Type" : "Property Type"}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "all", l: "All Types" },
              { v: "apartment", l: "Apartment" },
              { v: "villa", l: "Villa" },
              { v: "townhouse", l: "Townhouse" },
              { v: "penthouse", l: "Penthouse" },
            ].map((type) => (
              <button
                key={type.v}
                onClick={() => setPropertyType(type.v)}
                className={`font-body text-sm px-3 py-2 rounded-lg border transition-all ${
                  propertyType === type.v
                    ? "bg-gold/10 border-gold text-[#0D3430] font-bold"
                    : "bg-stone-50 border-transparent text-stone-600 hover:bg-stone-100"
                }`}
              >
                {type.l}
              </button>
            ))}
          </div>
        </div>

        {/* Off-Plan Specifics */}
        {category === "off-plan" && (
          <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-100">
            <label className="text-[10px] font-bold tracking-widest uppercase text-gold">
              Off-Plan Specifics
            </label>
            <div className="space-y-2">
              <span className="text-xs font-semibold text-stone-500">
                Handover Year
              </span>
              <select
                value={handoverYear}
                onChange={(e) => setHandoverYear(e.target.value)}
                className="w-full bg-white text-stone-800 font-body text-sm rounded-lg px-3 py-2.5 outline-none border border-stone-200 focus:border-gold transition-colors"
              >
                <option value="all">Any Year</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028+</option>
              </select>
            </div>
          </div>
        )}

        {/* Bedrooms */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400">
            Bedrooms
          </label>
          <select
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
            className="w-full bg-stone-50 text-stone-800 font-body text-sm rounded-xl px-3 py-2.5 outline-none border border-stone-200 focus:border-gold transition-colors"
          >
            <option value="all">Any Bedrooms</option>
            <option value="1">1 Bedroom</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3 Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold tracking-widest uppercase text-stone-400 flex items-center gap-1">
            Price Range (
            <DirhamIcon size={10} strokeWidth={3} className="pt-0.5" />)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full bg-stone-50 text-stone-800 font-body text-sm rounded-xl px-3 py-2.5 outline-none border border-stone-200 focus:border-gold transition-colors placeholder:text-stone-400"
            />
            <span className="text-stone-300 font-bold">—</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full bg-stone-50 text-stone-800 font-body text-sm rounded-xl px-3 py-2.5 outline-none border border-stone-200 focus:border-gold transition-colors placeholder:text-stone-400"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      {/* Header */}
      <section className="pt-20 bg-primary">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-12 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-gold font-body text-sm tracking-[0.3em] uppercase mb-2">
              Our Portfolio
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground">
              Properties
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Main content: sidebar + grid */}
      <section className="py-10">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-12">
          {/* Mobile top bar */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <p className="text-muted-foreground font-body text-sm">
              {loading ? "Loading..." : `${filtered.length} properties`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileSidebar(true)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-[#0D3430] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          <div className="flex gap-8 items-start">
            {/* ── Desktop Sidebar ─────────────────────────────── */}
            <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-white rounded-2xl border border-stone-100 shadow-sm p-6 self-start">
              <SidebarContent />
            </aside>

            {/* ── Property Grid ────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Desktop result count */}
              <p className="hidden lg:block text-muted-foreground font-body text-sm mb-6">
                {loading
                  ? "Discovering luxury assets..."
                  : `Showing ${filtered.length} properties`}
              </p>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="h-[400px] w-full bg-muted/20 animate-pulse rounded-lg"
                    />
                  ))}
                </div>
              ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filtered.map((property, i) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="font-display text-2xl text-foreground mb-2">
                    No properties found
                  </p>
                  <p className="text-muted-foreground font-body">
                    Try adjusting your search or filters.
                  </p>
                  <Button
                    variant="gold"
                    className="mt-6"
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Mobile Sidebar Overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
              onClick={() => setShowMobileSidebar(false)}
            />
            {/* Slide-in panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-[100] w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col"
            >
              {/* Mobile sidebar header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <span className="font-display font-bold text-[#0D3430] text-lg">
                  Filters
                </span>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-5 py-5">
                <SidebarContent />
              </div>
              {/* Mobile apply button */}
              <div className="px-5 py-4 border-t border-stone-100">
                <Button
                  className="w-full bg-[#0D3430] hover:bg-[#06201e] text-white h-12 rounded-xl font-bold tracking-widest text-xs uppercase"
                  onClick={() => setShowMobileSidebar(false)}
                >
                  Show {filtered.length} Properties
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Properties;
