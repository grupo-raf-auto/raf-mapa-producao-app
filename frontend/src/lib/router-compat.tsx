/**
 * Compatibility layer: React Router equivalents for Next.js navigation.
 * Use these so components can keep similar API.
 */

import {
  Link as RouterLink,
  useNavigate,
  useLocation,
  useSearchParams,
  type LinkProps,
} from 'react-router-dom';
import type { ReactNode } from 'react';

export const Link = RouterLink;
export type { LinkProps };

export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    refresh: () => window.location.reload(),
  };
}

export function usePathname() {
  return useLocation().pathname;
}

export { useSearchParams };

/** Simple img wrapper instead of next/image */
export function Image({
  src,
  alt,
  width,
  height,
  className,
  ...rest
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      {...rest}
    />
  );
}
