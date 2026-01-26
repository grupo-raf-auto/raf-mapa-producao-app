// Design System Colors
export const colors = {
  background: "#F6F7F9",
  surface: "#FFFFFF",
  primary: "#E14840",
  primarySoft: "#F87171",
  secondary: "#FEE2E2",
  accent: "#16CBC7",
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  border: "#E5E7EB",
  success: "#16A34A",
  danger: "#DC2626",
} as const;

// Design System Spacing
export const spacing = {
  pagePadding: "px-8 md:px-12 lg:px-16 xl:px-20 py-6",
  sectionGap: "space-y-6",
  cardPadding: "p-4",
  gridGap: "gap-4",
} as const;

// Design System Radius
export const radius = {
  card: "rounded-lg",
  button: "rounded-lg",
  input: "rounded-md",
} as const;
