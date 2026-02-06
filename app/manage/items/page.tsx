"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { ItemRegistrationDrawer, BorrowDrawer } from "@/components/manage";
import type { Book } from "@/types/type";

// Calculate days remaining for a borrowed book (30-day lending period)
function calculateDaysRemaining(borrowedDate: string): number {
  const borrowed = new Date(borrowedDate);
  const dueDate = new Date(borrowed);
  dueDate.setDate(dueDate.getDate() + 30);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Format the countdown display
function formatCountdown(daysRemaining: number): string {
  if (daysRemaining <= 0) {
    return "Overdue";
  } else if (daysRemaining === 1) {
    return "1 day left";
  } else {
    return `${daysRemaining} days`;
  }
}

function BorrowedBookCard({
  book,
  onReturnBook,
}: {
  book: Book;
  onReturnBook: () => Promise<void>;
}) {
  const [isReturning, setIsReturning] = useState(false);

  const daysRemaining = book.borrowedDate
    ? calculateDaysRemaining(book.borrowedDate)
    : null;

  const handleClick = async () => {
    if (!confirm(`Return "${book.title}"?`)) return;
    setIsReturning(true);
    try {
      await onReturnBook();
    } finally {
      setIsReturning(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isReturning}
      className="flex-shrink-0 w-28 group cursor-pointer disabled:opacity-50"
    >
      {/* Book Cover */}
      <div className="relative w-28 h-40 rounded-2xl overflow-hidden bg-zinc-200 shadow-sm group-hover:shadow-md transition-shadow">
        {book.cover ? (
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-300 to-zinc-200">
            <BookOpen size={24} className="text-zinc-400" />
          </div>
        )}
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Countdown badge */}
        {daysRemaining !== null && (
          <div
            className={cn(
              "absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap backdrop-blur-sm",
              daysRemaining <= 0
                ? "bg-red-500/90 text-white"
                : daysRemaining <= 7
                ? "bg-amber-400/90 text-amber-950"
                : "bg-white/90 text-zinc-700"
            )}
          >
            <Clock size={10} />
            <span>{formatCountdown(daysRemaining)}</span>
          </div>
        )}
        {/* Loading overlay */}
        {isReturning && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 size={20} className="text-white animate-spin" />
          </div>
        )}
      </div>
    </button>
  );
}

function ItemCard({
  book,
  onEdit,
  onDelete,
  onStatusClick,
  onReturnBook,
}: {
  book: Book;
  onEdit: () => void;
  onDelete: () => void;
  onStatusClick: () => void;
  onReturnBook: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return;
    }
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  };

  const handleStatusClick = async () => {
    if (book.status === "available") {
      // Open borrow drawer for available books
      onStatusClick();
    } else {
      // Return the book for borrowed books
      if (!confirm(`Return "${book.title}"?`)) {
        return;
      }
      setIsReturning(true);
      try {
        await onReturnBook();
      } finally {
        setIsReturning(false);
      }
    }
  };

  const isBorrowed = book.status === "borrowed";
  
  // Calculate countdown for borrowed books
  const daysRemaining = isBorrowed && book.borrowedDate 
    ? calculateDaysRemaining(book.borrowedDate) 
    : null;

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all",
        isBorrowed
          ? "bg-zinc-100 border-zinc-200"
          : "bg-white border-zinc-100"
      )}
    >
      <div className="flex gap-4 p-4">
        {/* Book Cover */}
        <div
          className={cn(
            "flex-shrink-0 w-20 h-28 rounded-xl overflow-hidden bg-zinc-100 relative",
            isBorrowed && "opacity-60"
          )}
        >
          {book.cover ? (
            <Image
              src={book.cover}
              alt={book.title}
              fill
              className={cn("object-cover", isBorrowed && "grayscale")}
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-200 to-zinc-100">
              <BookOpen size={24} className="text-zinc-400" />
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              "font-semibold text-base leading-tight line-clamp-2",
              isBorrowed ? "text-zinc-500" : "text-zinc-900"
            )}
          >
            {book.title}
          </h3>
          <p
            className={cn(
              "text-sm mt-1 line-clamp-1",
              isBorrowed ? "text-zinc-400" : "text-zinc-500"
            )}
          >
            {book.author || "Unknown Author"}
          </p>
          {book.location && (
            <div
              className={cn(
                "flex items-center gap-1.5 mt-2 text-xs",
                isBorrowed ? "text-zinc-400" : "text-zinc-400"
              )}
            >
              <MapPin size={12} />
              <span className="line-clamp-1">{book.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleStatusClick}
              disabled={isReturning}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50",
                book.status === "available"
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-zinc-300 text-zinc-600 hover:bg-zinc-400"
              )}
              title={book.status === "available" ? "Click to lend" : "Click to return"}
            >
              {isReturning ? (
                <span className="flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  Returning...
                </span>
              ) : book.status === "available" ? (
                "Available"
              ) : (
                "Borrowed"
              )}
            </button>
            
            {/* Countdown for borrowed books */}
            {isBorrowed && daysRemaining !== null && (
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  daysRemaining <= 0
                    ? "bg-red-100 text-red-700"
                    : daysRemaining <= 7
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                )}
              >
                <Clock size={12} />
                <span>{formatCountdown(daysRemaining)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onEdit}
            className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 transition-colors active:scale-95"
            title="Edit"
          >
            <Pencil size={16} className="text-zinc-600" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 transition-colors active:scale-95 disabled:opacity-50"
            title="Delete"
          >
            {isDeleting ? (
              <Loader2 size={16} className="text-red-500 animate-spin" />
            ) : (
              <Trash2 size={16} className="text-red-500" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ManageItemsPage() {
  const router = useRouter();

  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [borrowDrawerOpen, setBorrowDrawerOpen] = useState(false);
  const [selectedBookForBorrow, setSelectedBookForBorrow] = useState<Book | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const role = sessionStorage.getItem("userRole");
      if (role !== "owner" && role !== "assistant") {
        router.push("/");
        return;
      }
    };

    checkAuth();
    fetchBooks();
  }, [router]);

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

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.isbn?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  // Split into borrowed and available books
  const borrowedBooks = useMemo(() => {
    return filteredBooks
      .filter((book) => book.status === "borrowed")
      .sort((a, b) => {
        const daysA = a.borrowedDate ? calculateDaysRemaining(a.borrowedDate) : Infinity;
        const daysB = b.borrowedDate ? calculateDaysRemaining(b.borrowedDate) : Infinity;
        return daysA - daysB; // Closest to return deadline first
      });
  }, [filteredBooks]);

  const availableBooks = useMemo(() => {
    return filteredBooks.filter((book) => book.status !== "borrowed");
  }, [filteredBooks]);

  const handleAddNew = () => {
    setEditingBook(null);
    setDrawerOpen(true);
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setDrawerOpen(true);
  };

  const handleDelete = async (bookId: string) => {
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to delete book");
      }

      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (error) {
      console.error("Failed to delete book:", error);
      alert("Failed to delete book. Please try again.");
    }
  };

  // Open borrow drawer for a book
  const handleOpenBorrowDrawer = (book: Book) => {
    setSelectedBookForBorrow(book);
    setBorrowDrawerOpen(true);
  };

  // Return a borrowed book
  const handleReturnBook = async (bookId: string) => {
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/books/${bookId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: "available" }),
      });

      if (!response.ok) {
        throw new Error("Failed to return book");
      }

      // Update local state
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? { ...b, status: "available", borrower: undefined, borrowedDate: undefined }
            : b
        )
      );
    } catch (error) {
      console.error("Failed to return book:", error);
      alert("Failed to return book. Please try again.");
      throw error;
    }
  };

  // Handle successful borrow from drawer
  const handleBorrowSuccess = () => {
    fetchBooks();
  };

  const handleDrawerSuccess = () => {
    fetchBooks();
  };

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <PageHeader title="Manage Items" />

      <div className="px-4 pt-5 space-y-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by title, author, or ISBN..."
        />

        {/* Borrowed Books Section */}
        {!isLoading && borrowedBooks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700">
                Borrowed
                <span className="ml-1.5 text-xs font-normal text-zinc-400">
                  {borrowedBooks.length}
                </span>
              </h2>
            </div>
            <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 pb-2">
                {borrowedBooks.map((book) => (
                  <BorrowedBookCard
                    key={book.id}
                    book={book}
                    onReturnBook={() => handleReturnBook(book.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Items Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500">
            {isLoading ? (
              "Loading..."
            ) : (
              <>
                <span className="font-medium text-zinc-700">
                  {availableBooks.length}
                </span>{" "}
                {availableBooks.length === 1 ? "item" : "items"}
                {searchQuery && ` found`}
              </>
            )}
          </p>
        </div>

        {/* Items List (available books only) */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-4 p-4 bg-white rounded-2xl animate-pulse border border-zinc-100"
              >
                <div className="w-20 h-28 bg-zinc-200 rounded-xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-zinc-200 rounded w-3/4" />
                  <div className="h-4 bg-zinc-200 rounded w-1/2" />
                  <div className="h-6 bg-zinc-200 rounded w-20 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : availableBooks.length > 0 ? (
          <div className="space-y-3">
            {availableBooks.map((book) => (
              <ItemCard
                key={book.id}
                book={book}
                onEdit={() => handleEdit(book)}
                onDelete={() => handleDelete(book.id)}
                onStatusClick={() => handleOpenBorrowDrawer(book)}
                onReturnBook={() => handleReturnBook(book.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title={searchQuery ? "No items found" : "No Available Items"}
            message={
              searchQuery
                ? "Try adjusting your search"
                : "Tap the + button to register an item"
            }
          />
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleAddNew}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-zinc-900 text-white shadow-lg hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center"
        aria-label="Add new item"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      <ItemRegistrationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editBook={editingBook}
        onSuccess={handleDrawerSuccess}
      />

      <BorrowDrawer
        open={borrowDrawerOpen}
        onOpenChange={setBorrowDrawerOpen}
        book={selectedBookForBorrow}
        onSuccess={handleBorrowSuccess}
      />

      <BottomNav />
    </div>
  );
}
