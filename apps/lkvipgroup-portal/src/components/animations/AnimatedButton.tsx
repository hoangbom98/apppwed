"use client";

import { motion } from "framer-motion";
import { buttonVariants } from "@/lib/animation";
import { Loader2 } from "lucide-react";

interface AnimatedButtonProps {
  children: React.ReactNode;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export default function AnimatedButton({
  children,
  className = "",
  loading = false,
  disabled = false,
  onClick,
  type = "button",
}: AnimatedButtonProps) {
  return (
    <motion.button
      variants={buttonVariants}
      initial="rest"
      whileHover={disabled || loading ? undefined : "hover"}
      whileTap={disabled || loading ? undefined : "tap"}
      onClick={onClick}
      type={type}
      disabled={disabled || loading}
      className={`relative ${className}`}
    >
      {loading && (
        <Loader2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
      )}
      <span className={loading ? "invisible" : ""}>{children}</span>
    </motion.button>
  );
}
