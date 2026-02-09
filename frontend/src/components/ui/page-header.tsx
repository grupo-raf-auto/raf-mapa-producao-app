import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconGradient?: string;
  iconColor?: string;
  decoratorIcon?: ReactNode;
  decoratorColor?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconGradient = 'from-red-600 via-red-500 to-red-700',
  iconColor = 'text-white',
  decoratorIcon,
  decoratorColor = 'text-red-500',
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 pb-6 border-b border-border/60"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg shadow-red-500/20`}
          >
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {title}
            </h1>
            {decoratorIcon && (
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <div className={decoratorColor}>{decoratorIcon}</div>
              </motion.div>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
