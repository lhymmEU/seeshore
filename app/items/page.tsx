"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { BookCard } from "@/components/books";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import type { Book } from "@/types/type";

export default function ItemsPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [featuredBookIds, setFeaturedBookIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storeId = sessionStorage.getItem("selectedStore");
        
        // Fetch books
        const booksUrl = storeId ? `/api/books?storeId=${storeId}` : "/api/books";
        const booksResponse = await fetch(booksUrl);
        if (booksResponse.ok) {
          const booksData = await booksResponse.json();
          setBooks(booksData);
        }

        // Fetch store info to get featured books
        if (storeId) {
          const storeResponse = await fetch(`/api/store?id=${storeId}`);
          if (storeResponse.ok) {
            const storeData = await storeResponse.json();
            setFeaturedBookIds(storeData.featuredBooks || []);
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
    router.push(`/items/${bookId}`);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <PageHeader title="Browse Books" showBack={false} />

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
            <div className="flex items-center justify-center h-40 bg-zinc-50 rounded-xl text-zinc-400 text-sm">
              No featured books available
            </div>
          )}
        </section>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search books..."
        />

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
            <EmptyState
              icon={BookOpen}
              title="No books found"
              message={searchQuery || selectedCategory
                ? "Try adjusting your filters"
                : "Check back later for new additions"}
            />
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
