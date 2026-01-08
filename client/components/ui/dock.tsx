'use client';

import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
  AnimatePresence,
} from 'framer-motion';
import {
  Children,
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';

const DOCK_HEIGHT = 128;
const DEFAULT_MAGNIFICATION = 80;
const DEFAULT_DISTANCE = 150;
const DEFAULT_PANEL_HEIGHT = 64;

type DockProps = {
  children: React.ReactNode;
  className?: string;
  distance?: number;
  panelHeight?: number;
  magnification?: number;
  spring?: SpringOptions;
  orientation?: 'horizontal' | 'vertical';
};
type DockItemProps = {
  className?: string;
  children: React.ReactNode;
};
type DockLabelProps = {
  className?: string;
  children: React.ReactNode;
};
type DockIconProps = {
  className?: string;
  children: React.ReactNode;
};

type DocContextType = {
  mouseX: MotionValue;
  mouseY: MotionValue;
  spring: SpringOptions;
  magnification: number;
  distance: number;
  orientation: 'horizontal' | 'vertical';
};
type DockProviderProps = {
  children: React.ReactNode;
  value: DocContextType;
};

const DockContext = createContext<DocContextType | undefined>(undefined);

function DockProvider({ children, value }: DockProviderProps) {
  return <DockContext.Provider value={value}>{children}</DockContext.Provider>;
}

function useDock() {
  const context = useContext(DockContext);
  if (!context) {
    throw new Error('useDock must be used within an DockProvider');
  }
  return context;
}

function Dock({
  children,
  className,
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  panelHeight = DEFAULT_PANEL_HEIGHT,
  orientation = 'horizontal',
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const mouseY = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(() => {
    return Math.max(DOCK_HEIGHT, magnification + magnification / 2 + 4);
  }, [magnification]);

  const maxWidth = useMemo(() => {
    return Math.max(DOCK_HEIGHT, magnification + magnification / 2 + 4);
  }, [magnification]);

  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  const widthRow = useTransform(isHovered, [0, 1], [panelHeight, maxWidth]);
  const width = useSpring(widthRow, spring);

  const isVertical = orientation === 'vertical';

  return (
    <motion.div
      style={{
        [isVertical ? 'width' : 'height']: isVertical ? width : height,
        scrollbarWidth: 'none',
      }}
      className={cn(
        isVertical
          ? 'my-2 flex max-h-full flex-col items-center overflow-visible'
          : 'mx-2 flex max-w-full items-end overflow-x-auto'
      )}
    >
      <motion.div
        onMouseMove={({ pageX, pageY }) => {
          isHovered.set(1);
          mouseX.set(pageX);
          mouseY.set(pageY);
        }}
        onMouseLeave={() => {
          isHovered.set(0);
          mouseX.set(Infinity);
          mouseY.set(Infinity);
        }}
        className={cn(
          isVertical
            ? 'my-auto flex h-fit flex-col gap-6 py-4'
            : 'mx-auto flex w-fit gap-6 px-4',
          className
        )}
        style={isVertical ? { width: panelHeight } : { height: panelHeight }}
        role='toolbar'
        aria-label='Application dock'
      >
        <DockProvider value={{ mouseX, mouseY, spring, distance, magnification, orientation }}>
          {children}
        </DockProvider>
      </motion.div>
    </motion.div>
  );
}

function DockItem({ children, className }: DockItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const { distance, magnification, mouseX, mouseY, spring, orientation } = useDock();

  const isHovered = useMotionValue(0);
  const isVertical = orientation === 'vertical';

  const mouseDistance = useTransform(
    isVertical ? mouseY : mouseX,
    (val) => {
      const domRect = ref.current?.getBoundingClientRect() ?? {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
      if (isVertical) {
        return val - domRect.y - domRect.height / 2;
      }
      return val - domRect.x - domRect.width / 2;
    }
  );

  const sizeTransform = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [56, magnification, 56]
  );

  const size = useSpring(sizeTransform, spring);

  return (
    <motion.div
      ref={ref}
      style={{
        [isVertical ? 'height' : 'width']: size,
        [isVertical ? 'width' : 'height']: isVertical ? size : 'auto'
      }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      className={cn(
        'relative inline-flex items-center justify-center',
        className
      )}
      tabIndex={0}
      role='button'
      aria-haspopup='true'
    >
      {Children.map(children, (child) =>
        cloneElement(child as React.ReactElement, { width: size, height: size, isHovered })
      )}
    </motion.div>
  );
}

function DockLabel({ children, className, ...rest }: DockLabelProps) {
  const restProps = rest as Record<string, unknown>;
  const isHovered = restProps['isHovered'] as MotionValue<number>;
  const [isVisible, setIsVisible] = useState(false);

  let isVertical = false;
  try {
    const { orientation } = useDock();
    isVertical = orientation === 'vertical';
  } catch {
    // Se não estiver no contexto, assume horizontal
    isVertical = false;
  }

  useEffect(() => {
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1);
    });

    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, [isVertical ? 'x' : 'y']: 0 }}
          animate={{ opacity: 1, [isVertical ? 'x' : 'y']: isVertical ? -10 : -10 }}
          exit={{ opacity: 0, [isVertical ? 'x' : 'y']: 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'absolute w-fit whitespace-pre rounded-md border border-border bg-popover px-2 py-0.5 text-xs text-popover-foreground shadow-md z-[100]',
            isVertical
              ? '-left-20 top-1/2'
              : '-top-6 left-1/2',
            className
          )}
          role='tooltip'
          style={isVertical ? { y: '-50%' } : { x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DockIcon({ children, className, ...rest }: DockIconProps) {
  const restProps = rest as Record<string, unknown>;
  const width = restProps['width'] as MotionValue<number>;
  const height = restProps['height'] as MotionValue<number> | undefined;

  let isVertical = false;
  try {
    const { orientation } = useDock();
    isVertical = orientation === 'vertical';
  } catch {
    // Se não estiver no contexto, assume horizontal
    isVertical = false;
  }

  const size = isVertical ? (height || width) : width;
  const sizeTransform = useTransform(size, (val) => val / 2);

  return (
    <motion.div
      style={{
        width: sizeTransform,
        height: sizeTransform
      }}
      className={cn('flex items-center justify-center', className)}
    >
      {children}
    </motion.div>
  );
}

export { Dock, DockIcon, DockItem, DockLabel };
