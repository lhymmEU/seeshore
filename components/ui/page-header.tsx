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
    <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center h-14 px-4 max-w-5xl mx-auto">
        {showBack ? (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground/80" />
          </button>
        ) : (
          <div className="w-8 lg:w-0" />
        )}
        <h1 className="font-display flex-1 text-center font-semibold text-foreground pr-8 lg:text-left lg:pr-0">
          {title}
        </h1>
      </div>
    </div>
  );
}
