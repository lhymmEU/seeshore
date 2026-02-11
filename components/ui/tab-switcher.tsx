"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon?: LucideIcon;
  iconActiveClassName?: string;
  count?: number;
  disabled?: boolean;
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
  const t = useTranslations("common");
  return (
    <div className={cn("flex bg-muted rounded-full p-1", className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onChange(tab.id)}
            disabled={isDisabled}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all",
              isDisabled
                ? "text-muted-foreground/70 cursor-not-allowed"
                : isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && (
              <Icon
                size={14}
                className={cn(
                  isDisabled 
                    ? "text-muted-foreground/70" 
                    : isActive 
                      ? tab.iconActiveClassName 
                      : undefined
                )}
              />
            )}
            {tab.label}
            {typeof tab.count === "number" && tab.count > 0 && !isDisabled && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded-full text-xs",
                  isActive ? "bg-background/20" : "bg-muted"
                )}
              >
                {tab.count}
              </span>
            )}
            {isDisabled && (
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wide">
                {t("soon")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
