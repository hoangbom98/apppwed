"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const heroContainerVariants = {
  hidden: { opacity: 0, scale: 1.03 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const heroChildrenVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.18, delayChildren: 0.6 },
  },
};

const heroItemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const heroButtonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Hero() {
  return (
    <motion.section
      variants={heroContainerVariants}
      initial="hidden"
      animate="visible"
      className="relative min-h-[85vh] md:min-h-screen pt-20 pb-12 md:pt-28 md:pb-16 px-5 sm:px-6 lg:px-12 flex flex-col items-center justify-center overflow-hidden bg-fortress-navy"
    >
      {/* Background image with layered gradient overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/Hero-Background.png"
          alt="Fortress Investment Holdings"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-fortress-navy/80 md:bg-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-fortress-navy/95 via-fortress-navy/85 md:via-fortress-navy/80 to-fortress-navy/60 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-fortress-navy/80 via-transparent to-fortress-navy/30" />
      </div>

      {/* Subtle animated grain texture overlay */}
      <motion.div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}
        animate={{ opacity: [0.02, 0.04, 0.02] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content centred on mobile, left-aligned on md+ */}
      <motion.div
        variants={heroChildrenVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[1280px] mx-auto flex flex-col items-center text-center md:items-start md:text-left"
      >
        <motion.span
          variants={heroItemVariants}
          className="block text-fortress-gold text-[10px] sm:text-xs md:text-sm tracking-[4px] md:tracking-[6px] uppercase font-semibold mb-4 md:mb-6"
        >
          Fortress Investment Holdings
        </motion.span>

        <motion.h1
          variants={heroItemVariants}
          className="text-white text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-light leading-[1.1] uppercase tracking-tight mb-5 md:mb-8 max-w-xs sm:max-w-lg md:max-w-4xl"
        >
          Built on Strength.<br />
          <span className="font-semibold bg-gradient-to-r from-fortress-gold to-fortress-champagne bg-clip-text text-transparent">
            Driven by Vision.
          </span>
        </motion.h1>

        <motion.p
          variants={heroItemVariants}
          className="text-fortress-silver/90 text-sm sm:text-base md:text-lg lg:text-xl max-w-sm sm:max-w-xl md:max-w-3xl leading-relaxed mb-8 md:mb-10 font-light"
        >
          A Dubai-based diversified investment holding company focused on identifying, acquiring, and growing high-potential opportunities across real estate, private equity, technology, digital assets, energy, commodities, and hospitality.
        </motion.p>

        <motion.div variants={heroButtonVariants} className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
          <motion.div
            className="w-full sm:w-auto"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Link
              href="/investment-focus"
              className="block w-full sm:w-auto px-6 sm:px-8 py-3.5 md:py-4 bg-gradient-to-r from-fortress-gold to-fortress-champagne text-fortress-navy font-bold text-xs sm:text-sm tracking-widest uppercase hover:opacity-90 transition-opacity rounded-sm shadow-lg text-center"
            >
              Explore Our Investments
            </Link>
          </motion.div>
          <motion.div
            className="w-full sm:w-auto"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <Link
              href="/invest-with-fortress"
              className="block w-full sm:w-auto px-6 sm:px-8 py-3.5 md:py-4 border border-fortress-silver/40 text-white font-bold text-xs sm:text-sm tracking-widest uppercase hover:bg-white/10 hover:border-white transition-all rounded-sm backdrop-blur-sm text-center"
            >
              Invest With Us
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Animated decorative gold line at bottom */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fortress-gold/40 to-transparent z-10"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 1.2 }}
      />
    </motion.section>
  );
}
