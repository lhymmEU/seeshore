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
import { useTranslations } from "next-intl";
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
  const t = useTranslations("books");
  const tCommon = useTranslations("common");

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
      <div className="min-h-screen bg-background">
        <div className="h-64 bg-muted animate-pulse" />
        <div className="px-4 py-6 space-y-4">
          <div className="w-32 h-44 mx-auto bg-muted rounded-xl animate-pulse -mt-24" />
          <div className="h-6 bg-muted rounded w-3/4 mx-auto animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/2 mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <BookOpen size={48} className="text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground font-medium">{t("bookNotFound")}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-muted-foreground underline"
        >
          {tCommon("goBack")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Header with Vector Pattern */}
      <div className="relative h-56 bg-gradient-to-br from-muted via-secondary to-secondary overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="currentColor" className="text-muted-foreground/50" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
            <circle cx="350" cy="50" r="80" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/30" />
            <circle cx="50" cy="200" r="60" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/30" />
            <path d="M0 180 Q100 150 200 180 T400 160" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/30" />
          </svg>
        </div>
        
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-20 p-2.5 bg-background/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-background transition-colors"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
      </div>

      {/* Book Cover - Overlapping the header */}
      <div className="relative px-4 -mt-28 z-0">
        <div className="w-36 h-52 mx-auto rounded-xl overflow-hidden shadow-xl bg-primary relative">
          {book.cover ? (
            <Image
              src={book.cover}
              alt={book.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/80 to-primary">
              <BookOpen size={40} className="text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Book Info */}
      <div className="px-4 pt-5 pb-8">
        <div className="text-center space-y-1.5">
          <h1 className="font-display text-xl font-bold text-foreground leading-tight">
            {book.title}
          </h1>
          <p className="text-muted-foreground font-medium">
            {book.author || tCommon("unknownAuthor")}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mt-5">
          {book.publicationDate && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted rounded-xl">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="text-sm text-foreground/70 font-medium">
                {new Date(book.publicationDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                })}
              </span>
            </div>
          )}
          {book.location && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted rounded-xl">
              <Building2 size={14} className="text-muted-foreground" />
              <span className="text-sm text-foreground/70 font-medium">
                {book.location}
              </span>
            </div>
          )}
        </div>

        {book.description && (
          <div className="mt-6">
            <p className="font-serif text-muted-foreground leading-relaxed text-[15px]">
              {isDescriptionExpanded ? book.description : truncatedDescription}
              {shouldShowMore && !isDescriptionExpanded && (
                <button
                  onClick={() => setIsDescriptionExpanded(true)}
                  className="text-foreground font-semibold ml-1 hover:underline"
                >
                  {t("more")}
                </button>
              )}
              {shouldShowMore && isDescriptionExpanded && (
                <button
                  onClick={() => setIsDescriptionExpanded(false)}
                  className="text-foreground font-semibold ml-1 hover:underline"
                >
                  {t("less")}
                </button>
              )}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground font-medium">{t("categories")}</span>
            {book.categories && book.categories.length > 0 ? (
              book.categories.slice(0, 3).map((category) => (
                <span
                  key={category}
                  className="px-3 py-1.5 bg-muted rounded-full text-xs font-medium text-muted-foreground border border-border"
                >
                  {category}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground/70">{t("none")}</span>
            )}
          </div>
          <button
            onClick={handleLike}
            disabled={!userId || isTogglingLike}
            className={cn(
              "p-2.5 rounded-full transition-colors",
              userId ? "hover:bg-muted" : "opacity-50 cursor-not-allowed"
            )}
            title={userId ? (isLiked ? t("removeFromFavorites") : t("addToFavorites")) : t("loginToFavorite")}
          >
            {isTogglingLike ? (
              <Loader2 size={22} className="text-muted-foreground/70 animate-spin" />
            ) : (
              <Heart
                size={22}
                className={cn(
                  "transition-all",
                  isLiked
                    ? "fill-rose-500 text-rose-500"
                    : "text-muted-foreground/70"
                )}
              />
            )}
          </button>
        </div>

        {book.status === "borrowed" && book.borrowedDate && (
          <p className="text-center text-sm text-muted-foreground/70 mt-3">
            {t("borrowedOn")}{new Date(book.borrowedDate).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
