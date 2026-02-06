"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Calendar,
  BookOpen,
  Heart,
  Check,
  Eye,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import {
  fetchUser,
  fetchBooksByIds,
  fetchEventsByIds,
} from "@/data/supabase";
import { formatDate } from "@/lib/date-utils";
import { session } from "@/lib/session";
import type { User, Book, StoreEvent, DisplayConfig } from "@/types/type";

type SetupTab = "events" | "borrowed" | "favorites";

function SelectableEventCard({
  event,
  isSelected,
  onToggle,
}: {
  event: StoreEvent;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all text-left w-full",
        isSelected
          ? "border-zinc-900 bg-zinc-50"
          : "border-zinc-100 bg-white hover:border-zinc-200"
      )}
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 relative">
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
            <Calendar size={16} className="text-zinc-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-zinc-900 text-sm truncate">
          {event.title}
        </h4>
        <p className="text-xs text-zinc-500">{formatDate(event.startDate)}</p>
      </div>
      <div
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          isSelected
            ? "bg-zinc-900 border-zinc-900"
            : "border-zinc-300 bg-white"
        )}
      >
        {isSelected && <Check size={14} className="text-white" />}
      </div>
    </button>
  );
}

function SelectableBookCard({
  book,
  isSelected,
  onToggle,
  variant = "default",
}: {
  book: Book;
  isSelected: boolean;
  onToggle: () => void;
  variant?: "default" | "favorite";
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-all text-left w-full",
        isSelected
          ? "border-zinc-900 bg-zinc-50"
          : "border-zinc-100 bg-white hover:border-zinc-200"
      )}
    >
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 relative">
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
            <BookOpen size={16} className="text-zinc-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-zinc-900 text-sm truncate">
          {book.title}
        </h4>
        <p className="text-xs text-zinc-500 truncate">
          {book.author || "Unknown author"}
        </p>
      </div>
      {variant === "favorite" && (
        <Heart size={14} className="text-rose-500 fill-rose-500 flex-shrink-0" />
      )}
      <div
        className={cn(
          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
          isSelected
            ? "bg-zinc-900 border-zinc-900"
            : "border-zinc-300 bg-white"
        )}
      >
        {isSelected && <Check size={14} className="text-white" />}
      </div>
    </button>
  );
}

export default function DisplaySetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<SetupTab>("events");

  // Data for selection
  const [allEvents, setAllEvents] = useState<StoreEvent[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);

  // Selected items
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [selectedFavorites, setSelectedFavorites] = useState<Set<string>>(
    new Set()
  );

  // Bio
  const [bio, setBio] = useState("");

  // Display enabled
  const [displayEnabled, setDisplayEnabled] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userId = session.getItem("userId");
        if (!userId) {
          router.push("/");
          return;
        }

        const userData = await fetchUser(userId);
        setUser(userData);

        // Load existing display config
        if (userData.displayConfig) {
          const config = userData.displayConfig;
          setDisplayEnabled(config.enabled);
          setBio(config.bio || "");
          setSelectedEvents(new Set(config.selectedEvents || []));
          setSelectedBooks(new Set(config.selectedBooks || []));
          setSelectedFavorites(new Set(config.selectedFavorites || []));
        }

        // Fetch all user's events (attended + hosted)
        const allEventIds = [
          ...(userData.attendedEvents || []),
          ...(userData.hostedEvents || []),
        ];
        const uniqueEventIds = [...new Set(allEventIds)];
        if (uniqueEventIds.length > 0) {
          const events = await fetchEventsByIds(uniqueEventIds);
          setAllEvents(events);
        }

        // Fetch borrowed books
        if (userData.borrowed && userData.borrowed.length > 0) {
          const books = await fetchBooksByIds(userData.borrowed);
          setBorrowedBooks(books);
        }

        // Fetch favorite books
        if (userData.favoriteBooks && userData.favoriteBooks.length > 0) {
          const books = await fetchBooksByIds(userData.favoriteBooks);
          setFavoriteBooks(books);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [router]);

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBook = (id: string) => {
    setSelectedBooks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setSelectedFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const accessToken = session.getItem("accessToken");
      if (!accessToken) {
        alert("Please log in again.");
        return;
      }

      const displayConfig: DisplayConfig = {
        enabled: displayEnabled,
        bio: bio.trim() || undefined,
        selectedEvents: [...selectedEvents],
        selectedBooks: [...selectedBooks],
        selectedFavorites: [...selectedFavorites],
      };

      const response = await fetch("/api/users/display", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ displayConfig }),
      });

      if (!response.ok) {
        throw new Error("Failed to save display config");
      }

      router.back();
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save display settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalSelected =
    selectedEvents.size + selectedBooks.size + selectedFavorites.size;

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-32">
      <PageHeader title="Display Page Setup" />

      <div className="px-4 pt-6 space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900">
                Enable Display Page
              </h3>
              <p className="text-sm text-zinc-500 mt-0.5">
                Other members can view your page
              </p>
            </div>
            <button
              onClick={() => setDisplayEnabled(!displayEnabled)}
              className={cn(
                "relative w-12 h-7 rounded-full transition-colors",
                displayEnabled ? "bg-zinc-900" : "bg-zinc-300"
              )}
            >
              <div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform"
                style={{
                  transform: displayEnabled ? "translateX(22px)" : "translateX(2px)",
                }}
              />
            </button>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-100">
          <h3 className="font-semibold text-zinc-900 mb-3">About Me</h3>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a short bio to introduce yourself..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-zinc-50 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300 resize-none placeholder:text-zinc-400"
          />
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-1.5 border border-zinc-100 flex">
          <button
            onClick={() => setActiveTab("events")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
              activeTab === "events"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <Calendar size={16} />
            <span>Events</span>
            {selectedEvents.size > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                activeTab === "events" ? "bg-white/20" : "bg-zinc-200"
              )}>
                {selectedEvents.size}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("borrowed")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
              activeTab === "borrowed"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <BookOpen size={16} />
            <span>Borrowed</span>
            {selectedBooks.size > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                activeTab === "borrowed" ? "bg-white/20" : "bg-zinc-200"
              )}>
                {selectedBooks.size}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
              activeTab === "favorites"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <Heart size={16} />
            <span>Favorites</span>
            {selectedFavorites.size > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                activeTab === "favorites" ? "bg-white/20" : "bg-zinc-200"
              )}>
                {selectedFavorites.size}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {activeTab === "events" && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900">
                  Select Events to Display
                </h3>
                <span className="text-xs text-zinc-500">
                  {allEvents.length} available
                </span>
              </div>
              {allEvents.length > 0 ? (
                <div className="space-y-2">
                  {allEvents.map((event) => (
                    <SelectableEventCard
                      key={event.id}
                      event={event}
                      isSelected={selectedEvents.has(event.id)}
                      onToggle={() => toggleEvent(event.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-zinc-100">
                  <EmptyState
                    icon={Calendar}
                    title="No events yet"
                    message="Attend or host events to display them on your page"
                  />
                </div>
              )}
            </section>
          )}

          {activeTab === "borrowed" && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900">
                  Select Books to Display
                </h3>
                <span className="text-xs text-zinc-500">
                  {borrowedBooks.length} available
                </span>
              </div>
              {borrowedBooks.length > 0 ? (
                <div className="space-y-2">
                  {borrowedBooks.map((book) => (
                    <SelectableBookCard
                      key={book.id}
                      book={book}
                      isSelected={selectedBooks.has(book.id)}
                      onToggle={() => toggleBook(book.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-zinc-100">
                  <EmptyState
                    icon={BookOpen}
                    title="No borrowed books"
                    message="Borrow books to display them on your page"
                  />
                </div>
              )}
            </section>
          )}

          {activeTab === "favorites" && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900">
                  Select Favorites to Display
                </h3>
                <span className="text-xs text-zinc-500">
                  {favoriteBooks.length} available
                </span>
              </div>
              {favoriteBooks.length > 0 ? (
                <div className="space-y-2">
                  {favoriteBooks.map((book) => (
                    <SelectableBookCard
                      key={book.id}
                      book={book}
                      isSelected={selectedFavorites.has(book.id)}
                      onToggle={() => toggleFavorite(book.id)}
                      variant="favorite"
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-zinc-100">
                  <EmptyState
                    icon={Heart}
                    title="No favorite books"
                    message="Favorite some books to display them on your page"
                  />
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      {/* Sticky Bottom Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-zinc-100 p-4 z-40">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-900">
              {totalSelected} items selected
            </p>
            <p className="text-xs text-zinc-500">
              {displayEnabled ? "Display page is on" : "Display page is off"}
            </p>
          </div>
          {displayEnabled && user && (
            <Button
              onClick={() => router.push(`/members/${user.id}`)}
              variant="outline"
              className="rounded-xl"
              size="sm"
            >
              <Eye size={14} className="mr-1" />
              Preview
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 px-6"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
