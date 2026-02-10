import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer touch-manipulation disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_8px_rgba(220,38,38,0.2)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
        outline:
          "border border-input bg-background hover:bg-muted/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/95",
        ghost: "hover:bg-muted/80",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-success text-success-foreground hover:bg-success/90 active:bg-success/95 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
      },
      size: {
        default: "min-h-[44px] h-11 px-4 py-2 sm:min-h-0 sm:h-10",
        sm: "min-h-[44px] h-10 rounded-lg gap-1.5 px-3 text-xs sm:min-h-0 sm:h-9",
        lg: "min-h-[44px] h-12 rounded-xl px-6 sm:min-h-0 sm:h-11",
        icon: "min-w-[44px] min-h-[44px] size-11 sm:min-w-0 sm:min-h-0 sm:size-10",
        "icon-sm": "min-w-[44px] min-h-[44px] size-10 sm:min-w-0 sm:min-h-0 sm:size-9",
        "icon-lg": "min-w-[44px] min-h-[44px] size-12 sm:min-w-0 sm:min-h-0 sm:size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
