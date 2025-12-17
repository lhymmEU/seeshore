"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-4 px-6">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-zinc-400">
        <Link href="/privacy" className="hover:text-zinc-600 transition-colors">
          Privacy Policy
        </Link>
        <span className="text-zinc-300">•</span>
        <Link href="/terms" className="hover:text-zinc-600 transition-colors">
          Terms of Service
        </Link>
        <span className="text-zinc-300">•</span>
        <Link href="/about" className="hover:text-zinc-600 transition-colors">
          About Us
        </Link>
      </div>
    </footer>
  );
}




