"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { setLocale } from "@/i18n/actions";
import type { Locale } from "@/i18n/config";

interface LanguageSwitcherProps {
  variant?: "icon" | "text" | "full";
  className?: string;
}

export function LanguageSwitcher({ variant = "icon", className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("language");
  const [isPending, startTransition] = useTransition();

  const toggleLocale = () => {
    const nextLocale: Locale = locale === "en" ? "zh" : "en";
    startTransition(() => {
      setLocale(nextLocale);
    });
  };

  const nextLanguage = locale === "en" ? t("chinese") : t("english");

  if (variant === "icon") {
    return (
      <button
        onClick={toggleLocale}
        disabled={isPending}
        className={cn(
          "p-2 rounded-full hover:bg-zinc-100 transition-colors disabled:opacity-50",
          className
        )}
        aria-label={t("switchTo", { language: nextLanguage })}
      >
        <Globe size={20} className="text-zinc-600" />
      </button>
    );
  }

  if (variant === "text") {
    return (
      <button
        onClick={toggleLocale}
        disabled={isPending}
        className={cn(
          "text-sm text-zinc-500 hover:text-zinc-700 transition-colors disabled:opacity-50",
          className
        )}
      >
        {nextLanguage}
      </button>
    );
  }

  // Full variant with icon and text
  return (
    <button
      onClick={toggleLocale}
      disabled={isPending}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50",
        className
      )}
    >
      <Globe size={18} className="text-zinc-600" />
      <span className="text-sm text-zinc-600">
        {locale === "en" ? "中文" : "English"}
      </span>
    </button>
  );
}
