"use client";

import { motion } from "framer-motion";
import Stagger from "@/components/animations/Stagger";
import StaggerItem from "@/components/animations/StaggerItem";

const cardVariants = {
  rest: { y: 0, borderColor: "rgba(201,162,74,0.10)", boxShadow: "0 0px 0px rgba(201,162,74,0)" },
  hover: { y: -6, borderColor: "rgba(201,162,74,0.35)", boxShadow: "0 20px 40px rgba(201,162,74,0.08)", transition: { type: "spring" as const, stiffness: 350, damping: 22 } },
};

const cards = [
  { title: "Diversified Investment Allocation", desc: "Allocating capital across selected sectors and opportunities to create a balanced investment portfolio." },
  { title: "Income-Generating Opportunities", desc: "Identifying investments with the potential to generate recurring income and structured distributions." },
  { title: "Capital Growth Investments", desc: "Investing in businesses, projects, and assets with strong commercial fundamentals and long-term appreciation potential." },
  { title: "Private Market Opportunities", desc: "Providing access to carefully evaluated opportunities beyond traditional public markets." },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function WhatWeDo() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={sectionReveal}
      className="relative py-16 md:py-28 overflow-hidden bg-fortress-navy border-t border-fortress-gold/10 sm:mx-4 sm:rounded-2xl"
    >
      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
        <Stagger>
          <StaggerItem>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16 mb-12 md:mb-20">
              <div>
                <span className="block text-fortress-gold text-xs tracking-[6px] uppercase mb-4 font-semibold">
                  02  What We Do
                </span>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-fortress-ivory leading-tight uppercase tracking-tight">
                  Strategic Investment Management
                </h2>
                <p className="text-fortress-gold text-sm sm:text-base md:text-lg font-medium mt-3">
                  Disciplined Capital Allocation. Sustainable Value Creation.
                </p>
              </div>
              <div className="space-y-4 lg:self-end">
                <p className="text-fortress-silver/80 text-sm sm:text-base md:text-lg leading-relaxed">
                  We identify and manage carefully selected investment opportunities across multiple sectors, with a disciplined focus on risk management, income potential, and long-term capital growth.
                </p>
                <p className="text-fortress-silver/80 text-sm sm:text-base md:text-lg leading-relaxed">
                  Our approach is designed for investors seeking professionally managed participation in businesses, projects, and assets across the UAE, GCC, and selected global markets.
                </p>
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {cards.map((item, i) => (
                <motion.div
                  key={i}
                  variants={cardVariants}
                  initial="rest"
                  whileHover="hover"
                  className="group p-6 sm:p-8 md:p-10 border bg-fortress-deep cursor-pointer rounded-sm flex flex-col"
                >
                  <div className="flex-1 flex flex-col">
                    <span className="text-fortress-gold/45 text-[10px] tracking-[4px] uppercase font-semibold block mb-2">
                      Strategic Focus {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg sm:text-xl font-semibold text-fortress-ivory mb-3">
                      {item.title}
                    </h3>
                    <p className="text-fortress-silver/70 text-sm sm:text-base leading-relaxed flex-1">
                      {item.desc}
                    </p>
                    <motion.div
                      className="h-px bg-gradient-to-r from-fortress-gold/60 to-transparent mt-6"
                      initial={{ scaleX: 0, transformOrigin: "left" }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </StaggerItem>
        </Stagger>
      </div>
    </motion.section>
  );
}
