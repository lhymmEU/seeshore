"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Edit2, 
  Trash2, 
  Plus,
  Sparkles,
  Radio
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { fetchEvents } from "@/data/supabase";
import type { StoreEvent } from "@/types/type";

type EventFilter = "live" | "proposed";

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
  });
}

function getStatusBadge(status: StoreEvent["status"]) {
  const statusConfig = {
    open: { label: "Open", className: "bg-emerald-100 text-emerald-700" },
    full: { label: "Full", className: "bg-amber-100 text-amber-700" },
    proposed: { label: "Proposed", className: "bg-sky-100 text-sky-700" },
    cancelled: { label: "Cancelled", className: "bg-zinc-100 text-zinc-500" },
    rejected: { label: "Rejected", className: "bg-rose-100 text-rose-700" },
    finished: { label: "Finished", className: "bg-zinc-100 text-zinc-600" },
  };
  
  return statusConfig[status] || { label: status, className: "bg-zinc-100 text-zinc-600" };
}

function EventCard({ 
  event, 
  onEdit, 
  onDelete 
}: { 
  event: StoreEvent; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  const statusBadge = getStatusBadge(event.status);
  
  return (
    <div className="bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100">
      {/* Event Cover */}
      {event.cover ? (
        <div className="h-32 w-full relative">
          <img
            src={event.cover}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className={cn(
            "absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium",
            statusBadge.className
          )}>
            {statusBadge.label}
          </span>
        </div>
      ) : (
        <div className="h-24 w-full bg-gradient-to-br from-zinc-200 to-zinc-100 flex items-center justify-center relative">
          <Calendar size={32} className="text-zinc-400" />
          <span className={cn(
            "absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium",
            statusBadge.className
          )}>
            {statusBadge.label}
          </span>
        </div>
      )}
      
      {/* Event Info */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-zinc-900 text-lg leading-tight line-clamp-2">
          {event.title}
        </h3>
        
        {event.description && (
          <p className="text-sm text-zinc-500 line-clamp-2">
            {event.description}
          </p>
        )}
        
        <div className="space-y-2">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Calendar size={14} className="text-zinc-400 shrink-0" />
            <span>
              {formatDate(event.startDate)}
              {event.startDate && (
                <span className="text-zinc-400 ml-1">
                  {formatTime(event.startDate)}
                </span>
              )}
            </span>
          </div>
          
          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <MapPin size={14} className="text-zinc-400 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          {/* Attendees */}
          <div className="flex items-center gap-2 text-sm text-zinc-600">
            <Users size={14} className="text-zinc-400 shrink-0" />
            <span>{event.attendees?.length || 0} attending</span>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-200/80 text-zinc-700 font-medium text-sm hover:bg-zinc-300/80 transition-colors active:scale-[0.98]"
          >
            <Edit2 size={16} />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-100 text-rose-600 font-medium text-sm hover:bg-rose-200 transition-colors active:scale-[0.98]"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventsManagePage() {
  const router = useRouter();
  const [filter, setFilter] = useState<EventFilter>("live");
  const [events, setEvents] = useState<StoreEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const role = sessionStorage.getItem("userRole");
      if (role !== "owner" && role !== "assistant") {
        router.push("/");
        return;
      }

      const storeId = sessionStorage.getItem("storeId");
      if (!storeId) {
        console.error("No store ID found");
        setIsLoading(false);
        return;
      }

      try {
        const allEvents = await fetchEvents({ storeId });
        setEvents(allEvents);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  // Filter events based on selected tab
  const filteredEvents = events.filter((event) => {
    if (filter === "live") {
      return event.status === "open" || event.status === "full";
    }
    return event.status === "proposed";
  });

  const handleEdit = (eventId: string) => {
    // TODO: Implement edit functionality
    console.log("Edit event:", eventId);
  };

  const handleDelete = (eventId: string) => {
    // TODO: Implement delete functionality
    console.log("Delete event:", eventId);
  };

  const handleCreateEvent = () => {
    router.push("/manage/events/create");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  const liveCount = events.filter(e => e.status === "open" || e.status === "full").length;
  const proposedCount = events.filter(e => e.status === "proposed").length;

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-zinc-800" />
          </button>
          <h1 className="flex-1 text-center font-semibold text-zinc-900 pr-8">
            Manage Events
          </h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Filter Toggle */}
        <div className="flex bg-zinc-100 rounded-full p-1">
          <button
            onClick={() => setFilter("live")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all",
              filter === "live"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-800"
            )}
          >
            <Radio size={14} className={filter === "live" ? "text-emerald-400" : ""} />
            Live Events
            {liveCount > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                filter === "live" ? "bg-white/20" : "bg-zinc-200"
              )}>
                {liveCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("proposed")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all",
              filter === "proposed"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-800"
            )}
          >
            <Sparkles size={14} className={filter === "proposed" ? "text-sky-400" : ""} />
            Proposed
            {proposedCount > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                filter === "proposed" ? "bg-white/20" : "bg-zinc-200"
              )}>
                {proposedCount}
              </span>
            )}
          </button>
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="bg-zinc-50 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 border border-zinc-100">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center">
              <Calendar size={28} className="text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-zinc-600 font-medium">
                No {filter === "live" ? "live" : "proposed"} events
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                {filter === "live" 
                  ? "Create an event or approve a proposed one"
                  : "No event proposals pending review"}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onEdit={() => handleEdit(event.id)}
                onDelete={() => handleDelete(event.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-30">
        <button
          onClick={handleCreateEvent}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-zinc-900 text-white font-medium shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 transition-colors active:scale-[0.98]"
        >
          <Plus size={20} />
          Create Event
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

