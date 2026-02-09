const isDev = import.meta.env.DEV;

export const logger = {
  debug: (label: string, ...args: unknown[]) => {
    if (isDev) console.log(`[DEBUG] ${label}`, ...args);
  },
  info: (label: string, ...args: unknown[]) => {
    if (isDev) console.info(`[INFO] ${label}`, ...args);
  },
  warn: (label: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${label}`, ...args);
  },
  error: (label: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${label}`, ...args);
  },
};
