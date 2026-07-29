"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Stagger from "@/components/animations/Stagger";
import StaggerItem from "@/components/animations/StaggerItem";

const columns = [
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Our Journey", href: "/about#journey" },
      { label: "Leadership Team", href: "/about#leadership" },
      { label: "Careers", href: "/about#careers" },
      { label: "News & Press", href: "/insights" },
    ],
  },
  {
    heading: "Investments",
    links: [
      { label: "Investment Focus", href: "/investment-focus" },
      { label: "Our Portfolio", href: "/investment-focus#portfolio" },
      { label: "Real Estate", href: "/investment-focus#real-estate" },
      { label: "Private Equity", href: "/investment-focus#private-equity" },
      { label: "Technology", href: "/investment-focus#technology" },
      { label: "Hospitality", href: "/investment-focus#hospitality" },
    ],
  },
  {
    heading: "INVESTOR ACCESS",
    links: [
      { label: "Invest With Fortress", href: "/invest-with-fortress" },
      { label: "Investment Focus", href: "/investment-focus" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Insights", href: "/insights" },
      { label: "Reports", href: "/insights#reports" },
      { label: "ESG Commitment", href: "/our-approach#esg" },
      { label: "FAQs", href: "/about#faqs" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

const pillars = [
  {
    title: "BUILT ON TRUST",
    sub: "Integrity in everything we do",
    icon: (
      <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 3 L28 8 V17 C28 23.627 22.627 29 16 29 C9.373 29 4 23.627 4 17 V8 Z" strokeLinejoin="round" />
        <path d="M11 16.5 L14.5 20 L21 13" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "DRIVEN BY IMPACT",
    sub: "Delivering sustainable long-term value",
    icon: (
      <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="18" width="5" height="10" rx="1" />
        <rect x="13" y="12" width="5" height="16" rx="1" />
        <rect x="22" y="6" width="5" height="22" rx="1" />
        <path d="M6 14 L14 9 L21 13 L28 5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M24 5 L28 5 L28 9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "MANAGED WITH DISCIPLINE",
    sub: "Carefully selected, monitored, and managed investment opportunities.",
    icon: (
      <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 18 C4 18 7 14 11 15 L16 16 C18 16.5 20 15.5 20 14 C20 12.5 18.5 12 17 12.5 L14 13.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 14 L26 10 C27.5 9 28.5 10.5 27.5 12 L21 17 C19.5 18.5 17 19 15 18.5 L10 17 C8 16.5 6 17.5 4 18" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 22 L7 18" strokeLinecap="round" />
        <path d="M9 9 C9 9 11 6 14 8 C17 10 14 13 16 14" strokeLinecap="round" />
      </svg>
    ),
  },
];

const socialLinks = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/135716850/admin/dashboard/?editPageActiveTab=info",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/fortressihdubai/",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61591930895552",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://x.com/Fortressih",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Threads",
    href: "https://www.threads.com/@fortressihdubai",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 448 512" fill="currentColor">
        <path d="M340.8 238c-.6-69.6-38.3-111.5-102-111.5-42.5 0-78.3 19.2-97.1 49.9l41.2 28.7c10.7-16.8 25.4-30.8 52.4-30.8 30.5 0 46.3 17 50.8 48.5-14.7-2.3-29.5-3.5-44.6-3.5-82.4 0-121.1 37.3-121.1 86.6s38.8 79.7 95.9 79.7c62.7 0 100.1-42.2 115.4-94.5 15.9 7.2 26.9 24 26.9 49.3 0 67.6-78 104.5-144.1 104.5-97.5 0-161.3-64-161.3-168.2 0-127.6 84.3-209.4 197.6-209.4 76 0 113.6 33.4 139.2 78.1L432 115.9c-27.8-58-89.9-99.5-183.1-99.5-148.5 0-249.5 105.4-249.5 258.2 0 139.8 98.9 220.9 216.7 220.9 97.4 0 195.8-56.8 195.8-154 0-50.8-29.2-84.5-71.2-103.5zM214.4 334.9c-21.5 0-40.4-10.2-40.4-29 0-29.6 36.4-38.6 72-38.6 13.5 0 26.8 .9 38.5 3.5-8.4 38.5-33.4 64.2-70 64.2l0 0z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@FortressIH",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Footer() {
  return (
    <motion.footer
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={sectionReveal}
      className="relative overflow-hidden rounded-t-2xl"
    >
      <div className="relative">
        <div className="absolute inset-0 z-0">
          <Image
            src="/Hero-Background.png"
            alt=""
            fill
            className="object-cover object-right"
            sizes="100vw"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080e1a] via-[#080e1a]/92 to-[#080e1a]/65" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080e1a] via-transparent to-[#080e1a]/40" />
        </div>

        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A24A]/50 to-transparent z-10" />

        <Stagger>
          <StaggerItem>
            <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-16 pt-16 pb-14 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-12">
              <div className="flex flex-col gap-6">
                <Link href="/" className="inline-block">
                  <Image
                    src="/large-logo.png"
                    alt="Fortress Investment Holdings"
                    width={320}
                    height={96}
                    className="h-24 w-auto object-contain drop-shadow-lg"
                  />
                </Link>
                <p className="text-[#8fa0b8] text-sm leading-relaxed max-w-[230px]">
                  A Dubai-based diversified investment holding company focused on identifying, acquiring, and growing high-potential opportunities across real estate, private equity, technology, digital assets, energy, commodities, and hospitality.
                </p>
                <motion.a
                  href="#"
                  className="inline-flex items-center gap-2.5 border border-[#C9A24A]/50 text-[#C9A24A] text-xs font-semibold tracking-widest uppercase px-5 py-3 w-fit hover:bg-[#C9A24A]/10 transition-colors"
                  whileHover={{ borderColor: "rgba(201,162,74,0.9)" }}
                  transition={{ duration: 0.2 }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="13" x2="15" y2="13" />
                    <line x1="9" y1="17" x2="12" y2="17" />
                  </svg>
                  Download Brochure
                </motion.a>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                {columns.map((col) => (
                  <div key={col.heading} className="flex flex-col gap-4">
                    <div>
                      <h4 className="text-white text-xs font-bold tracking-[3px] uppercase mb-2">
                        {col.heading}
                      </h4>
                      <div className="h-[1.5px] w-8 bg-[#C9A24A]" />
                    </div>
                    <ul className="flex flex-col gap-2.5">
                      {col.links.map((l) => (
                        <li key={l.label}>
                          <Link
                            href={l.href}
                            className="group flex items-center gap-1.5 text-[13px] text-[#8fa0b8] hover:text-[#C9A24A] transition-colors"
                          >
                            <svg
                              className="w-2.5 h-2.5 text-[#C9A24A]/60 group-hover:text-[#C9A24A] shrink-0 transition-colors"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                            {l.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative z-10 bg-[#060c17] border-t border-[#C9A24A]/15"
            >
              <div className="max-w-[1400px] mx-auto px-6 lg:px-16 py-6 flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-0 justify-between">
                <div className="flex flex-col gap-1 shrink-0">
                  <Link href="/" className="flex items-baseline gap-1.5">
                    <span className="text-white text-sm font-bold tracking-[5px] uppercase">FORTRESS</span>
                    <span className="text-[#C9A24A] text-sm font-bold tracking-[5px] uppercase">IH</span>
                  </Link>
                  <p className="text-[#8fa0b8]/50 text-[11px] leading-snug">
                    &copy; {new Date().getFullYear()} Fortress Investment Holdings.
                    <br />
                    All Rights Reserved.
                  </p>
                </div>

                <div className="flex flex-row gap-6 sm:gap-10 lg:gap-14">
                  {pillars.map((p) => (
                    <div key={p.title} className="group relative flex items-center justify-center">
                      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
                        <div className="bg-[#0f1a2e] border border-[#C9A24A]/30 rounded px-3 py-2 shadow-xl whitespace-nowrap">
                          <p className="text-white text-[11px] font-bold tracking-[2px] uppercase leading-tight text-center">
                            {p.title}
                          </p>
                          <p className="text-[#8fa0b8] text-[10px] leading-snug mt-0.5 text-center">
                            {p.sub}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-[#0f1a2e] border-r border-b border-[#C9A24A]/30 rotate-45 mx-auto -mt-1" />
                      </div>
                      <div className="relative flex items-center justify-center w-11 h-11 shrink-0">
                        <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full" fill="none">
                          <polygon
                            points="22,2 40,12 40,32 22,42 4,32 4,12"
                            stroke="#C9A24A"
                            strokeOpacity="0.5"
                            strokeWidth="1"
                          />
                        </svg>
                        <span className="text-[#C9A24A]/80">{p.icon}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2.5 shrink-0">
                  <p className="text-white text-[11px] font-bold tracking-[3px] uppercase">
                    FOLLOW US
                  </p>
                  <div className="flex items-center gap-2">
                    {socialLinks.map((s) => (
                      <motion.a
                        key={s.label}
                        href={s.href}
                        aria-label={s.label}
                        className="w-8 h-8 rounded-full border border-[#8fa0b8]/25 flex items-center justify-center text-[#8fa0b8]/60 hover:border-[#C9A24A]/60 hover:text-[#C9A24A] transition-colors"
                        whileHover={{ scale: 1.12, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 450, damping: 18 }}
                      >
                        {s.icon}
                      </motion.a>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </StaggerItem>
        </Stagger>
      </div>
    </motion.footer>
  );
}
