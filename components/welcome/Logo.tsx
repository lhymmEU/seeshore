"use client";

import { useTranslations } from "next-intl";
import { BookOpen } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeMap = {
  sm: "w-12 h-12",
  md: "w-16 h-16",
  lg: "w-20 h-20",
};

const iconSizeMap = {
  sm: 24,
  md: 32,
  lg: 40,
};

export function Logo({ size = "md", showText = false }: LogoProps) {
  const t = useTranslations("welcome");
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeMap[size]} rounded-full bg-muted flex items-center justify-center border border-border`}
      >
        <BookOpen
          size={iconSizeMap[size]}
          className="text-foreground"
          strokeWidth={1.5}
        />
      </div>
      {showText && (
        <span className="font-display text-sm font-medium text-muted-foreground tracking-wide uppercase">
          {t("storeName")}
        </span>
      )}
    </div>
  );
}







