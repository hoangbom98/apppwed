"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Stagger from "@/components/animations/Stagger";
import StaggerItem from "@/components/animations/StaggerItem";

const goldenDivider = {
  hidden: { scaleX: 0, transformOrigin: "left" as const },
  visible: { scaleX: 1, transformOrigin: "left" as const, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const, delay: 0.3 } },
};

const imageVariant = {
  hidden: { opacity: 0, x: 60, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const, delay: 0.4 } },
};

export default function Introduction() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative py-16 md:py-28 overflow-hidden bg-fortress-navy border-t border-fortress-gold/10 rounded-2xl mx-4 my-8"
    >
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <Stagger>
            <StaggerItem>
              <span className="block text-fortress-gold text-xs tracking-[6px] uppercase font-semibold">
                01 - Introduction
              </span>
            </StaggerItem>
            <StaggerItem>
              <h2 className="text-2xl md:text-5xl font-light text-fortress-ivory leading-tight uppercase tracking-tight mt-4">
                Strength Behind Every Investment
              </h2>
            </StaggerItem>
            <StaggerItem>
              <motion.div variants={goldenDivider} initial="hidden" whileInView="visible" viewport={{ once: true }} className="h-0.5 w-12 bg-fortress-gold/30 my-6" />
            </StaggerItem>
            <StaggerItem>
              <p className="text-fortress-silver/90 text-base md:text-lg leading-relaxed mb-4">
                Great businesses are rarely built by capital alone. They are built by people who combine resources with judgement, patience, and genuine commitment.
              </p>
            </StaggerItem>
            <StaggerItem>
              <p className="text-fortress-silver/90 text-base md:text-lg leading-relaxed mb-4">
                That is the thinking behind Fortress Investment Holdings.
              </p>
            </StaggerItem>
            <StaggerItem>
              <p className="text-fortress-silver/80 text-base leading-relaxed">
                We were established to create a trusted platform for investment, acquisition, and long-term business growth in the UAE and selected international markets. Every investment we make receives our capital, our strategic attention, and our networks.
              </p>
            </StaggerItem>
          </Stagger>

          <motion.div
            variants={imageVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div
              className="relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-fortress-gold/10"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
            >
              <Image
                src="/website image.png"
                alt="Fortress Investment Holdings leadership"
                fill
                className="object-cover"
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-fortress-navy/20" />
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-fortress-gold/60" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-fortress-gold/60" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
