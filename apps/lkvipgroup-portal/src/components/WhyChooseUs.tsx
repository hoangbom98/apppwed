"use client";

import { motion } from "framer-motion";
import Stagger from "@/components/animations/Stagger";
import StaggerItem from "@/components/animations/StaggerItem";

const benefits = [
  { title: "Disciplined Decision-Making", desc: "Every opportunity is examined through detailed commercial, financial, operational, and risk assessment. We say no more often than we say yes - and that is precisely why our partners trust us." },
  { title: "Long-Term Perspective", desc: "We are not chasing quarterly results. We prioritise sustainable growth and lasting value over short-term speculation." },
  { title: "Diversified Expertise", desc: "Our multi-sector approach means we understand how different industries, asset classes, and market cycles behave - and how to position investments accordingly." },
  { title: "Strategic Involvement", desc: "Where it adds value, we contribute far more than capital: strategic guidance, business development, governance, and access to established professional networks." },
  { title: "Trusted Partnerships", desc: "We build relationships on transparency, confidentiality, alignment, and mutual benefit. Our reputation is our most carefully protected asset." },
  { title: "UAE Market Access", desc: "Based in Dubai, we operate at the crossroads of regional and global investment flows, with access to capital, talent, regulators, and high-value opportunities across the UAE, GCC, and international markets." },
];

const sectionReveal = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function WhyChooseUs() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={sectionReveal}
      className="relative py-16 md:py-28 overflow-hidden rounded-2xl mx-4 my-8"
    >
      <div className="absolute inset-0 bg-fortress-deep" />
      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-12">
        <Stagger>
          <StaggerItem>
            <span className="block text-fortress-gold/50 text-xs tracking-[6px] uppercase mb-6 font-medium">
              04 - Why Choose Fortress
            </span>
          </StaggerItem>
          <StaggerItem>
            <h2 className="text-2xl md:text-4xl font-bold text-fortress-ivory mb-8 md:mb-12 leading-tight">
              A Stronger Foundation for Growth
            </h2>
          </StaggerItem>
          <StaggerItem>
            <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
              {benefits.map((item) => (
                <motion.div
                  key={item.title}
                  className="group cursor-default"
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                >
                  <motion.div
                    className="h-px w-8 bg-fortress-gold/30 mb-4"
                    whileHover={{ width: "3rem", backgroundColor: "rgba(201,162,74,0.7)" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                  <h3 className="text-lg font-bold text-fortress-gold mb-3 transition-colors duration-300 group-hover:text-fortress-champagne">
                    {item.title}
                  </h3>
                  <p className="text-fortress-silver/60 text-sm leading-relaxed transition-colors duration-300 group-hover:text-fortress-silver/80">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </StaggerItem>
        </Stagger>
      </div>
      <div className="section-divider mt-16 md:mt-28 max-w-[1280px] mx-auto" />
    </motion.section>
  );
}
