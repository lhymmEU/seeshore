"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Calendar, MapPin, Users, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatTime, formatDateShort, getNowInGMT8 } from "@/lib/date-utils";
import type { StoreEvent } from "@/types/type";
import { session } from "@/lib/session";
import { useTranslations } from "next-intl";

// Extract plain text from rich text JSON for preview
function extractPlainText(content: string): string {
  if (!content) return "";
  
  try {
    const parsed = JSON.parse(content);
    return extractTextFromNode(parsed);
  } catch {
    // If it's not JSON, return as-is
    return content;
  }
}

function extractTextFromNode(node: unknown): string {
  if (!node || typeof node !== 'object') return "";
  
  const n = node as { type?: string; text?: string; content?: unknown[] };
  
  if (n.type === "text" && typeof n.text === "string") {
    return n.text;
  }
  
  if (Array.isArray(n.content)) {
    return n.content.map(extractTextFromNode).join(" ");
  }
  
  return "";
}

// Compact event card for horizontal scroll
function EventScrollCard({
  event,
  onClick,
}: {
  event: StoreEvent;
  onClick: () => void;
}) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const attendeeCount = event.attendees?.length || 0;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-44 bg-secondary rounded-2xl overflow-hidden border border-border hover:border-border transition-all active:scale-[0.98] text-left"
    >
      {event.cover ? (
        <div className="h-28 w-full relative">
          <Image
            src={event.cover}
            alt={event.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <div className="h-28 w-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
          <span className="text-muted-foreground/70 text-sm">{t("eventPicture")}</span>
        </div>
      )}

      <div className="p-3 space-y-1.5">
        <h3 className="font-display font-semibold text-foreground text-sm leading-tight line-clamp-1">
          {event.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          {formatDateShort(event.startDate)} {formatTime(event.startDate)} – {formatTime(event.endDate)}
        </p>
        
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center">
            <div className="flex -space-x-1.5">
              {[...Array(Math.min(1, attendeeCount))].map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full bg-muted border border-background"
                />
              ))}
            </div>
            {attendeeCount > 0 && (
              <span className="text-xs text-muted-foreground/70 ml-1.5">+{attendeeCount}</span>
            )}
          </div>
          <span className="text-xs font-medium text-muted-foreground">{tCommon("view")}</span>
        </div>
      </div>
    </button>
  );
}

// Featured event card (larger, for bottom section)
function FeaturedEventCard({
  event,
  onClick,
}: {
  event: StoreEvent;
  onClick: () => void;
}) {
  const t = useTranslations("events");
  const attendeeCount = event.attendees?.length || 0;

  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 rounded-3xl overflow-hidden border border-orange-100 hover:border-orange-200 transition-all active:scale-[0.99] text-left"
    >
      <div className="relative h-48 w-full">
        {event.cover ? (
          <Image
            src={event.cover}
            alt={event.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
            <div className="text-center">
              <Sparkles size={32} className="text-orange-300 mx-auto mb-2" />
              <span className="text-orange-400 text-sm font-medium">{t("featuredEvent")}</span>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-background/90 backdrop-blur-sm rounded-full flex items-center gap-1.5">
          <Sparkles size={12} className="text-orange-500" />
          <span className="text-xs font-semibold text-foreground">{t("closestEvent")}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-display font-bold text-foreground text-lg leading-tight line-clamp-2">
            {event.title}
          </h3>
          {event.description && (
            <p className="font-serif text-sm text-muted-foreground mt-1 line-clamp-2">
              {extractPlainText(event.description)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-orange-400" />
            <span>{formatDate(event.startDate)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-orange-400" />
              <span className="truncate max-w-[150px]">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-orange-400" />
            <span>{attendeeCount} {t("attending")}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex -space-x-2">
            {[...Array(Math.min(1, attendeeCount))].map((_, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-200 to-amber-100 border-2 border-background"
              />
            ))}
          </div>
          <div className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
            {t("viewEvent")}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function EventsPage() {
  const router = useRouter();
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const [events, setEvents] = useState<StoreEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchEventsData = async () => {
      try {
        const storeId = session.getItem("selectedStore");
        if (!storeId) {
          console.error("No store selected");
          setIsLoading(false);
          return;
        }
        
        // Fetch all events (including past events) for the store
        const response = await fetch(`/api/events?storeId=${storeId}`);
        if (response.ok) {
          const data = await response.json();
          setEvents(data);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventsData();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        !searchQuery ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        extractPlainText(event.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [events, searchQuery]);

  const closestEvent = useMemo(() => {
    // Use GMT+8 timezone for consistency with deadline checks
    const now = getNowInGMT8();
    // Find the first upcoming "open" event (start date >= now and status is open)
    // Only show live events that haven't started yet in the featured section
    return events.find(event => 
      event.status === 'open' && new Date(event.startDate) >= now
    ) || null;
  }, [events]);

  const scrollEvents = useMemo(() => {
    // If there's no closest event, show all filtered events in the scroll section
    if (!closestEvent) return filteredEvents;
    // Otherwise, exclude the closest event from the scroll section (it's featured separately)
    return filteredEvents.filter(event => event.id !== closestEvent.id);
  }, [filteredEvents, closestEvent]);

  const handleViewEvent = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Search Bar Section */}
      <div className="px-4 pt-12 pb-4 space-y-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Event Search Bar"
        />
      </div>

      <div className="px-4 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">{t("title")}</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground/70 transition-colors">
            {tCommon("seeMore")}
          </button>
        </div>

        <section>
          {isLoading ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-44 h-52 bg-muted rounded-2xl animate-pulse"
                />
              ))}
            </div>
          ) : scrollEvents.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {scrollEvents.map((event) => (
                <EventScrollCard
                  key={event.id}
                  event={event}
                  onClick={() => handleViewEvent(event.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 bg-secondary rounded-xl text-muted-foreground/70 text-sm">
              {t("noUpcoming")}
            </div>
          )}
        </section>

        <section className="pt-2">
          <h2 className="font-display text-base font-semibold text-foreground mb-3">
            {t("closestEvent")}
          </h2>
          {isLoading ? (
            <div className="w-full h-80 bg-muted rounded-3xl animate-pulse" />
          ) : closestEvent ? (
            <FeaturedEventCard
              event={closestEvent}
              onClick={() => handleViewEvent(closestEvent.id)}
            />
          ) : (
            <div className="bg-secondary rounded-3xl">
              <EmptyState
                icon={Calendar}
                title={t("noEventsScheduled")}
                message={t("checkBackLater")}
              />
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
