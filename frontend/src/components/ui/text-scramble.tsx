"use client";
import { type JSX, useEffect, useState, useRef } from "react";
import { motion, MotionProps } from "framer-motion";

type TextScrambleProps = {
  children: string;
  duration?: number;
  speed?: number;
  characterSet?: string;
  as?: React.ElementType;
  className?: string;
  trigger?: boolean;
  onScrambleComplete?: () => void;
} & MotionProps;

const defaultChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function TextScramble({
  children,
  duration = 0.8,
  speed = 0.04,
  characterSet = defaultChars,
  className,
  as: Component = "p",
  trigger = true,
  onScrambleComplete,
  ...props
}: TextScrambleProps) {
  const MotionComponent = motion.create(
    Component as keyof JSX.IntrinsicElements,
  );
  const [displayText, setDisplayText] = useState(children);
  const isAnimatingRef = useRef(false);
  const text = children;

  // Reset display text when children change (if not animating)
  useEffect(() => {
    if (!isAnimatingRef.current) {
      setDisplayText(children);
    }
  }, [children]);

  useEffect(() => {
    if (!trigger) {
      setDisplayText(text);
      isAnimatingRef.current = false;
      return;
    }

    // Prevent multiple animations
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    // Mostra o texto imediatamente para evitar lag visual
    setDisplayText(text);

    const steps = Math.ceil(duration / speed);
    let step = 0;
    let interval: NodeJS.Timeout | null = null;
    let cancelled = false;

    // Pequeno delay antes de começar o scramble para o texto aparecer primeiro
    const scrambleStartDelay = setTimeout(() => {
      if (cancelled) return;
      setDisplayText(""); // Reset para começar o scramble

      interval = setInterval(() => {
        if (cancelled) {
          if (interval) clearInterval(interval);
          return;
        }

        let scrambled = "";
        const progress = step / steps;

        for (let i = 0; i < text.length; i++) {
          if (text[i] === " " || text[i] === "\n") {
            scrambled += text[i];
            continue;
          }

          if (progress * text.length > i) {
            scrambled += text[i];
          } else {
            scrambled +=
              characterSet[Math.floor(Math.random() * characterSet.length)];
          }
        }

        setDisplayText(scrambled);
        step++;

        if (step > steps) {
          if (interval) clearInterval(interval);
          setDisplayText(text);
          isAnimatingRef.current = false;
          onScrambleComplete?.();
        }
      }, speed * 1000);
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(scrambleStartDelay);
      if (interval) clearInterval(interval);
      isAnimatingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, text]);

  return (
    <MotionComponent
      className={className}
      style={{ whiteSpace: "pre-line" }}
      {...props}
    >
      {displayText}
    </MotionComponent>
  );
}
