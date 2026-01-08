"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type TColorProp = string | string[];

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: ReactNode;
}

/**
 * @name Shine Border
 * @description It is an animated background border effect component with easy to use and configurable props.
 * @param borderRadius defines the radius of the border.
 * @param borderWidth defines the width of the border.
 * @param duration defines the animation duration to be applied on the shining border
 * @param color a string or string array to define border color.
 * @param className defines the class name to be applied to the component
 * @param children contains react node elements.
 */
export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = "#000000",
  className,
  children,
}: ShineBorderProps) {
  const colorValue = color instanceof Array ? color.join(",") : color;

  return (
    <div
      style={
        {
          "--border-radius": `${borderRadius}px`,
          "--border-width": `${borderWidth}px`,
          "--shine-pulse-duration": `${duration}s`,
          "--background-radial-gradient": `radial-gradient(transparent,transparent, ${colorValue},transparent,transparent)`,
        } as React.CSSProperties
      }
      className={cn(
        "relative h-full w-full rounded-xl overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          padding: `${borderWidth}px`,
          maskImage: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskImage: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          backgroundImage: `radial-gradient(transparent,transparent, ${colorValue},transparent,transparent)`,
          backgroundSize: "300% 300%",
          animation: `shine-pulse ${duration}s infinite linear`,
        }}
      />
      <div className="relative h-full w-full">
        {children}
      </div>
    </div>
  );
}
