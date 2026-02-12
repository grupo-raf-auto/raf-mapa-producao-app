import React, { CSSProperties, ReactNode, HTMLAttributes, useState } from 'react';

interface BorderRotateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  children: ReactNode;
  className?: string;
  animationSpeed?: number;
  gradientColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
  backgroundColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  style?: CSSProperties;
}

const BorderRotate: React.FC<BorderRotateProps> = ({
  children,
  className = '',
  animationSpeed = 3,
  gradientColors = { primary: '#584827', secondary: '#c7a03c', accent: '#f9de90' },
  backgroundColor = '#2d230f',
  borderWidth = 2,
  borderRadius = 16,
  style = {},
  ...props
}) => {
  const [hovered, setHovered] = useState(false);

  const baseStyle: CSSProperties = {
    borderRadius: `${borderRadius}px`,
    transition: 'border-color 0.3s ease',
    ...style,
  };

  if (hovered) {
    // Gradient border animado
    Object.assign(baseStyle, {
      '--animation-duration': `${animationSpeed}s`,
      border: `${borderWidth}px solid transparent`,
      backgroundImage: `
        linear-gradient(${backgroundColor}, ${backgroundColor}),
        conic-gradient(
          from var(--gradient-angle, 0deg),
          ${gradientColors.primary} 0%,
          ${gradientColors.secondary} 37%,
          ${gradientColors.accent} 30%,
          ${gradientColors.secondary} 33%,
          ${gradientColors.primary} 40%,
          ${gradientColors.primary} 50%,
          ${gradientColors.secondary} 77%,
          ${gradientColors.accent} 80%,
          ${gradientColors.secondary} 83%,
          ${gradientColors.primary} 90%
        )
      `,
      backgroundClip: 'padding-box, border-box',
      backgroundOrigin: 'padding-box, border-box',
    } as CSSProperties);
  } else {
    // Borda estática normal
    Object.assign(baseStyle, {
      border: `${borderWidth}px solid var(--border)`,
      backgroundImage: 'none',
    });
  }

  return (
    <div
      className={`gradient-border-component ${hovered ? 'gradient-border-auto' : ''} ${className}`}
      style={baseStyle as CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {children}
    </div>
  );
};

export { BorderRotate };
