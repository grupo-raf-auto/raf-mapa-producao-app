'use client';

import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

export interface AnimatedTabsProps {
  tabs: { label: string; value?: string }[];
  value?: string;
  onValueChange?: (value: string) => void;
}

export function AnimatedTabs({
  tabs,
  value,
  onValueChange,
}: AnimatedTabsProps) {
  const getTabValue = (tab: { label: string; value?: string }) =>
    tab.value ?? tab.label;
  const tabValues = tabs.map(getTabValue);
  const defaultTab = tabValues[0];

  const [internalActive, setInternalActive] = useState(defaultTab);
  const activeTab = value ?? internalActive;

  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  const setActiveTab = (v: string) => {
    if (onValueChange) {
      onValueChange(v);
    } else {
      setInternalActive(v);
    }
  };

  useEffect(() => {
    const container = containerRef.current;

    if (container && activeTab) {
      const activeTabElement = activeTabRef.current;

      if (activeTabElement) {
        const { offsetLeft, offsetWidth } = activeTabElement;

        const clipLeft = offsetLeft + 16;
        const clipRight = offsetLeft + offsetWidth + 16;

        container.style.clipPath = `inset(0 ${Number(
          100 - (clipRight / container.offsetWidth) * 100,
        ).toFixed()}% 0 ${Number(
          (clipLeft / container.offsetWidth) * 100,
        ).toFixed()}% round 17px)`;
      }
    }
  }, [activeTab]);

  return (
    <div className="relative bg-muted/50 border border-border/40 mx-auto flex w-fit flex-col items-center rounded-full py-2 px-4">
      <div
        ref={containerRef}
        className="absolute z-10 w-full overflow-hidden [clip-path:inset(0px_75%_0px_0%_round_17px)] [transition:clip-path_0.25s_ease]"
      >
        <div className="relative flex w-full justify-center bg-neutral-600 dark:bg-neutral-500">
          {tabs.map((tab, index) => {
            const tabValue = getTabValue(tab);
            return (
              <button
                key={index}
                onClick={() => setActiveTab(tabValue)}
                className="flex h-8 items-center rounded-full p-3 text-sm font-medium text-white"
                tabIndex={-1}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex w-full justify-center">
        {tabs.map((tab, index) => {
          const tabValue = getTabValue(tab);
          const isActive = activeTab === tabValue;

          return (
            <button
              key={index}
              ref={isActive ? activeTabRef : null}
              onClick={() => setActiveTab(tabValue)}
              className="flex h-8 items-center cursor-pointer rounded-full p-3 text-sm font-medium text-muted-foreground"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
