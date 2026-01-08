"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageAnimationProps {
  children: ReactNode;
  className?: string;
}

export function PageAnimation({ children, className }: PageAnimationProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        delay: 0.1
      }}
    >
      {children}
    </motion.div>
  );
}
