"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Stagger from "@/components/animations/Stagger";
import StaggerItem from "@/components/animations/StaggerItem";

const sectionReveal = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setEmail("");
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={sectionReveal}
      className="relative py-16 md:py-24 overflow-hidden rounded-2xl mx-4 my-8"
    >
      <div className="absolute inset-0 bg-fortress-deep" />
      <div className="section-divider max-w-[1280px] mx-auto" />

      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 pt-16 md:pt-24">
        <div className="max-w-[600px] mx-auto text-center">
          <Stagger>
            <StaggerItem>
              <h2 className="text-2xl md:text-3xl font-bold text-fortress-ivory mb-4">
                Receive Fortress Insights
              </h2>
            </StaggerItem>
            <StaggerItem>
              <p className="text-fortress-silver/60 leading-relaxed mb-8">
                Selected market developments, investment perspectives, and company updates  delivered occasionally, and only when worth your time.
              </p>
            </StaggerItem>
            <StaggerItem>
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="py-6 px-8 border border-fortress-gold/30 bg-fortress-gold/5 rounded-sm"
                >
                  <p className="text-fortress-gold font-semibold text-sm tracking-widest uppercase">Thank you for subscribing.</p>
                  <p className="text-fortress-silver/60 text-xs mt-2">You will hear from us when it matters.</p>
                </motion.div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row"
                >
                  <motion.input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    className="w-full sm:flex-1 px-5 py-3.5 bg-fortress-navy border border-fortress-gold/20 text-fortress-ivory text-sm placeholder:text-fortress-silver/40 focus:outline-none focus:border-fortress-gold/50 transition-colors"
                    whileFocus={{ borderColor: "rgba(201,162,74,0.5)", backgroundColor: "rgba(201,162,74,0.03)" }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3.5 bg-fortress-gold text-fortress-navy font-bold text-sm tracking-widest"
                    whileHover={{ backgroundColor: "#E6C879", scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    SUBSCRIBE
                  </motion.button>
                </form>
              )}
            </StaggerItem>
            <StaggerItem>
              <p className="text-fortress-silver/30 text-xs mt-4">
                By subscribing, you agree to receive communications from Fortress Investment Holdings. You may unsubscribe at any time.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </div>
    </motion.section>
  );
}
