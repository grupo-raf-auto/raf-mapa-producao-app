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
  borderRadius = 16,
  borderWidth = 2,
  duration = 14,
  color = "#000000",
  className,
  children,
}: ShineBorderProps) {
  // Criar gradiente radial conforme o prompt original
  // O formato precisa criar um "spotlight" que se move ao redor da borda
  const getGradient = () => {
    if (color instanceof Array && color.length > 1) {
      // Para múltiplas cores, criar um radial-gradient que funciona com a animação
      // O formato do prompt: radial-gradient(transparent, transparent, color1, color2, color3, transparent, transparent)
      const colors = color.join(", ");
      return `radial-gradient(transparent, transparent, ${colors}, transparent, transparent)`;
    }
    const singleColor = color instanceof Array ? color[0] : color;
    return `radial-gradient(transparent, transparent, ${singleColor}, transparent, transparent)`;
  };

  const gradientValue = getGradient();

  return (
    <div
      className={cn("relative", className)}
      style={
        {
          borderRadius: `${borderRadius}px`,
          padding: `${borderWidth}px`,
        } as React.CSSProperties
      }
    >
      {/* Borda animada - elemento pseudo antes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={
          {
            borderRadius: `${borderRadius}px`,
            padding: `${borderWidth}px`,
            backgroundImage: gradientValue,
            backgroundSize: "300% 300%",
            backgroundPosition: "0% 0%",
            WebkitMaskImage:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskImage:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            animation: `shine-pulse ${duration}s infinite linear`,
            willChange: "background-position",
            zIndex: 0,
          } as React.CSSProperties
        }
      />
      {/* Conteúdo */}
      <div 
        className="relative h-full w-full"
        style={{ 
          zIndex: 1,
          borderRadius: `${borderRadius - borderWidth}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
