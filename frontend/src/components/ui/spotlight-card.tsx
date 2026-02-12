import React, { useEffect, useRef, ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean;
}

const glowColorMap = {
  blue: 'hsl(220, 100%, 60%)',
  purple: 'hsl(280, 100%, 60%)',
  green: 'hsl(120, 100%, 60%)',
  red: 'hsl(0, 100%, 60%)',
  orange: 'hsl(30, 100%, 60%)'
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  className = '', 
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePosition({ x, y });
      }
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({ x: rect.width / 2, y: rect.height / 2 });
      }
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove, { passive: true });
      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (card) {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const color = glowColorMap[glowColor];

  const getSizeClasses = () => {
    if (customSize) {
      return '';
    }
    return sizeMap[size];
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        getSizeClasses(),
        !customSize && !width && !height ? 'aspect-[3/4]' : '',
        'relative',
        'rounded-2xl',
        className
      )}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        padding: '2px',
        background: isHovered
          ? `radial-gradient(
              500px 500px at ${mousePosition.x}px ${mousePosition.y}px,
              ${color}90,
              ${color}60 30%,
              transparent 60%
            )`
          : `radial-gradient(
              500px 500px at 50% 50%,
              ${color}40,
              transparent 60%
            )`,
        transition: 'background 0.1s ease-out',
      }}
    >
      {/* Borda brilhante - sempre visível */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: isHovered
            ? `radial-gradient(
                300px 300px at ${mousePosition.x}px ${mousePosition.y}px,
                ${color},
                ${color}80 40%,
                transparent 50%
              )`
            : `radial-gradient(
                300px 300px at 50% 50%,
                ${color}60,
                transparent 50%
              )`,
          padding: '2px',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          zIndex: 1,
          transition: 'background 0.1s ease-out',
        }}
      />
      
      {/* Conteúdo interno */}
      <div className="relative z-10 h-full w-full rounded-2xl overflow-hidden bg-card">
        {children}
      </div>
    </div>
  );
};

export { GlowCard };
