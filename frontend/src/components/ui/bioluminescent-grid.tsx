"use client";

import React, { forwardRef } from "react";

// --- Reusable Grid Item Component ---
interface BioluminescentGridItemProps {
  className?: string;
  children: React.ReactNode;
}

const BioluminescentGridItem = forwardRef<
  HTMLDivElement,
  BioluminescentGridItemProps
>(({ className, children }, ref) => {
  return (
    <div ref={ref} className={`bio-item ${className || ""}`.trim()}>
      <div className="bio-item-content">{children}</div>
    </div>
  );
});
BioluminescentGridItem.displayName = "BioluminescentGridItem";

// --- Main Grid Container Component ---
interface BioluminescentGridProps {
  className?: string;
  children: React.ReactNode;
}

export const BioluminescentGrid = forwardRef<
  HTMLDivElement,
  BioluminescentGridProps
>(({ className, children }, ref) => {
  return (
    <div ref={ref} className={`bio-grid ${className || ""}`.trim()}>
      {children}
    </div>
  );
});
BioluminescentGrid.displayName = "BioluminescentGrid";

// Exporting the item as a named export for clarity
export { BioluminescentGridItem };
