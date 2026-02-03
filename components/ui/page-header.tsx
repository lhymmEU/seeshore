"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function PageHeader({ title, showBack = true, onBack }: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <div className="flex items-center h-14 px-4">
        {showBack ? (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-zinc-800" />
          </button>
        ) : (
          <div className="w-8" />
        )}
        <h1 className="flex-1 text-center font-semibold text-zinc-900 pr-8">
          {title}
        </h1>
      </div>
    </div>
  );
}
