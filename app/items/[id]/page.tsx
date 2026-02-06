"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { 
  ArrowLeft, 
  Heart, 
  BookOpen,
  Calendar,
  Building2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  fetchUser, 
  addBookToFavorites, 
  removeBookFromFavorites 
} from "@/data/supabase";
import type { Book } from "@/types/type";
import { session } from "@/lib/session";

export default function ItemDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = params.id as string;

  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get user ID from session
        const storedUserId = session.getItem("userId");
        setUserId(storedUserId);

        // Fetch book data
        const response = await fetch(`/api/books?id=${bookId}`);
        if (response.ok) {
          const data = await response.json();
          setBook(data);
        }

        // Check if user has favorited this book
        if (storedUserId) {
          const userData = await fetchUser(storedUserId);
          if (userData.favoriteBooks?.includes(bookId)) {
            setIsLiked(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (bookId) {
      loadData();
    }
  }, [bookId]);

  const truncatedDescription = book?.description
    ? book.description.length > 150
      ? book.description.slice(0, 150) + "..."
      : book.description
    : "";

  const shouldShowMore = book?.description && book.description.length > 150;

  const handleLike = async () => {
    if (!userId || isTogglingLike) return;

    setIsTogglingLike(true);
    try {
      if (isLiked) {
        await removeBookFromFavorites(userId, bookId);
        setIsLiked(false);
        // Update local book likes count
        if (book) {
          setBook({ ...book, likes: Math.max(0, book.likes - 1) });
        }
      } else {
        await addBookToFavorites(userId, bookId);
        setIsLiked(true);
        // Update local book likes count
        if (book) {
          setBook({ ...book, likes: book.likes + 1 });
        }
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      alert("Failed to update favorite. Please try again.");
    } finally {
      setIsTogglingLike(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-64 bg-zinc-100 animate-pulse" />
        <div className="px-4 py-6 space-y-4">
          <div className="w-32 h-44 mx-auto bg-zinc-200 rounded-xl animate-pulse -mt-24" />
          <div className="h-6 bg-zinc-200 rounded w-3/4 mx-auto animate-pulse" />
          <div className="h-4 bg-zinc-200 rounded w-1/2 mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <BookOpen size={48} className="text-zinc-300 mb-4" />
        <p className="text-zinc-600 font-medium">Book not found</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-zinc-500 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Background Header with Vector Pattern */}
      <div className="relative h-56 bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-100 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" className="text-zinc-300" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
            <circle cx="350" cy="50" r="80" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-200" />
            <circle cx="50" cy="200" r="60" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-200" />
            <path d="M0 180 Q100 150 200 180 T400 160" fill="none" stroke="currentColor" strokeWidth="1" className="text-zinc-200" />
          </svg>
        </div>
        
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-20 p-2.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ArrowLeft size={20} className="text-zinc-800" />
        </button>
      </div>

      {/* Book Cover - Overlapping the header */}
      <div className="relative px-4 -mt-28 z-0">
        <div className="w-36 h-52 mx-auto rounded-xl overflow-hidden shadow-xl bg-zinc-900 relative">
          {book.cover ? (
            <Image
              src={book.cover}
              alt={book.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
              <BookOpen size={40} className="text-zinc-600" />
            </div>
          )}
        </div>
      </div>

      {/* Book Info */}
      <div className="px-4 pt-5 pb-8">
        <div className="text-center space-y-1.5">
          <h1 className="text-xl font-bold text-zinc-900 leading-tight">
            {book.title}
          </h1>
          <p className="text-zinc-500 font-medium">
            {book.author || "Unknown Author"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mt-5">
          {book.publicationDate && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 rounded-xl">
              <Calendar size={14} className="text-zinc-500" />
              <span className="text-sm text-zinc-700 font-medium">
                {new Date(book.publicationDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          )}
          {book.location && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 rounded-xl">
              <Building2 size={14} className="text-zinc-500" />
              <span className="text-sm text-zinc-700 font-medium">
                {book.location}
              </span>
            </div>
          )}
        </div>

        {book.description && (
          <div className="mt-6">
            <p className="text-zinc-600 leading-relaxed text-[15px]">
              {isDescriptionExpanded ? book.description : truncatedDescription}
              {shouldShowMore && !isDescriptionExpanded && (
                <button
                  onClick={() => setIsDescriptionExpanded(true)}
                  className="text-zinc-900 font-semibold ml-1 hover:underline"
                >
                  More
                </button>
              )}
              {shouldShowMore && isDescriptionExpanded && (
                <button
                  onClick={() => setIsDescriptionExpanded(false)}
                  className="text-zinc-900 font-semibold ml-1 hover:underline"
                >
                  Less
                </button>
              )}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-zinc-500 font-medium">Categories:</span>
            {book.categories && book.categories.length > 0 ? (
              book.categories.slice(0, 3).map((category) => (
                <span
                  key={category}
                  className="px-3 py-1.5 bg-zinc-100 rounded-full text-xs font-medium text-zinc-600 border border-zinc-200"
                >
                  {category}
                </span>
              ))
            ) : (
              <span className="text-sm text-zinc-400">None</span>
            )}
          </div>
          <button
            onClick={handleLike}
            disabled={!userId || isTogglingLike}
            className={cn(
              "p-2.5 rounded-full transition-colors",
              userId ? "hover:bg-zinc-100" : "opacity-50 cursor-not-allowed"
            )}
            title={userId ? (isLiked ? "Remove from favorites" : "Add to favorites") : "Login to favorite"}
          >
            {isTogglingLike ? (
              <Loader2 size={22} className="text-zinc-400 animate-spin" />
            ) : (
              <Heart
                size={22}
                className={cn(
                  "transition-all",
                  isLiked
                    ? "fill-rose-500 text-rose-500"
                    : "text-zinc-400"
                )}
              />
            )}
          </button>
        </div>

        {book.status === "borrowed" && book.borrowedDate && (
          <p className="text-center text-sm text-zinc-400 mt-3">
            Borrowed on {new Date(book.borrowedDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
