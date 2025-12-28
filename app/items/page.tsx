"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { BookCard } from "@/components/books";
import type { Book } from "@/types/type";

export default function ItemsPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch books on mount
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const storeId = sessionStorage.getItem("selectedStore");
        const url = storeId ? `/api/books?storeId=${storeId}` : "/api/books";
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setBooks(data);
        }
      } catch (error) {
        console.error("Failed to fetch books:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Extract unique categories from all books
  const allCategories = useMemo(() => {
    const categorySet = new Set<string>();
    books.forEach((book) => {
      book.categories?.forEach((cat) => categorySet.add(cat));
    });
    return Array.from(categorySet).sort();
  }, [books]);

  // Filter books based on search and category
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

  // Featured books for the horizontal scroll (first 10 books with covers)
  const featuredBooks = useMemo(() => {
    return books.filter((book) => book.cover).slice(0, 10);
  }, [books]);

  const handleViewBook = (bookId: string) => {
    router.push(`/items/${bookId}`);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="flex items-center justify-center h-14 px-4">
          <h1 className="font-semibold text-zinc-900">
            Browse Books
          </h1>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* This Week's Book - Horizontal Scroll */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-800 mb-3">
            This Week&apos;s Book
          </h2>
          {isLoading ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-28 h-40 bg-zinc-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : featuredBooks.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {featuredBooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => handleViewBook(book.id)}
                  className="flex-shrink-0 w-28 h-40 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow active:scale-[0.98]"
                >
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 bg-zinc-50 rounded-xl text-zinc-400 text-sm">
              No featured books available
            </div>
          )}
        </section>

        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search books..."
            className="w-full pl-11 pr-4 py-3.5 bg-zinc-100 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all text-base"
          />
        </div>

        {/* Category Tags */}
        {allCategories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                selectedCategory === null
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              All
            </button>
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  selectedCategory === category
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
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
                  className="flex gap-4 p-4 bg-zinc-50 rounded-2xl animate-pulse"
                >
                  <div className="w-20 h-28 bg-zinc-200 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-zinc-200 rounded w-3/4" />
                    <div className="h-4 bg-zinc-200 rounded w-1/2" />
                    <div className="h-4 bg-zinc-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onView={() => handleViewBook(book.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <BookOpen size={28} className="text-zinc-400" />
              </div>
              <p className="text-zinc-600 font-medium">No books found</p>
              <p className="text-zinc-400 text-sm mt-1">
                {searchQuery || selectedCategory
                  ? "Try adjusting your filters"
                  : "Check back later for new additions"}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

