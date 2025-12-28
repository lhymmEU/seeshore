"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  Plus,
  Sparkles,
  Radio,
  AlertTriangle,
  Loader2,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { EventCard } from "@/components/events";
import { fetchEvents, deleteEvent } from "@/data/supabase";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import type { StoreEvent } from "@/types/type";

type EventFilter = "live" | "proposed";

export default function EventsManagePage() {
  const router = useRouter();
  const [filter, setFilter] = useState<EventFilter>("live");
  const [events, setEvents] = useState<StoreEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDrawerOpen, setDeleteDrawerOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<StoreEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const refetchEvents = useCallback(async () => {
    const storeId = sessionStorage.getItem("selectedStore");
    if (!storeId) return;

    try {
      const allEvents = await fetchEvents({ storeId });
      setEvents(allEvents);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  }, []);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const role = sessionStorage.getItem("userRole");
      if (role !== "owner" && role !== "assistant") {
        router.push("/");
        return;
      }

      // Check if user is owner (not just assistant)
      setIsOwner(role === "owner");

      const storeId = sessionStorage.getItem("selectedStore");
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

  const handleView = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  const handleEdit = (eventId: string) => {
    router.push(`/manage/events/${eventId}/edit`);
  };

  const handleDelete = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event) {
      setEventToDelete(event);
      setDeleteDrawerOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);
    try {
      await deleteEvent(eventToDelete.id);
      setDeleteDrawerOpen(false);
      setEventToDelete(null);
      // Refetch events from database
      await refetchEvents();
    } catch (error) {
      console.error("Failed to delete event:", error);
      alert("Failed to delete event. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteDrawerOpen(false);
    setEventToDelete(null);
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
                onClick={() => handleView(event.id)}
                onEdit={() => handleEdit(event.id)}
                onDelete={() => handleDelete(event.id)}
                showActions={isOwner}
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

      {/* Delete Confirmation Drawer */}
      <Drawer open={deleteDrawerOpen} onOpenChange={setDeleteDrawerOpen}>
        <DrawerContent className="bg-white">
          <DrawerHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-3">
              <AlertTriangle size={28} className="text-rose-600" />
            </div>
            <DrawerTitle className="text-xl text-zinc-900">
              Delete Event?
            </DrawerTitle>
            <DrawerDescription className="text-zinc-500 mt-2">
              Are you sure you want to delete{" "}
              <span className="font-medium text-zinc-700">
                &ldquo;{eventToDelete?.title}&rdquo;
              </span>
              ?
            </DrawerDescription>
          </DrawerHeader>

          {/* Warning Box */}
          <div className="px-4 pb-4">
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-rose-800">
                This action cannot be undone
              </p>
              <ul className="text-sm text-rose-700 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  All event details will be permanently removed
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  {eventToDelete?.attendees?.length || 0} attendees will lose their registration
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  Event history and data will be lost
                </li>
              </ul>
            </div>
          </div>

          <DrawerFooter className="pt-2">
            <button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="w-full py-4 rounded-2xl bg-rose-600 text-white font-medium hover:bg-rose-700 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  Yes, Delete Event
                </>
              )}
            </button>
            <button
              onClick={cancelDelete}
              disabled={isDeleting}
              className="w-full py-4 rounded-2xl bg-zinc-100 text-zinc-700 font-medium hover:bg-zinc-200 transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              Cancel
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
