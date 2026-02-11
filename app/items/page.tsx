"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { BottomNav } from "@/components/navigation";
import { BookCard, BookDetailsPanel } from "@/components/books";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Book } from "@/types/type";
import { session } from "@/lib/session";

export default function ItemsPage() {
  const router = useRouter();
  const t = useTranslations("books");
  const isDesktop = useIsDesktop();
  const [books, setBooks] = useState<Book[]>([]);
  const [featuredBookIds, setFeaturedBookIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storeId = session.getItem("selectedStore");
        
        // Validate storeId is a non-empty, valid-looking value
        const isValidStoreId = storeId && 
          storeId.trim() !== "" && 
          storeId !== "null" && 
          storeId !== "undefined";
        
        if (isValidStoreId) {
          // Fetch books first
          const booksResponse = await fetch(`/api/books?storeId=${storeId}`);
          if (booksResponse.ok) {
            const booksData = await booksResponse.json();
            setBooks(booksData);
          }

          // Fetch store info separately with error handling
          try {
            const storeResponse = await fetch(`/api/store?id=${storeId}`);
            if (storeResponse.ok) {
              const storeData = await storeResponse.json();
              setFeaturedBookIds(storeData.featuredBooks || []);
            }
          } catch (storeError) {
            console.error("Failed to fetch store info:", storeError);
            // Continue without featured books
          }
        } else {
          // No valid store selected, just fetch all books
          const booksResponse = await fetch("/api/books");
          if (booksResponse.ok) {
            const booksData = await booksResponse.json();
            setBooks(booksData);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const allCategories = useMemo(() => {
    const categorySet = new Set<string>();
    books.forEach((book) => {
      book.categories?.forEach((cat) => categorySet.add(cat));
    });
    return Array.from(categorySet).sort();
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        !searchQuery ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory =
        !selectedCategory ||
        book.categories?.includes(selectedCategory);
      
      return matchesSearch && matchesCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  const featuredBooks = useMemo(() => {
    // Return books that are in the featuredBookIds list, in the order they were selected
    return featuredBookIds
      .map((id) => books.find((book) => book.id === id))
      .filter((book): book is Book => book !== undefined && !!book.cover);
  }, [books, featuredBookIds]);

  const handleViewBook = (bookId: string) => {
    if (isDesktop) {
      setSelectedBookId(bookId);
    } else {
      router.push(`/items/${bookId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-6">
      <PageHeader title={t("browseBooks")} showBack={false} />

      <div className="px-4 pt-5 space-y-5 max-w-5xl mx-auto lg:px-8">
        {/* This Week's Book - Horizontal Scroll */}
        <section>
          <h2 className="font-display text-sm font-semibold text-foreground mb-3">
            {t("thisWeeksBook")}
          </h2>
          {isLoading ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-28 h-40 bg-muted rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : featuredBooks.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 lg:-mx-8 lg:px-8">
              {featuredBooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleViewBook(book.id)}
                  className="flex-shrink-0 w-28 h-40 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow active:scale-[0.98] relative"
                >
                  <Image
                    src={book.cover!}
                    alt={book.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 bg-secondary rounded-xl text-muted-foreground/70 text-sm">
              {t("noFeaturedBooks")}
            </div>
          )}
        </section>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("searchBooks")}
        />

        {/* Category Tags */}
        {allCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 lg:-mx-8 lg:px-8 lg:flex-wrap">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                selectedCategory === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              )}
            >
              {t("all")}
            </button>
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted"
                )}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* Book List */}
        <section>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex gap-4 p-4 bg-secondary rounded-2xl animate-pulse"
                >
                  <div className="w-20 h-28 bg-muted rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onView={() => handleViewBook(book.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title={t("noBooksFound")}
              message={searchQuery || selectedCategory
                ? t("tryAdjusting")
                : t("checkBackLater")}
            />
          )}
        </section>
      </div>

      <BottomNav />

      {/* Desktop: book details slide-in from right */}
      <Sheet
        open={!!selectedBookId}
        onOpenChange={(open) => {
          if (!open) setSelectedBookId(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-md lg:max-w-lg p-0 overflow-hidden"
        >
          <SheetTitle className="sr-only">
            {t("viewDetails")}
          </SheetTitle>
          {selectedBookId && (
            <BookDetailsPanel bookId={selectedBookId} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
