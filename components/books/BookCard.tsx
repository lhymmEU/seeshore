"use client";

import Image from "next/image";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Book } from "@/types/type";

function getStatusBadge(status: Book["status"], t: (key: string) => string) {
  const statusConfig = {
    available: { label: t("available"), className: "bg-emerald-100 text-emerald-700" },
    borrowed: { label: t("borrowed"), className: "bg-amber-100 text-amber-700" },
  };
  
  return statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
}

export interface BookCardProps {
  book: Book;
  onView?: () => void;
}

export function BookCard({ book, onView }: BookCardProps) {
  const t = useTranslations("books");
  const statusBadge = getStatusBadge(book.status, t);
  
  return (
    <div className="bg-secondary rounded-2xl overflow-hidden border border-border transition-colors hover:border-border">
      {/* Book Cover */}
      <div className="relative">
        {book.cover ? (
          <div className="h-40 w-full relative">
            <Image
              src={book.cover}
              alt={book.title}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
            <BookOpen size={36} className="text-muted-foreground/70" />
          </div>
        )}
        {/* Status Badge */}
        <span className={cn(
          "absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium",
          statusBadge.className
        )}>
          {statusBadge.label}
        </span>
      </div>
      
      {/* Book Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-semibold text-foreground text-base leading-tight line-clamp-2">
            {book.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {book.author}
          </p>
        </div>
        
        {/* View Button */}
        <button
          onClick={onView}
          className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors active:scale-[0.98]"
        >
          {t("viewDetails")}
        </button>
      </div>
    </div>
  );
}

