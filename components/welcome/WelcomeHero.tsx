"use client";

import { Book, Bookmark, Library, Sparkles } from "lucide-react";

export function WelcomeHero() {
  return (
    <div className="relative w-full aspect-square max-w-[320px] bg-zinc-50 rounded-2xl border border-zinc-200 overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating book illustrations */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Center stack of books */}
        <div className="relative">
          {/* Main book stack illustration */}
          <div className="flex flex-col items-center gap-1">
            {/* Top book */}
            <div className="w-24 h-6 bg-zinc-800 rounded-sm shadow-md transform -rotate-3" />
            {/* Middle book */}
            <div className="w-28 h-7 bg-zinc-600 rounded-sm shadow-md transform rotate-1" />
            {/* Bottom book */}
            <div className="w-26 h-6 bg-zinc-400 rounded-sm shadow-md transform -rotate-1" />
          </div>

          {/* Decorative open book on top */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <Book size={48} className="text-zinc-700" strokeWidth={1} />
          </div>
        </div>
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-6 left-6 animate-pulse">
        <Sparkles size={20} className="text-zinc-400" strokeWidth={1.5} />
      </div>

      <div className="absolute top-8 right-8">
        <Bookmark size={24} className="text-zinc-500" strokeWidth={1.5} />
      </div>

      <div className="absolute bottom-8 left-8">
        <Library size={28} className="text-zinc-400" strokeWidth={1.5} />
      </div>

      <div className="absolute bottom-6 right-6 animate-pulse delay-500">
        <Sparkles size={16} className="text-zinc-300" strokeWidth={1.5} />
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />
    </div>
  );
}

