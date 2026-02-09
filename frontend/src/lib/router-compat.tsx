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

/** Simple img wrapper instead of next/image – accepts priority (uses loading="eager") but does not pass it to DOM */
export function Image({
  src,
  alt,
  width,
  height,
  className,
  priority,
  ...rest
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  [key: string]: unknown;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      {...rest}
    />
  );
}
