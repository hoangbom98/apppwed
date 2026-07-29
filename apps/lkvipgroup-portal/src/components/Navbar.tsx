"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { User, Target, Handshake, Newspaper, TrendingUp, Menu, X } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { navVariants } from "@/lib/animation";

const navItems = [
  { label: "About", href: "/about", icon: User },
  { label: "Investment Focus", href: "/investment-focus", icon: Target },
  { label: "Approach", href: "/our-approach", icon: Handshake },
  { label: "Invest With Fortress", href: "/invest-with-fortress", icon: TrendingUp },
  { label: "Insights", href: "/insights", icon: Newspaper },
];

const linkVariants = {
  rest: { color: "rgba(255,255,255,0.8)" },
  hover: { color: "#C9A24A" },
};

const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) => (
  <motion.div initial="rest" whileHover="hover" className="group">
    <Link
      href={href}
      className="flex items-center gap-1.5 text-sm font-medium whitespace-nowrap"
    >
      <motion.div variants={linkVariants} transition={{ duration: 0.3 }}>
        <Icon className="w-4 h-4" />
      </motion.div>
      <motion.span variants={linkVariants} transition={{ duration: 0.3 }}>{label}</motion.span>
    </Link>
    <motion.div
      className="h-px bg-fortress-gold mt-0.5"
      initial={{ scaleX: 0 }}
      whileHover={{ scaleX: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{ transformOrigin: "left" }}
    />
  </motion.div>
);

const mobileItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  const bgClass = "bg-[#07111D]/95 backdrop-blur-md border-b border-white/5";

  return (
    <>
      <motion.header
        ref={headerRef}
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="fixed top-0 inset-x-0 z-50 h-24 flex px-0"
      >
        <div className={`flex-1 h-10 ${bgClass} z-20 relative min-w-0`}>
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} className="text-fortress-silver" />
            <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} className="text-fortress-silver" />
          </svg>
        </div>

        <div className="flex h-24 relative z-10 shrink-0 -ml-px">
          <div className="w-[50px] h-full relative shrink-0">
            <div className={`absolute inset-0 ${bgClass}`} style={{ clipPath: "path('M0 0 H50 V96 C25 96 25 40 0 40 Z')" }} />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 96">
              <path d="M0 39.5 C25 39.5 25 95.5 50 95.5" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} className="text-fortress-silver" />
              <path d="M0 36.5 C25 36.5 25 91 50 91" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} className="text-fortress-silver" />
            </svg>
          </div>

          <div className="flex-1 h-full relative min-w-0 -ml-px">
            <div className={`absolute inset-0 ${bgClass}`}>
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 96" preserveAspectRatio="none">
                <line x1="0" y1="95.5" x2="100%" y2="95.5" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} className="text-fortress-silver" />
                <line x1="0" y1="91" x2="100%" y2="91" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} className="text-fortress-silver" />
              </svg>
            </div>

            <div className="relative w-full h-full flex items-center justify-between px-4 md:px-8">
              <nav className="hidden md:flex gap-8 shrink-0">
                {navItems.slice(0, 3).map(item => (
                  <NavLink key={item.label} {...item} />
                ))}
              </nav>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`md:hidden p-1 transition-colors ${
                  scrolled ? "text-gray-600 hover:text-fortress-gold" : "text-white/80 hover:text-[#C9A24A]"
                }`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>

              <div className="flex justify-center shrink-0 mx-2 md:mx-4">
                <Link href="/" className="flex items-center group">
                  <Image
                    src="/large-logo1.png"
                    alt="Fortress Investment Holdings"
                    width={320}
                    height={96}
                    className="h-14 md:h-24 w-auto object-contain hidden md:block"
                    priority
                  />
                  <div className="block md:hidden">
                    <Image
                      src="/phone-logo.png"
                      alt="Fortress Investment Holdings"
                      width={200}
                      height={60}
                      className="h-14 w-auto object-contain"
                      priority
                    />
                  </div>
                </Link>
              </div>

              <nav className="hidden md:flex gap-6 items-center shrink-0">
                {navItems.slice(3).map(item => (
                  <NavLink key={item.label} {...item} />
                ))}
                <div className={`flex gap-4 pl-4 shrink-0 items-center border-l ${
                  scrolled ? "border-fortress-gold/20" : "border-white/10"
                }`}>
                  <motion.div
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Link
                      href="/contact"
                      className="block px-4 py-1.5 text-sm font-medium text-fortress-navy bg-fortress-gold hover:bg-fortress-champagne transition-colors whitespace-nowrap shadow-sm"
                    >
                      Contact Us
                    </Link>
                  </motion.div>
                </div>
              </nav>
            </div>
          </div>

          <div className="w-[50px] h-full relative shrink-0 -ml-px">
            <div className={`absolute inset-0 ${bgClass}`} style={{ clipPath: "path('M0 0 H50 V40 C25 40 25 96 0 96 Z')" }} />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 50 96">
              <path d="M0 95.5 C25 95.5 25 39.5 50 39.5" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} className="text-fortress-silver" />
              <path d="M0 91 C25 91 25 36.5 50 36.5" fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} className="text-fortress-silver" />
            </svg>
          </div>
        </div>

        <div className={`flex-1 h-10 ${bgClass} z-20 relative min-w-0 -ml-px`}>
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <line x1="0" y1="39.5" x2="100%" y2="39.5" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} className="text-fortress-silver" />
            <line x1="0" y1="36.5" x2="100%" y2="36.5" stroke="currentColor" strokeOpacity={0.08} strokeWidth={0.5} className="text-fortress-silver" />
          </svg>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-x-0 top-24 z-40 md:hidden"
          >
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="bg-[#07111D]/98 backdrop-blur-xl border-b border-white/10 p-4 shadow-2xl"
            >
              <nav className="flex flex-col gap-1">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.label}
                    custom={i}
                    variants={mobileItemVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 12 }}
                      >
                        <item.icon className="w-5 h-5 text-fortress-gold/80 group-hover:text-fortress-gold transition-colors" />
                      </motion.div>
                      <span className="font-medium text-white/80 group-hover:text-white transition-colors">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  custom={navItems.length}
                  variants={mobileItemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="mt-2"
                >
                  <Link
                    href="/contact"
                    className="flex items-center justify-center gap-2 p-3 bg-fortress-gold text-fortress-navy font-bold rounded-lg hover:bg-fortress-champagne transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Contact Us
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
