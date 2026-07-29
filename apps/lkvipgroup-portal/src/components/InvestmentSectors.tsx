"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Stagger from "@/components/animations/Stagger";
import StaggerItem from "@/components/animations/StaggerItem";

const sectors = [
  { title: "Real Estate", desc: "Residential, commercial, hospitality, and income-generating property investment across Dubai and the wider UAE.", image: "/1.png", className: "md:col-span-2 h-[280px] md:h-[380px]" },
  { title: "Business Acquisitions", desc: "Established businesses with proven operations, stable demand, and clear opportunities for expansion.", image: "/3.png", className: "md:col-span-1 h-[280px] md:h-[380px]" },
  { title: "Private Equity", desc: "Strategic investments in privately held companies with strong leadership and scalable business models.", image: "/4.png", className: "md:col-span-1 h-[280px] md:h-[380px]" },
  { title: "AI & Emerging Technology", desc: "Technology-enabled businesses, digital platforms, and innovative solutions solving genuine market problems.", image: "/6.png", className: "md:col-span-2 h-[280px] md:h-[380px]" },
  { title: "Hospitality", desc: "Hotels, serviced accommodation, tourism, food and beverage, and lifestyle-led businesses in one of the world's leading visitor economies.", image: "/5.png", className: "md:col-span-2 h-[280px] md:h-[380px]" },
  { title: "Digital Assets & Blockchain", desc: "Selective participation in blockchain infrastructure, digital asset platforms, tokenisation, and fintech innovation.", image: "/2.png", className: "md:col-span-1 h-[280px] md:h-[380px]" },
  { title: "Energy & Physical Commodities", desc: "Investments in energy products, physical commodities, and supply and distribution networks driving regional and global trade.", image: "/7.png", className: "md:col-span-1 h-[280px] md:h-[380px]" },
  { title: "Luxury Assets", desc: "Premium real estate, high-value vehicles, yachts, aviation, collectibles, and luxury lifestyle businesses.", image: "/8.png", className: "md:col-span-2 h-[280px] md:h-[380px]" },
  { title: "Strategic Investment Management", desc: "Joint ventures, co-investments, and strategic alliances with aligned partners and institutions.", image: "/9.png", className: "md:col-span-3 h-[280px] md:h-[380px]" },
];

const cardHoverVariants = {
  rest: { y: 0, borderColor: "rgba(201,162,74,0.05)" },
  hover: { y: -6, borderColor: "rgba(201,162,74,0.35)", boxShadow: "0 30px 60px rgba(0,0,0,0.4)", transition: { type: "spring", stiffness: 300, damping: 22 } },
} as const;

const sectionReveal = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function InvestmentSectors() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={sectionReveal}
      className="relative py-16 md:py-28 overflow-hidden bg-fortress-navy rounded-2xl mx-4 my-8"
    >
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <Stagger>
          <StaggerItem>
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6">
              <div>
                <span className="block text-fortress-gold text-xs tracking-[6px] uppercase mb-4 font-semibold">
                  03 - Investment Sectors
                </span>
                <h2 className="text-2xl md:text-5xl font-light text-fortress-ivory leading-tight uppercase tracking-tight">
                  A Diversified Investment Vision
                </h2>
              </div>
              <p className="text-fortress-silver/80 text-base md:text-lg leading-relaxed max-w-[500px]">
                Fortress Investment Holdings focuses on sectors where our capital, experience, and strategic involvement can create measurable value.
              </p>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {sectors.map((sector, index) => (
                <motion.div
                  key={sector.title}
                  variants={cardHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  className={`group relative overflow-hidden bg-fortress-deep border border-fortress-gold/5 flex flex-col justify-end p-6 md:p-10 rounded-sm cursor-default ${sector.className}`}
                >
                  <motion.div
                    className="absolute inset-0 z-0 overflow-hidden"
                    whileHover={{ scale: 1.06 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <Image
                      src={sector.image}
                      alt={sector.title}
                      fill
                      className="object-cover"
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </motion.div>
                  <div className="absolute inset-0 z-10 bg-gradient-to-t from-fortress-navy via-fortress-navy/80 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-90" />
                  
                  <motion.div
                    className="relative z-20"
                    whileHover={{ y: -4 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  >
                    <span className="text-fortress-gold text-[10px] tracking-[4px] uppercase font-semibold block mb-2">
                      Sector {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-xl md:text-2xl font-semibold text-fortress-ivory mb-3">
                      {sector.title}
                    </h3>
                    <p className="text-fortress-silver/70 text-sm leading-relaxed max-w-md transition-colors duration-300 group-hover:text-fortress-silver">
                      {sector.desc}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-12 flex justify-center">
              <motion.div
                className="w-full sm:w-auto"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
              >
                <Link
                  href="/investment-focus"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 border border-fortress-gold text-fortress-gold hover:bg-fortress-gold hover:text-fortress-navy text-xs sm:text-sm tracking-widest font-semibold transition-colors duration-300 rounded-sm"
                >
                  VIEW ALL INVESTMENT SECTORS
                </Link>
              </motion.div>
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </motion.section>
  );
}
