"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

interface StaggerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  delay?: number;
  staggerDelay?: number;
  once?: boolean;
}

export default function Stagger({
  children,
  className,
  delay = 0.1,
  staggerDelay = 0.1,
  once = true,
  ...props
}: StaggerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-10% 0px -10% 0px" }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay, delayChildren: delay },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
