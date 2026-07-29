"use client";

import { motion } from "framer-motion";

interface StaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

const item = {
  hidden: { opacity: 0, y: 35, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
