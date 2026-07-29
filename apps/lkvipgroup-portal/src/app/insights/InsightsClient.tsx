"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Search, X, Filter, Grid3X3, List, Clock,
  ArrowRight, BookOpen, Star,
  Building2, Briefcase, Cpu, UtensilsCrossed, Truck,
  LineChart, Newspaper, Handshake,
  Crown, FileText, Users, ChevronLeft, ChevronRight, TrendingUp
} from "lucide-react";
import { categories as rawCategories } from "./articles";

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const fadeLeft = {
  initial: { opacity: 0, x: -30 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const stagger = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

interface Article {
  slug: string; category: string; title: string; excerpt: string;
  date: string; readTime: string; tags?: string[];
  featuredImage?: string;
}

/* ─── Category helpers ───────────────────────────────────────── */
const CAT_ICONS: Record<string, React.ReactNode> = {
  "Real Estate": <Building2 className="w-3.5 h-3.5" />,
  "Business Acquisitions": <Briefcase className="w-3.5 h-3.5" />,
  "Private Equity": <TrendingUp className="w-3.5 h-3.5" />,
  "AI & Technology": <Cpu className="w-3.5 h-3.5" />,
  "Digital Assets & Blockchain": <Cpu className="w-3.5 h-3.5" />,
  "Hospitality": <UtensilsCrossed className="w-3.5 h-3.5" />,
  "Trading & Distribution": <Truck className="w-3.5 h-3.5" />,
  "Market Insights": <LineChart className="w-3.5 h-3.5" />,
  "Company News": <Newspaper className="w-3.5 h-3.5" />,
  "Strategic Investment Management": <Handshake className="w-3.5 h-3.5" />,
};
const CAT_COLORS: Record<string, string> = {
  "Real Estate": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Business Acquisitions": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Private Equity": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "AI & Technology": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Digital Assets & Blockchain": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Hospitality": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "Trading & Distribution": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Market Insights": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Company News": "bg-red-500/10 text-red-400 border-red-500/20",
  "Strategic Investment Management": "bg-teal-500/10 text-teal-400 border-teal-500/20",
};

const ARTICLES_PER_PAGE = 6;

const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d);
  } catch {
    return dateString;
  }
};

/* ─── Skeleton ───────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 animate-pulse overflow-hidden">
      <div className="h-52 bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-3 bg-white/5 w-1/3" />
        <div className="h-5 bg-white/5 w-full" />
        <div className="h-5 bg-white/5 w-3/4" />
        <div className="h-4 bg-white/5 w-full" />
        <div className="h-4 bg-white/5 w-5/6" />
      </div>
    </div>
  );
}

/* ─── Image map (category → public image) ───────────────────── */
const CAT_IMAGES: Record<string, string> = {
  "Real Estate": "/business.jpg",
  "Business Acquisitions": "/black-men-cafe-have-business.jpg",
  "Private Equity": "/plants-coins.jpg",
  "AI & Technology": "/businessman-reading.jpg",
  "Digital Assets & Blockchain": "/gold-coins.jpg",
  "Hospitality": "/employees.jpg",
  "Trading & Distribution": "/discussing-business.jpg",
  "Market Insights": "/strategy-ideas.jpg",
  "Company News": "/african-man-black-suit.jpg",
  "Strategic Investment Management": "/portrait-smiling.jpg",
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function InsightsClient() {
  const [articles, setArticles]               = useState<Article[]>([]);
  const [search, setSearch]                   = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags]       = useState<string[]>([]);
  const [viewMode, setViewMode]               = useState<"grid"|"list">("grid");
  const [page, setPage]                       = useState(1);
  const [loading, setLoading]                 = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.posts) {
          setArticles(data.data.posts.map((p: Record<string, unknown>) => ({
            ...p,
            date: p.publishedAt || p.createdAt,
          }) as Article));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory  = (c: string) => { setSelectedCategories(p => p.includes(c) ? p.filter(x=>x!==c) : [...p,c]); setPage(1); };
  const toggleTag       = (t: string) => { setSelectedTags(p => p.includes(t) ? p.filter(x=>x!==t) : [...p,t]); setPage(1); };

  const clearAll = () => {
    setSearch(""); setSelectedCategories([]); setSelectedTags([]);
    setPage(1);
  };

  const activeFilterCount = selectedCategories.length + selectedTags.length + (search ? 1 : 0);

  /* ── Filter + sort ── */
  const filtered = useMemo(() => {
    let list = [...articles];
    const q = search.toLowerCase().trim();
    if (q) list = list.filter(a =>
      a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) || (a.tags||[]).some(t=>t.toLowerCase().includes(q))
    );
    if (selectedCategories.length) list = list.filter(a => selectedCategories.includes(a.category));
    if (selectedTags.length) list = list.filter(a => (a.tags||[]).some(t=>selectedTags.includes(t)));
    return list;
  }, [search, selectedCategories, selectedTags, articles]);

  const totalPages     = Math.ceil(filtered.length / ARTICLES_PER_PAGE);
  const paginated      = filtered.slice((page-1)*ARTICLES_PER_PAGE, page*ARTICLES_PER_PAGE);

  const catCounts = useMemo(() =>
    rawCategories.reduce((acc,cat)=>{ acc[cat.label]=articles.filter(a=>a.category===cat.label).length; return acc; }, {} as Record<string,number>)
  ,[articles]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    articles.forEach(a => (a.tags || []).forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [articles]);

  /* ═══════════════════ SIDEBAR ═══════════════════ */
  const Sidebar = () => (
    <aside className="flex flex-col gap-4">

      {/* Search Removed */}

      {/* Categories */}
      <div className="bg-white border border-gray-200 shadow-sm p-4 ">
        <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3 flex items-center gap-1.5">
          <BookOpen className="w-3 h-3 text-[#C9A24A]" /> Categories
        </h3>
        <div className="flex flex-col">
          <button onClick={()=>{setSelectedCategories([]);setPage(1);}}
            className={`flex items-center justify-between px-2 py-2 text-sm transition-all border-l-2 ${selectedCategories.length===0?"border-[#C9A24A] text-[#C9A24A] font-semibold bg-[#C9A24A]/5":"border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
            <span className="flex items-center gap-2"><Grid3X3 className="w-3.5 h-3.5" /> All</span>
            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 ">{articles.length}</span>
          </button>
          {rawCategories.map(cat=>(
            <button key={cat.label} onClick={()=>toggleCategory(cat.label)}
              className={`flex items-center justify-between px-2 py-2 text-sm transition-all border-l-2 ${selectedCategories.includes(cat.label)?"border-[#C9A24A] text-[#C9A24A] font-semibold bg-[#C9A24A]/5":"border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}>
              <span className="flex items-center gap-2">{CAT_ICONS[cat.label]}<span className="truncate">{cat.label === "Digital Assets & Blockchain" ? "Digital & Blockchain" : cat.label === "Strategic Investment Management" ? "Strategic Mgmt" : cat.label}</span></span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 shrink-0 ">{catCounts[cat.label]||0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="bg-white border border-gray-200 shadow-sm p-4 ">
          <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-3"># Tags</h3>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(tag=>(
              <button key={tag} onClick={()=>toggleTag(tag)}
                className={`text-[11px] px-2.5 py-1 border font-medium transition-all  ${selectedTags.includes(tag)?"bg-[#C9A24A] text-[#07111D] border-[#C9A24A]":"bg-white/5 text-gray-500 border-white/10 hover:border-[#C9A24A]/50 hover:text-[#C9A24A]"}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter removed */}
    </aside>
  );

  /* ═══════════════════ GRID CARD ═══════════════════ */
  const GridCard = ({ article }: { article: Article }) => {
    const image = article.featuredImage || CAT_IMAGES[article.category] || "/business.jpg";
    return (
    <article className="group bg-white border border-gray-200 shadow-sm  overflow-hidden hover:border-[#C9A24A]/30 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 flex flex-col">
      {/* Image */}
      <div className="relative h-48 sm:h-52 overflow-hidden shrink-0">
        <Image src={image} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width:640px)100vw,(max-width:1024px)50vw,33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07111D] via-[#07111D]/40 to-transparent" />
        <div className="absolute top-3 left-3">
          <span className={`text-[10px] font-semibold px-2.5 py-1 border  ${CAT_COLORS[article.category]||"bg-gray-50 text-gray-600 border-gray-200"}`}>
            {article.category}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-sm sm:text-[15px] leading-snug mb-2 group-hover:text-[#C9A24A] transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-3 flex-1 line-clamp-2">{article.excerpt}</p>

        <div className="flex flex-wrap gap-1 mb-4">
          {(article.tags||[]).slice(0,3).map(tag=>(
            <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-400 ">{tag}</span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readTime}</span>
            <span>{formatDate(article.date)}</span>
          </div>
          <Link href={`/insights/${article.slug}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#C9A24A]/10 text-[#C9A24A] border border-[#C9A24A]/20 text-[11px] font-semibold  hover:bg-[#C9A24A] hover:text-[#07111D] transition-all">
            Read <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );};

  /* ═══════════════════ LIST CARD ═══════════════════ */
  const ListCard = ({ article }: { article: Article }) => {
    const image = article.featuredImage || CAT_IMAGES[article.category] || "/business.jpg";
    return (
    <article className="group bg-white border border-gray-200 shadow-sm  overflow-hidden hover:border-[#C9A24A]/30 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300 flex flex-col sm:flex-row">
      <div className="relative w-full sm:w-52 h-40 sm:h-auto shrink-0 overflow-hidden">
        <Image src={image} alt={article.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width:640px)100vw,208px" />
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-2.5 py-1 border  ${CAT_COLORS[article.category]||"bg-gray-50 text-gray-600 border-gray-200"}`}>{article.category}</span>
        </div>
        <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug mb-1.5 group-hover:text-[#C9A24A] transition-colors line-clamp-2">{article.title}</h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-3 line-clamp-2 flex-1">{article.excerpt}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {(article.tags||[]).slice(0,3).map(tag=>(
            <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-400 ">{tag}</span>
          ))}
        </div>
        <div className="flex items-center justify-between mt-auto gap-2">
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime}</span>
            <span className="hidden sm:inline">{formatDate(article.date)}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link href={`/insights/${article.slug}`} className="px-3 py-1.5 bg-[#C9A24A]/10 text-[#C9A24A] border border-[#C9A24A]/20 text-[11px] font-semibold  hover:bg-[#C9A24A] hover:text-[#07111D] transition-all flex items-center gap-1">
              Read <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );};

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */
  return (
    <>
      {/* ══ HERO ══ */}
      <motion.section {...fadeUp} className="relative pt-32 sm:pt-36 pb-24 sm:pb-32 bg-[#07111D] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage:"radial-gradient(#C9A24A 1px,transparent 1px)", backgroundSize:"32px 32px" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#07111D]" />
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 text-center">

          <h1 className="text-white text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-5 leading-tight mt-4 sm:mt-0">
            Insights &amp; <span className="bg-gradient-to-r from-[#C9A24A] to-[#E6C879] bg-clip-text text-transparent">Resources</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
            Investment perspectives, market analysis, and strategic commentary from Fortress Investment Holdings.
          </p>
          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8 relative">
            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-500" />
            <input type="text" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
              placeholder="Search articles…"
              className="w-full pl-11 sm:pl-14 pr-11 sm:pr-14 py-4 sm:py-[18px] bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder:text-gray-500 focus:outline-none focus:border-[#C9A24A]/50 transition-all backdrop-blur-sm  rounded-full" />
            {search && <button onClick={()=>setSearch("")} className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>

        </div>
      </motion.section>

      {/* ══ MAIN LAYOUT ══ */}
      <div className="w-full px-3 sm:px-4 md:pl-0 md:pr-8 lg:pr-12 py-6 sm:py-10">
        <div className="flex gap-6 lg:gap-8 items-start">

          {/* Sidebar desktop */}
          <motion.div {...fadeLeft} className="hidden md:block md:w-56 lg:w-72 xl:w-80 shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-4">
            <Sidebar />
          </motion.div>

          {/* Content */}
          <div ref={resultsRef} className="flex-1 min-w-0 w-full">

            {/* Mobile filter bar */}
            <div className="md:hidden flex items-center gap-2 mb-4">
              <button onClick={()=>setMobileDrawerOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-white/10 text-sm font-medium text-gray-500 hover:border-[#C9A24A]/50 hover:text-[#C9A24A] transition-all  shrink-0">
                <Filter className="w-4 h-4" /> Filters
                {activeFilterCount>0&&<span className="bg-[#C9A24A] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center ">{activeFilterCount}</span>}
              </button>
              <div className="flex-1 relative min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
                  placeholder="Search…" className="w-full pl-9 pr-3 py-2.5 bg-white border border-white/10 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-[#C9A24A]/60 transition-all " />
              </div>
            </div>

            {/* ── LATEST ARTICLE ── */}
            {!loading && filtered.length > 0 && (
              <motion.section {...fadeUp} className="mb-8 sm:mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase flex items-center gap-1.5 shrink-0">
                    <BookOpen className="w-3.5 h-3.5 text-[#C9A24A]" /> Latest Article
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <article className="group bg-white border border-gray-200 shadow-sm  overflow-hidden hover:border-[#C9A24A]/30 hover:shadow-2xl hover:shadow-black/30 transition-all duration-300">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-[48%] relative h-56 sm:h-64 md:h-auto md:min-h-[320px] shrink-0 overflow-hidden">
                      <Image src={filtered[0].featuredImage || CAT_IMAGES[filtered[0].category] || "/business.jpg"} alt={filtered[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="(max-width:768px)100vw,50vw" />
                      <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#07111D] to-transparent" />
                      <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1 sm:py-1.5 border  ${CAT_COLORS[filtered[0].category]||"bg-gray-50 text-gray-600 border-gray-200"}`}>{filtered[0].category}</span>
                      </div>
                    </div>
                    <div className="p-5 sm:p-8 md:p-10 flex flex-col justify-center flex-1">
                      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                        <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {filtered[0].readTime}</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-snug group-hover:text-[#C9A24A] transition-colors">{filtered[0].title}</h2>
                      <p className="text-gray-500 text-sm sm:text-base leading-relaxed mb-4 sm:mb-5 line-clamp-3 md:line-clamp-none">{filtered[0].excerpt}</p>
                      <div className="flex flex-wrap gap-1.5 mb-5 sm:mb-6">
                        {(filtered[0].tags||[]).map(tag=>(
                          <span key={tag} className="text-xs px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-400 ">{tag}</span>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <span className="text-xs text-gray-500">{formatDate(filtered[0].date)}</span>
                        <Link href={`/insights/${filtered[0].slug}`}
                          className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#C9A24A]/10 text-[#C9A24A] border border-[#C9A24A]/20 text-sm font-semibold  hover:bg-[#C9A24A] hover:text-[#07111D] transition-all w-full sm:w-auto justify-center">
                          Read Article <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </motion.section>
            )}

            {/* ── TOOLBAR ── */}
            <motion.div {...stagger} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-4 sm:mb-5 py-3 border-t border-b border-gray-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-500"><span className="font-bold text-gray-900">{filtered.length}</span> articles</span>
                {activeFilterCount>0&&(
                  <button onClick={clearAll} className="flex items-center gap-1 text-xs text-red-400 font-medium bg-red-500/10 px-2.5 py-1.5 border border-red-500/20 ">
                    <X className="w-3 h-3" /> Clear ({activeFilterCount})
                  </button>
                )}
                {selectedCategories.slice(0,2).map(c=>(
                  <span key={c} className="flex items-center gap-1 text-[10px] bg-[#C9A24A]/10 text-[#C9A24A] border border-[#C9A24A]/20 px-2 py-1 font-medium max-w-[100px] truncate ">
                    {c}<button onClick={()=>toggleCategory(c)} className="shrink-0"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="flex bg-gray-50 border border-gray-200 overflow-hidden ">
                  <button onClick={()=>setViewMode("grid")} className={`p-2.5 transition-colors ${viewMode==="grid"?"bg-[#C9A24A]/20 text-[#C9A24A]":"text-gray-500 hover:text-gray-900"}`} aria-label="Grid view"><Grid3X3 className="w-4 h-4" /></button>
                  <button onClick={()=>setViewMode("list")} className={`p-2.5 transition-colors ${viewMode==="list"?"bg-[#C9A24A]/20 text-[#C9A24A]":"text-gray-500 hover:text-gray-900"}`} aria-label="List view"><List className="w-4 h-4" /></button>
                </div>
              </div>
            </motion.div>

            {/* ── ARTICLES ── */}
            {loading ? (
              <div className={`grid gap-4 sm:gap-5 ${viewMode==="grid"?"grid-cols-1 sm:grid-cols-2 xl:grid-cols-3":"grid-cols-1"}`}>
                {Array.from({length:3}).map((_,i)=><SkeletonCard key={i} />)}
              </div>
            ) : paginated.length===0 ? (
              <motion.div {...stagger} className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 flex items-center justify-center mb-4 sm:mb-5 ">
                  <Search className="w-7 h-7 sm:w-8 sm:h-8 text-gray-500/30" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-500 text-sm mb-5 sm:mb-6 max-w-xs">Try adjusting your search or removing some filters.</p>
                <button onClick={clearAll} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#C9A24A]/10 text-[#C9A24A] border border-[#C9A24A]/20 text-sm font-semibold  hover:bg-[#C9A24A] hover:text-[#07111D] transition-all">Clear All Filters</button>
              </motion.div>
            ) : (
              <motion.div {...stagger} className={viewMode==="grid"?"grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5":"flex flex-col gap-3 sm:gap-4"}>
                {paginated.map((a,i)=>viewMode==="grid"?<motion.div key={a.slug} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.08,duration:0.4}}><GridCard article={a}/></motion.div>:<motion.div key={a.slug} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.06,duration:0.4}}><ListCard article={a}/></motion.div>)}
              </motion.div>
            )}

            {/* ── PAGINATION ── */}
            {!loading && totalPages>1 && (
              <motion.div {...stagger} className="flex items-center justify-center gap-1.5 sm:gap-2 mt-8 sm:mt-10 flex-wrap">
                <button onClick={()=>{setPage(p=>Math.max(1,p-1));resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"});}}
                  disabled={page===1} className="p-2.5 border border-white/10 text-gray-500 hover:border-[#C9A24A]/50 hover:text-[#C9A24A] disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white ">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({length:totalPages}).map((_,i)=>(
                  <button key={i} onClick={()=>{setPage(i+1);resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"});}}
                    className={`w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm font-semibold transition-all border  ${page===i+1?"bg-[#C9A24A]/20 text-[#C9A24A] border-[#C9A24A]/30":"bg-white text-gray-500 border-white/10 hover:border-[#C9A24A]/50 hover:text-[#C9A24A]"}`}>
                    {i+1}
                  </button>
                ))}
                <button onClick={()=>{setPage(p=>Math.min(totalPages,p+1));resultsRef.current?.scrollIntoView({behavior:"smooth",block:"start"});}}
                  disabled={page===totalPages} className="p-2.5 border border-white/10 text-gray-500 hover:border-[#C9A24A]/50 hover:text-[#C9A24A] disabled:opacity-30 disabled:cursor-not-allowed transition-all bg-white ">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ══ PREMIUM CTA ══ */}
      <motion.section {...fadeUp} className="bg-[#07111D] py-20 mx-4 md:mx-8 mb-10 overflow-hidden relative rounded-2xl">
        <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"radial-gradient(#C9A24A 1px,transparent 1px)",backgroundSize:"28px 28px"}} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px bg-gradient-to-r from-transparent via-[#C9A24A]/50 to-transparent" />
        <div className="relative max-w-[900px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-[#C9A24A]/10 border border-[#C9A24A]/20 text-[#C9A24A] text-xs font-semibold tracking-widest uppercase px-4 py-2 mb-6">
            <Crown className="w-3.5 h-3.5" /> Premium Access
          </div>
          <h2 className="text-white text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Unlock Exclusive<br /><span className="bg-gradient-to-r from-[#C9A24A] to-[#E6C879] bg-clip-text text-transparent">Investment Intelligence</span>
          </h2>
          <p className="text-gray-400 text-base mb-10 max-w-xl mx-auto leading-relaxed">
            Get unlimited access to premium research, templates, and expert consultancy resources curated for serious investors.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              {icon:<FileText className="w-5 h-5"/>,title:"Premium Articles",desc:"In-depth analysis & research"},
              {icon:<Users className="w-5 h-5"/>,title:"Expert Consultancy",desc:"Direct access to our team"},
              {icon:<Star className="w-5 h-5"/>,title:"Market Reports",desc:"Exclusive sector insights"},
            ].map((b,i)=>(
              <motion.div key={b.title} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.12,duration:0.5,ease:"easeOut"}} className="bg-gray-50 border border-gray-200 p-5 text-left hover:border-[#C9A24A]/30 transition-colors rounded-xl">
                <div className="text-[#C9A24A] mb-3">{b.icon}</div>
                <p className="text-white text-sm font-semibold mb-1">{b.title}</p>
                <p className="text-gray-500 text-xs">{b.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/invest-with-fortress" className="px-8 py-4 bg-[#C9A24A] hover:bg-[#E6C879] text-[#07111D] font-bold text-sm transition-all shadow-xl hover:-translate-y-0.5 rounded-lg">Become a Member</Link>
            <Link href="/contact" className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-bold text-sm transition-all hover:bg-white/5 rounded-lg">Talk to Our Team</Link>
          </div>
        </div>
      </motion.section>

      {/* ══ MOBILE DRAWER ══ */}
      {mobileDrawerOpen&&(
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={()=>setMobileDrawerOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[80vw] max-w-[300px] sm:max-w-[320px] bg-[#03080e] overflow-y-auto shadow-2xl border-r border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#07111D] sticky top-0 z-10">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#C9A24A]" /> Filters
                {activeFilterCount>0&&<span className="bg-[#C9A24A] text-[#07111D] text-[10px] font-bold px-2 py-0.5 ">{activeFilterCount}</span>}
              </h2>
              <div className="flex items-center gap-2">
                {activeFilterCount>0&&<button onClick={clearAll} className="text-xs text-red-400 font-medium">Clear all</button>}
                <button onClick={()=>setMobileDrawerOpen(false)} className="p-1.5 hover:bg-white/5 text-gray-500 transition-colors "><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4"><Sidebar /></div>
            <div className="sticky bottom-0 p-4 bg-[#07111D] border-t border-gray-200">
              <button onClick={()=>setMobileDrawerOpen(false)}
                className="w-full py-3 bg-[#C9A24A]/10 text-[#C9A24A] border border-[#C9A24A]/20 text-sm font-semibold  hover:bg-[#C9A24A] hover:text-[#07111D] transition-all">
                Show {filtered.length} Articles
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
