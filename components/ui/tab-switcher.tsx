"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  iconActiveClassName?: string;
  count?: number;
}

interface TabSwitcherProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function TabSwitcher({
  tabs,
  activeTab,
  onChange,
  className,
}: TabSwitcherProps) {
  return (
    <div className={cn("flex bg-zinc-100 rounded-full p-1", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all",
              isActive
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-800"
            )}
          >
            {Icon && (
              <Icon
                size={14}
                className={isActive ? tab.iconActiveClassName : undefined}
              />
            )}
            {tab.label}
            {typeof tab.count === "number" && tab.count > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs",
                  isActive ? "bg-white/20" : "bg-zinc-200"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
