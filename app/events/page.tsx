"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Calendar, MapPin, Users, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/navigation";
import type { StoreEvent } from "@/types/type";

function formatDate(dateString: string): string {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).toLowerCase();
}

function formatDateShort(dateString: string): string {
  if (!dateString) return "TBD";
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

// Compact event card for horizontal scroll
function EventScrollCard({
  event,
  onClick,
}: {
  event: StoreEvent;
  onClick: () => void;
}) {
  const attendeeCount = event.attendees?.length || 0;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-44 bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 hover:border-zinc-200 transition-all active:scale-[0.98] text-left"
    >
      {/* Event Cover */}
      {event.cover ? (
        <div className="h-28 w-full relative">
          <Image
            src={event.cover}
            alt={event.title}
            fill
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-28 w-full bg-gradient-to-br from-zinc-200 to-zinc-100 flex items-center justify-center">
          <span className="text-zinc-400 text-sm">Event Picture</span>
        </div>
      )}

      {/* Event Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-zinc-900 text-sm leading-tight line-clamp-1">
          {event.title}
        </h3>
        <p className="text-xs text-zinc-500">
          {formatDateShort(event.startDate)} {formatTime(event.startDate)} – {formatTime(event.endDate)}
        </p>
        
        {/* Bottom row */}
        <div className="flex items-center justify-between pt-1">
          {/* Attendee avatars */}
          <div className="flex items-center">
            <div className="flex -space-x-1.5">
              {[...Array(Math.min(3, attendeeCount || 3))].map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full bg-zinc-300 border border-white"
                />
              ))}
            </div>
            {attendeeCount > 0 && (
              <span className="text-xs text-zinc-400 ml-1.5">+{attendeeCount}</span>
            )}
          </div>
          <span className="text-xs font-medium text-zinc-600">View</span>
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
  const attendeeCount = event.attendees?.length || 0;

  return (
    <button
      onClick={onClick}
      className="w-full bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 rounded-3xl overflow-hidden border border-orange-100 hover:border-orange-200 transition-all active:scale-[0.99] text-left"
    >
      {/* Cover Image */}
      <div className="relative h-48 w-full">
        {event.cover ? (
          <Image
            src={event.cover}
            alt={event.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
            <div className="text-center">
              <Sparkles size={32} className="text-orange-300 mx-auto mb-2" />
              <span className="text-orange-400 text-sm font-medium">Featured Event</span>
            </div>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-1.5">
          <Sparkles size={12} className="text-orange-500" />
          <span className="text-xs font-semibold text-zinc-800">Closest Event</span>
        </div>
      </div>

      {/* Event Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-zinc-900 text-lg leading-tight line-clamp-2">
            {event.title}
          </h3>
          {event.description && (
            <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-sm text-zinc-600">
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
            <span>{attendeeCount} attending</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex -space-x-2">
            {[...Array(Math.min(5, attendeeCount || 5))].map((_, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-200 to-amber-100 border-2 border-white"
              />
            ))}
          </div>
          <div className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium">
            View Event
          </div>
        </div>
      </div>
    </button>
  );
}

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<StoreEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch events on mount
  useEffect(() => {
    const fetchEventsData = async () => {
      try {
        const storeId = sessionStorage.getItem("selectedStore");
        if (!storeId) {
          console.error("No store selected");
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(`/api/events?storeId=${storeId}&status=open`);
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

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        !searchQuery ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [events, searchQuery]);

  // Get the closest upcoming event (first event since they're sorted by start date)
  const closestEvent = useMemo(() => {
    const now = new Date();
    return events.find(event => new Date(event.startDate) >= now) || events[0];
  }, [events]);

  // Events for the horizontal scroll (excluding the featured one)
  const scrollEvents = useMemo(() => {
    if (!closestEvent) return filteredEvents;
    return filteredEvents.filter(event => event.id !== closestEvent.id);
  }, [filteredEvents, closestEvent]);

  const handleViewEvent = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Search Bar Section */}
      <div className="px-4 pt-12 pb-4 space-y-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Event Search Bar"
            className="w-full pl-11 pr-4 py-3.5 bg-zinc-100 rounded-full text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all text-base"
          />
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Events Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-800">Events</h2>
          <button className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors">
            See More
          </button>
        </div>

        {/* Horizontally Scrollable Events */}
        <section>
          {isLoading ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-44 h-52 bg-zinc-100 rounded-2xl animate-pulse"
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
            <div className="flex items-center justify-center h-40 bg-zinc-50 rounded-xl text-zinc-400 text-sm">
              No upcoming events
            </div>
          )}
        </section>

        {/* The Closest Event - Featured Section */}
        <section className="pt-2">
          <h2 className="text-base font-semibold text-zinc-800 mb-3">
            The Closest Event
          </h2>
          {isLoading ? (
            <div className="w-full h-80 bg-zinc-100 rounded-3xl animate-pulse" />
          ) : closestEvent ? (
            <FeaturedEventCard
              event={closestEvent}
              onClick={() => handleViewEvent(closestEvent.id)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 bg-zinc-50 rounded-3xl text-center">
              <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                <Calendar size={28} className="text-zinc-400" />
              </div>
              <p className="text-zinc-600 font-medium">No events scheduled</p>
              <p className="text-zinc-400 text-sm mt-1">
                Check back later for upcoming events
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

