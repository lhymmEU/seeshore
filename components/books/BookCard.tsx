"use client";

import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Book } from "@/types/type";

function getStatusBadge(status: Book["status"]) {
  const statusConfig = {
    available: { label: "Available", className: "bg-emerald-100 text-emerald-700" },
    borrowed: { label: "Borrowed", className: "bg-amber-100 text-amber-700" },
  };
  
  return statusConfig[status] || { label: status, className: "bg-zinc-100 text-zinc-600" };
}

export interface BookCardProps {
  book: Book;
  onView?: () => void;
}

export function BookCard({ book, onView }: BookCardProps) {
  const statusBadge = getStatusBadge(book.status);
  
  return (
    <div className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 transition-colors hover:border-zinc-200">
      {/* Book Cover */}
      <div className="relative">
        {book.cover ? (
          <div className="h-40 w-full relative">
            <img
              src={book.cover}
              alt={book.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-zinc-200 to-zinc-100 flex items-center justify-center">
            <BookOpen size={36} className="text-zinc-400" />
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
          <h3 className="font-semibold text-zinc-900 text-base leading-tight line-clamp-2">
            {book.title}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">
            {book.author}
          </p>
        </div>
        
        {/* View Button */}
        <button
          onClick={onView}
          className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 transition-colors active:scale-[0.98]"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

