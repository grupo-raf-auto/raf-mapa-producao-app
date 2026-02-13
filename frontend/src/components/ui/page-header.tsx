import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  customIcon?: ReactNode;
  iconGradient?: string;
  iconColor?: string;
  decoratorIcon?: ReactNode;
  decoratorColor?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  customIcon,
  iconGradient = 'from-red-600 via-red-500 to-red-700',
  iconColor = 'text-white',
  decoratorIcon,
  decoratorColor = 'text-red-500',
}: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-4 pb-4 sm:mb-5 sm:pb-5 md:mb-6 md:pb-6 border-b border-border/70"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="shrink-0">
          <div
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-1 ring-black/5`}
            aria-hidden
          >
            {customIcon || (Icon && <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />)}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              {title}
            </h1>
            {decoratorIcon && (
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                aria-hidden
              >
                <div className={decoratorColor}>{decoratorIcon}</div>
              </motion.div>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
      </div>
    </motion.header>
  );
}
