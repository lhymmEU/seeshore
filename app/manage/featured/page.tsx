"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BookOpen,
  Check,
  Loader2,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import type { Book, Store } from "@/types/type";

function BookSelectionCard({
  book,
  isSelected,
  onToggle,
}: {
  book: Book;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative bg-white rounded-2xl border overflow-hidden shadow-sm transition-all active:scale-[0.98]",
        isSelected
          ? "border-emerald-500 ring-2 ring-emerald-500/20"
          : "border-zinc-100 hover:border-zinc-200 hover:shadow-md"
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          "absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all",
          isSelected ? "bg-emerald-500" : "bg-white/80 backdrop-blur-sm border border-zinc-200"
        )}
      >
        {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
      </div>

      {/* Book Cover */}
      <div className="relative h-36 w-full">
        {book.cover ? (
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-zinc-200 to-zinc-100 flex items-center justify-center">
            <BookOpen size={32} className="text-zinc-400" />
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-3 text-left">
        <h3 className="font-medium text-zinc-900 text-sm leading-tight line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
          {book.author || "Unknown Author"}
        </p>
      </div>
    </button>
  );
}

export default function ManageFeaturedBooksPage() {
  const router = useRouter();

  const [books, setBooks] = useState<Book[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      const role = sessionStorage.getItem("userRole");
      if (role !== "owner") {
        router.push("/");
        return false;
      }
      return true;
    };

    const loadData = async () => {
      if (!checkAuth()) return;

      try {
        const storeId = sessionStorage.getItem("selectedStore");
        if (!storeId) {
          router.push("/");
          return;
        }

        // Fetch store info and books in parallel
        const [storeResponse, booksResponse] = await Promise.all([
          fetch(`/api/store?id=${storeId}`),
          fetch(`/api/books?storeId=${storeId}`),
        ]);

        if (storeResponse.ok) {
          const storeData = await storeResponse.json();
          setStore(storeData);
          setSelectedBookIds(storeData.featuredBooks || []);
        }

        if (booksResponse.ok) {
          const booksData = await booksResponse.json();
          setBooks(booksData);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  const handleToggleBook = (bookId: string) => {
    setSelectedBookIds((prev) => {
      if (prev.includes(bookId)) {
        return prev.filter((id) => id !== bookId);
      }
      // Limit to 10 featured books
      if (prev.length >= 10) {
        alert("You can select up to 10 featured books");
        return prev;
      }
      return [...prev, bookId];
    });
  };

  const handleSave = async () => {
    if (!store) return;

    setIsSaving(true);
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/store", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          id: store.id,
          featuredBooks: selectedBookIds,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update featured books");
      }

      setIsSaving(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to save featured books:", error);
      alert("Failed to save featured books. Please try again.");
      setIsSaving(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!store) return false;
    const originalIds = store.featuredBooks || [];
    if (originalIds.length !== selectedBookIds.length) return true;
    return !originalIds.every((id) => selectedBookIds.includes(id));
  }, [store, selectedBookIds]);

  return (
    <div className="min-h-screen bg-zinc-50 pb-32">
      <PageHeader title="This Week's Books" />

      <div className="px-4 pt-5 space-y-4">
        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Star size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">
              Select your featured books
            </p>
            <p className="text-xs text-amber-600 mt-1">
              These books will appear in the &quot;This Week&apos;s Book&quot; section on the browse page. You can select up to 10 books.
            </p>
          </div>
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search books..."
        />

        {/* Selection Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            <span className="font-medium text-zinc-700">{selectedBookIds.length}</span>
            {" / 10 selected"}
          </p>
          {selectedBookIds.length > 0 && (
            <button
              onClick={() => setSelectedBookIds([])}
              className="text-sm text-zinc-500 hover:text-zinc-700 underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-zinc-100 overflow-hidden animate-pulse"
              >
                <div className="h-36 bg-zinc-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-zinc-200 rounded w-3/4" />
                  <div className="h-3 bg-zinc-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredBooks.map((book) => (
              <BookSelectionCard
                key={book.id}
                book={book}
                isSelected={selectedBookIds.includes(book.id)}
                onToggle={() => handleToggleBook(book.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title={searchQuery ? "No books found" : "No books available"}
            message={
              searchQuery
                ? "Try adjusting your search"
                : "Register some books first to feature them"
            }
          />
        )}
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent pt-6">
        <button
          onClick={handleSave}
          disabled={isSaving || isSuccess || !hasChanges}
          className={cn(
            "w-full py-4 rounded-2xl font-medium text-base transition-all",
            isSuccess
              ? "bg-emerald-500 text-white"
              : hasChanges
              ? "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          )}
        >
          {isSuccess ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={18} strokeWidth={2.5} />
              Saved!
            </span>
          ) : isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
