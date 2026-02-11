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
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import type { Book, Store } from "@/types/type";
import { session } from "@/lib/session";

function BookSelectionCard({
  book,
  isSelected,
  onToggle,
}: {
  book: Book;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const tCommon = useTranslations("common");
  return (
    <button
      onClick={onToggle}
      className={cn(
        "relative bg-background rounded-2xl border overflow-hidden shadow-sm transition-all active:scale-[0.98]",
        isSelected
          ? "border-emerald-500 ring-2 ring-emerald-500/20"
          : "border-border hover:border-border hover:shadow-md"
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          "absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all",
          isSelected ? "bg-emerald-500" : "bg-background/80 backdrop-blur-sm border border-border"
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
          <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
            <BookOpen size={32} className="text-muted-foreground/70" />
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="p-3 text-left">
        <h3 className="font-display font-medium text-foreground text-sm leading-tight line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {book.author || tCommon("unknownAuthor")}
        </p>
      </div>
    </button>
  );
}

export default function ManageFeaturedBooksPage() {
  const router = useRouter();
  const t = useTranslations("manage");
  const tCommon = useTranslations("common");

  const [books, setBooks] = useState<Book[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      const role = session.getItem("userRole");
      if (role !== "owner") {
        router.push("/");
        return false;
      }
      return true;
    };

    const loadData = async () => {
      if (!checkAuth()) return;

      try {
        const storeId = session.getItem("selectedStore");
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
      const accessToken = session.getItem("accessToken");
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
    <div className="min-h-screen bg-secondary pb-32">
      <PageHeader title={t("thisWeeksBooks")} />

      <div className="px-4 pt-5 space-y-4">
        {/* Info Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Star size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-800 font-medium">
              {t("selectFeaturedBooks")}
            </p>
            <p className="text-xs text-amber-600 mt-1 font-serif">
              {t("featuredBooksDescription")}
            </p>
          </div>
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("searchBooksPlaceholder")}
        />

        {/* Selection Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground/70">{selectedBookIds.length}</span>
            {t("selectedOutOfTen")}
          </p>
          {selectedBookIds.length > 0 && (
            <button
              onClick={() => setSelectedBookIds([])}
              className="text-sm text-muted-foreground hover:text-foreground/70 underline"
            >
              {tCommon("clearAll")}
            </button>
          )}
        </div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-background rounded-2xl border border-border overflow-hidden animate-pulse"
              >
                <div className="h-36 bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
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
            title={searchQuery ? t("noBooksFound") : t("noBooksAvailable")}
            message={
              searchQuery
                ? tCommon("tryAdjustingSearch")
                : t("registerBooksFirst")
            }
          />
        )}
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 bg-gradient-to-t from-secondary via-secondary to-transparent pt-6">
        <button
          onClick={handleSave}
          disabled={isSaving || isSuccess || !hasChanges}
          className={cn(
            "w-full py-4 rounded-2xl font-medium text-base transition-all",
            isSuccess
              ? "bg-emerald-500 text-white"
              : hasChanges
              ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
              : "bg-muted text-muted-foreground/70 cursor-not-allowed"
          )}
        >
          {isSuccess ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={18} strokeWidth={2.5} />
              {tCommon("saved")}
            </span>
          ) : isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              {tCommon("saving")}
            </span>
          ) : (
            tCommon("saveChanges")
          )}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
