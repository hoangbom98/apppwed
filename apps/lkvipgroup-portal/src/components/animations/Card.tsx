"use client";

import { motion } from "framer-motion";
import { cardVariants, viewportOptions } from "@/lib/animation";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

export default function AnimatedCard({ children, className, delay = 0, hover = true }: AnimatedCardProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOptions}
      variants={cardVariants}
      transition={{ delay }}
      whileHover={hover ? "hover" : undefined}
      className={className}
    >
      {children}
    </motion.div>
  );
}
