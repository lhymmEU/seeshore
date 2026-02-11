"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  Heart,
  MapPin,
  UserX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { fetchBooksByIds, fetchEventsByIds } from "@/data/supabase";
import { formatDate } from "@/lib/date-utils";
import type { DisplayConfig, Book, StoreEvent } from "@/types/type";

// Generate dicebear avatar URL based on user ID
function getDicebearAvatar(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

function DisplayEventCard({
  event,
  onClick,
}: {
  event: StoreEvent;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border hover:border-border transition-all text-left w-full"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
        {event.cover ? (
          <Image
            src={event.cover}
            alt={event.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar size={16} className="text-muted-foreground/70" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-medium text-foreground text-sm truncate">
          {event.title}
        </h4>
        <p className="text-xs text-muted-foreground">{formatDate(event.startDate)}</p>
      </div>
    </button>
  );
}

function DisplayBookCard({
  book,
  onClick,
  isFavorite = false,
  unknownAuthorText = "Unknown Author",
}: {
  book: Book;
  onClick: () => void;
  isFavorite?: boolean;
  unknownAuthorText?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border hover:border-border transition-all text-left w-full"
    >
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
        {book.cover ? (
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={16} className="text-muted-foreground/70" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-medium text-foreground text-sm truncate">
          {book.title}
        </h4>
        <p className="text-xs text-muted-foreground truncate">
          {book.author || unknownAuthorText}
        </p>
      </div>
      {isFavorite && (
        <Heart
          size={14}
          className="text-rose-500 fill-rose-500 flex-shrink-0"
        />
      )}
    </button>
  );
}

export default function MemberDisplayPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const tProfile = useTranslations("profile");

  const [isLoading, setIsLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<{
    id: string;
    name: string;
    avatar: string;
    location?: string;
  } | null>(null);
  const [displayConfig, setDisplayConfig] = useState<DisplayConfig | null>(
    null
  );
  const [events, setEvents] = useState<StoreEvent[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);

  useEffect(() => {
    const loadDisplayPage = async () => {
      try {
        // Fetch user display config
        const response = await fetch(`/api/users/display?id=${memberId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch display data");
        }

        const data = await response.json();
        setMemberInfo(data.user);
        setDisplayConfig(data.displayConfig);

        // If display is enabled and has a config, load the display items
        if (data.displayConfig && data.displayConfig.enabled) {
          const config = data.displayConfig as DisplayConfig;

          // Load selected events
          if (config.selectedEvents && config.selectedEvents.length > 0) {
            try {
              const eventData = await fetchEventsByIds(config.selectedEvents);
              setEvents(eventData);
            } catch (e) {
              console.error("Failed to load events:", e);
            }
          }

          // Load selected borrowed books
          if (config.selectedBooks && config.selectedBooks.length > 0) {
            try {
              const bookData = await fetchBooksByIds(config.selectedBooks);
              setBorrowedBooks(bookData);
            } catch (e) {
              console.error("Failed to load books:", e);
            }
          }

          // Load selected favorites
          if (config.selectedFavorites && config.selectedFavorites.length > 0) {
            try {
              const favData = await fetchBooksByIds(config.selectedFavorites);
              setFavoriteBooks(favData);
            } catch (e) {
              console.error("Failed to load favorites:", e);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load display page:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (memberId) {
      loadDisplayPage();
    }
  }, [memberId]);

  if (isLoading) {
    return <PageLoader />;
  }

  // Empty state: no display config or not enabled
  if (!displayConfig || !displayConfig.enabled) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Back button */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center h-14 px-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft size={20} className="text-foreground" />
            </button>
            <h1 className="font-display flex-1 text-center font-semibold text-foreground pr-8">
              {t("memberProfile")}
            </h1>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4">
          <EmptyState
            icon={UserX}
            title={t("noDisplayPageSetUp")}
            message={t("noDisplayPageMessage")}
            action={
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="rounded-xl mt-2"
              >
                {tCommon("goBack")}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const avatarUrl =
    memberInfo?.avatar ||
    getDicebearAvatar(memberInfo?.id || memberId);

  const hasEvents = events.length > 0;
  const hasBorrowedBooks = borrowedBooks.length > 0;
  const hasFavoriteBooks = favoriteBooks.length > 0;

  return (
    <div className="min-h-screen bg-secondary pb-8">
      {/* Header with back button */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="font-display flex-1 text-center font-semibold text-foreground pr-8">
            {memberInfo?.name || tCommon("member")}
          </h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6 max-w-3xl mx-auto lg:px-8">
        {/* Profile Header */}
        <div className="bg-background rounded-3xl p-6 shadow-sm border border-border">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted relative mb-4">
              <Image
                src={avatarUrl}
                alt={memberInfo?.name || "Member"}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {memberInfo?.name}
            </h2>
            {memberInfo?.location && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <MapPin size={12} className="text-muted-foreground/70" />
                <span className="text-sm text-muted-foreground">
                  {memberInfo.location}
                </span>
              </div>
            )}
            {displayConfig.bio && (
              <p className="font-serif text-sm text-muted-foreground mt-3 leading-relaxed max-w-sm">
                {displayConfig.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4">
              {hasEvents && (
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">
                    {events.length}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {tCommon("events")}
                  </p>
                </div>
              )}
              {hasBorrowedBooks && (
                <>
                  {hasEvents && <div className="w-px h-8 bg-muted" />}
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">
                      {borrowedBooks.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {tProfile("reading")}
                    </p>
                  </div>
                </>
              )}
              {hasFavoriteBooks && (
                <>
                  {(hasEvents || hasBorrowedBooks) && (
                    <div className="w-px h-8 bg-muted" />
                  )}
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">
                      {favoriteBooks.length}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {tCommon("favorites")}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Events Section */}
        {hasEvents && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={16} className="text-muted-foreground" />
              <h3 className="font-display font-semibold text-foreground">{tCommon("events")}</h3>
            </div>
            <div className="space-y-2">
              {events.map((event) => (
                <DisplayEventCard
                  key={event.id}
                  event={event}
                  onClick={() => router.push(`/events/${event.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Borrowed Books Section */}
        {hasBorrowedBooks && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={16} className="text-muted-foreground" />
              <h3 className="font-display font-semibold text-foreground">{t("currentlyReading")}</h3>
            </div>
            <div className="space-y-2">
              {borrowedBooks.map((book) => (
                <DisplayBookCard
                  key={book.id}
                  book={book}
                  onClick={() => router.push(`/items/${book.id}`)}
                  unknownAuthorText={tCommon("unknownAuthor")}
                />
              ))}
            </div>
          </section>
        )}

        {/* Favorite Books Section */}
        {hasFavoriteBooks && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Heart size={16} className="text-muted-foreground" />
              <h3 className="font-display font-semibold text-foreground">{tCommon("favorites")}</h3>
            </div>
            <div className="space-y-2">
              {favoriteBooks.map((book) => (
                <DisplayBookCard
                  key={book.id}
                  book={book}
                  onClick={() => router.push(`/items/${book.id}`)}
                  isFavorite
                  unknownAuthorText={tCommon("unknownAuthor")}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
