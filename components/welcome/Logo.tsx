"use client";

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
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeMap[size]} rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200`}
      >
        <BookOpen
          size={iconSizeMap[size]}
          className="text-zinc-800"
          strokeWidth={1.5}
        />
      </div>
      {showText && (
        <span className="text-sm font-medium text-zinc-500 tracking-wide uppercase">
          Seashore Books
        </span>
      )}
    </div>
  );
}



