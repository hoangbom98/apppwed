"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { motion } from "framer-motion";
import PageTransition from "@/components/animations/PageTransition";
import Reveal from "@/components/animations/Reveal";
import Stagger from "@/components/animations/Stagger";
import StaggerItem from "@/components/animations/StaggerItem";
import {
  Search,
  ClipboardCheck,
  TrendingUp,
  BarChart3,
  Handshake,
  ArrowRight,
  CheckCircle2,
  Users,
  Target,
  Shield,
  Star,
  Zap,
  Activity,
  BarChart2,
  Leaf,
  ChevronRight,
  CheckCheck,
} from "lucide-react";

// ─── Data Definitions ─────────────────────────────────────────────────────────

const processSteps = [
  {
    step: "01",
    icon: Search,
    title: "Identify Opportunities",
    subtitle: "Finding Businesses and Assets With Potential",
    description:
      "Great opportunities rarely announce themselves. We find them through our professional networks, direct submissions, market research, trusted advisors, business owners, developers, investors, and strategic partners. We focus on opportunities that address genuine market demand and demonstrate a clear reason for long-term relevance, not momentum, not hype, not fear of missing out.",
  },
  {
    step: "02",
    icon: ClipboardCheck,
    title: "Evaluate Risk and Potential",
    subtitle: "Looking Beyond the Presentation",
    description:
      "Every business looks good in a pitch deck. Our job is to understand what it looks like on a difficult Tuesday in a difficult quarter.",
    checklist: [
      { label: "Business model", desc: "how the company actually makes money" },
      { label: "Market demand", desc: "evidence of genuine, durable customer need" },
      { label: "Competitive position", desc: "why this business wins" },
      { label: "Leadership and management", desc: "the people who will deliver the plan" },
      { label: "Historical financial performance", desc: "what the numbers actually show" },
      { label: "Revenue quality and cash flow", desc: "the difference between growth and health" },
      { label: "Legal structure", desc: "clean foundations" },
      { label: "Operational requirements", desc: "what it takes to run and scale" },
      { label: "Valuation", desc: "a price that leaves room for everyone to succeed" },
    ],
  },
  {
    step: "03",
    icon: TrendingUp,
    title: "Invest Strategically",
    subtitle: "Structuring Every Investment With Purpose",
    description:
      "Once an opportunity meets our criteria, we design an investment structure that fits the needs of the business and the interests of all stakeholders. The goal in every case: a clear, responsible structure with appropriate governance, accountability, and alignment. Ambiguity is where partnerships fail, so we remove it at the start.",
    structures: [
      { label: "Full acquisition", desc: "complete ownership transition" },
      { label: "Majority or minority investment", desc: "flexible equity positions" },
      { label: "Growth capital", desc: "funding tied to a clear expansion plan" },
      { label: "Joint venture or co-investment", desc: "shared ownership with aligned partners" },
      { label: "Asset acquisition", desc: "purchasing specific assets rather than entities" },
      { label: "Structured financing", desc: "tailored solutions for complex situations" },
    ],
  },
  {
    step: "04",
    icon: BarChart3,
    title: "Manage and Grow Value",
    subtitle: "Contributing Beyond Capital",
    description:
      "Signing the agreement is where our work begins, not where it ends. Fortress actively supports development through strategic planning, financial oversight, management support, business development, brand development, technology implementation, operational improvement, governance, and partnership development.",
    supportAreas: [
      { label: "Strategic planning", desc: "clear direction and measurable objectives" },
      { label: "Financial oversight", desc: "disciplined reporting and performance management" },
      { label: "Management support", desc: "strengthening the team" },
      { label: "Business development", desc: "opening doors, expanding markets" },
      { label: "Brand development", desc: "building recognition and trust" },
      { label: "Technology", desc: "modernising operations" },
      { label: "Operational improvement", desc: "practical efficiency gains" },
      { label: "Governance", desc: "accountability that protects value" },
      { label: "Partnership development", desc: "connections that create opportunity" },
    ],
  },
  {
    step: "05",
    icon: Handshake,
    title: "Manage for Long-Term Value",
    subtitle: "Disciplined Oversight. Sustainable Performance.",
    description:
      "Long-term value is created through disciplined management, consistent monitoring, and informed decision-making. We maintain clear investment objectives, transparent reporting, and structured oversight throughout the investment lifecycle.\n\nOur team continuously reviews performance, manages risk, and responds to changing market conditions while remaining focused on sustainable income and long-term capital growth. Every investment is managed with accountability, clarity, and alignment with the agreed strategy.",
  },
];

const evaluationPrinciples = [
  { number: "01", title: "Strong and ethical leadership", desc: "character precedes capability", icon: Star },
  { number: "02", title: "Genuine customer demand", desc: "real revenue from real customers", icon: Users },
  { number: "03", title: "Clear financial information", desc: "transparency as a starting condition", icon: BarChart2 },
  { number: "04", title: "Realistic valuation", desc: "pricing that reflects evidence, not enthusiasm", icon: Target },
  { number: "05", title: "Scalable operations", desc: "growth without structural strain", icon: TrendingUp },
  { number: "06", title: "Competitive differentiation", desc: "a defensible reason to win", icon: Zap },
  { number: "07", title: "Responsible governance", desc: "structures that protect all stakeholders", icon: Shield },
  { number: "08", title: "Manageable risk", desc: "downside we can understand and absorb", icon: Activity },
  { number: "09", title: "Sustainable growth potential", desc: "value that compounds over time", icon: Leaf },
];

export default function OurApproachPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-white text-fortress-ivory relative">
        <Navbar />

        {/* ── 1. Hero Section ──────────────────────────────────────────────── */}
        <section className="relative pt-24 pb-14 md:pt-36 md:pb-28 overflow-hidden bg-fortress-navy border-b border-fortress-gold/10">
          {/* Background mesh */}
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#C9A24A_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          {/* Ambient glows */}
          <div className="absolute top-0 right-0 w-64 h-64 md:w-[500px] md:h-[500px] bg-fortress-gold/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 md:w-[400px] md:h-[400px] bg-fortress-champagne/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <Reveal>
                <span className="inline-block text-fortress-gold text-xs sm:text-sm font-semibold tracking-[4px] sm:tracking-[6px] uppercase mb-4 px-4 py-1.5 rounded-full border border-fortress-gold/20 bg-fortress-gold/10">
                  Our Approach
                </span>
              </Reveal>

              <Reveal delay={0.1}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white uppercase mb-5 sm:mb-6 leading-[1.15]">
                  Disciplined{" "}
                  <span className="font-bold bg-gradient-to-r from-fortress-gold to-fortress-champagne bg-clip-text text-transparent">
                    Strategic
                  </span>{" "}
                  Long-Term
                </h1>
              </Reveal>

              <Reveal delay={0.2}>
                <p className="text-fortress-silver/90 text-sm sm:text-lg md:text-xl leading-relaxed mb-8 md:mb-10 font-light mx-auto">
                  Our investment process is designed to identify quality opportunities, manage risk, and build sustainable value through careful evaluation and active strategic involvement.
                </p>
              </Reveal>

              <Reveal delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
                  <Link
                    href="#process"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-fortress-gold to-fortress-champagne text-fortress-navy font-bold text-xs tracking-widest uppercase hover:opacity-90 transition-all rounded-sm shadow-xl shadow-fortress-gold/15 group"
                  >
                    Explore Our Process
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="#principles"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3.5 sm:py-4 border border-fortress-gold/30 text-fortress-ivory font-bold text-xs tracking-widest uppercase hover:bg-white/10 hover:border-white transition-all rounded-sm"
                  >
                    Evaluation Principles
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── 2. Investment Process Section ──────────────────────────────── */}
        <section
          id="process"
          className="py-12 md:py-28 bg-fortress-navy mx-2 sm:mx-4 rounded-2xl border border-fortress-gold/20 my-4 sm:my-8"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12">

            {/* Section Header */}
            <Reveal className="text-center max-w-3xl mx-auto mb-10 md:mb-20">
              <span className="text-fortress-gold text-[10px] sm:text-sm font-semibold tracking-[3px] sm:tracking-[6px] uppercase block mb-3">
                How We Invest
              </span>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-light text-white uppercase tracking-tight mb-3 sm:mb-4">
                Our <span className="font-semibold text-fortress-gold">Investment Process</span>
              </h2>
              <p className="text-fortress-gold font-semibold text-base sm:text-xl mb-3 sm:mb-4">
                Every opportunity is different. Our standards never are.
              </p>
              <p className="text-fortress-silver/80 text-sm sm:text-lg leading-relaxed font-light">
                Our decisions follow a consistent framework built on research, discipline, transparency, and long-term alignment. We assess the quality of the opportunity, the capability of the people behind it, the market environment, the financial requirements, the risks involved, and the realistic potential for sustainable value creation.
              </p>
            </Reveal>

            <div className="space-y-5 sm:space-y-8 md:space-y-12">
              {processSteps.map((stepItem, i) => {
                const Icon = stepItem.icon;
                return (
                  <Reveal key={i}>
                    <div className="group relative bg-fortress-deep border border-fortress-gold/15 hover:border-fortress-gold/40 rounded-xl sm:rounded-2xl p-5 sm:p-8 md:p-10 transition-all duration-300">

                      {/* Top bar */}
                      <div className="flex items-center justify-between gap-3 mb-5 border-b border-fortress-gold/10 pb-5">
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-fortress-gold/10 text-fortress-gold border border-fortress-gold/20 flex items-center justify-center shrink-0 group-hover:bg-fortress-gold group-hover:text-fortress-navy transition-colors duration-300">
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-fortress-gold text-[10px] font-mono font-bold tracking-widest uppercase block">
                              Step {stepItem.step}
                            </span>
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-fortress-ivory leading-tight">
                              {stepItem.title}
                            </h3>
                          </div>
                        </div>
                        <span className="hidden sm:block text-4xl sm:text-5xl font-black font-mono text-fortress-gold/20 select-none shrink-0">
                          {stepItem.step}
                        </span>
                      </div>

                      <p className="text-fortress-gold font-semibold text-sm sm:text-base mb-2 sm:mb-3">
                        {stepItem.subtitle}
                      </p>

                      <div className="text-fortress-silver/80 text-sm leading-relaxed mb-4 space-y-3 sm:space-y-4">
                        {stepItem.description.split("\n\n").map((paragraph, idx) => (
                          <p key={idx}>{paragraph}</p>
                        ))}
                      </div>

                      {/* Step 02 checklist */}
                      {stepItem.checklist && (
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-fortress-gold/10">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                            {stepItem.checklist.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2.5 p-3 rounded-xl bg-fortress-navy border border-fortress-gold/15"
                              >
                                <CheckCircle2 className="w-4 h-4 text-fortress-gold shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-xs font-bold text-fortress-ivory block capitalize">
                                    {item.label}
                                  </span>
                                  <span className="text-[11px] text-fortress-silver/70 leading-snug">
                                    {item.desc}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 03 structures */}
                      {stepItem.structures && (
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-fortress-gold/10">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                            {stepItem.structures.map((struct, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-fortress-navy border border-fortress-gold/15"
                              >
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-fortress-gold shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-xs sm:text-sm font-bold text-fortress-ivory block mb-0.5 sm:mb-1 capitalize">
                                    {struct.label}
                                  </span>
                                  <span className="text-[11px] sm:text-xs text-fortress-silver/70">
                                    {struct.desc}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step 04 support areas */}
                      {stepItem.supportAreas && (
                        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-fortress-gold/10">
                          <span className="text-fortress-ivory text-xs sm:text-sm font-bold uppercase tracking-wider block mb-3 sm:mb-4">
                            Active Support Areas
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                            {stepItem.supportAreas.map((area, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2.5 p-3 rounded-xl bg-fortress-navy border border-fortress-gold/15"
                              >
                                <CheckCheck className="w-4 h-4 text-fortress-gold shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-xs font-bold text-fortress-ivory block capitalize">
                                    {area.label}
                                  </span>
                                  <span className="text-[11px] text-fortress-silver/70 leading-snug">
                                    {area.desc}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3. Evaluation Principles Section ───────────────────────────── */}
        <section
          id="principles"
          className="py-12 md:py-28 bg-fortress-navy text-fortress-ivory mx-2 sm:mx-4 rounded-2xl border border-fortress-gold/20 my-4 sm:my-8"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12">

            <Reveal className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
              <span className="text-fortress-gold text-[10px] sm:text-sm font-semibold tracking-[3px] sm:tracking-[6px] uppercase block mb-3">
                What We Look For
              </span>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-light uppercase tracking-tight text-white mb-3 sm:mb-4">
                Evaluation <span className="font-semibold text-fortress-gold">Principles</span>
              </h2>
              <p className="text-fortress-silver/80 text-sm sm:text-lg leading-relaxed font-light">
                Nine non-negotiable standards applied to every opportunity we assess.
              </p>
            </Reveal>

            <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {evaluationPrinciples.map((item, i) => {
                const Icon = item.icon;
                return (
                  <StaggerItem key={i}>
                    <motion.div
                      whileHover={{ y: -6, borderColor: "rgba(201,162,74,0.4)" }}
                      className="group p-5 sm:p-8 rounded-xl sm:rounded-2xl bg-fortress-deep border border-fortress-gold/15 transition-all duration-300 h-full flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4 sm:mb-5">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-fortress-gold/10 border border-fortress-gold/20 flex items-center justify-center text-fortress-gold group-hover:bg-fortress-gold group-hover:text-fortress-navy transition-colors duration-300">
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <span className="text-xl sm:text-2xl font-black font-mono text-fortress-gold/30 group-hover:text-fortress-gold/50 transition-colors">
                            {item.number}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-semibold text-fortress-ivory mb-1.5 sm:mb-2 capitalize">
                          {item.title}
                        </h3>
                        <p className="text-fortress-silver/70 text-xs sm:text-sm leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                      <div className="h-0.5 bg-gradient-to-r from-fortress-gold/40 to-transparent mt-5 sm:mt-6 group-hover:from-fortress-gold transition-colors" />
                    </motion.div>
                  </StaggerItem>
                );
              })}
            </Stagger>

          </div>
        </section>

        <Footer />
      </main>
    </PageTransition>
  );
}
