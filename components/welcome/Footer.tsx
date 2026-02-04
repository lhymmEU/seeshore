"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="w-full py-4 px-6">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-zinc-400">
        <Link href="/privacy" className="hover:text-zinc-600 transition-colors">
          {t("privacy")}
        </Link>
        <span className="text-zinc-300">•</span>
        <Link href="/terms" className="hover:text-zinc-600 transition-colors">
          {t("terms")}
        </Link>
        <span className="text-zinc-300">•</span>
        <Link href="/about" className="hover:text-zinc-600 transition-colors">
          {t("about")}
        </Link>
      </div>
    </footer>
  );
}







