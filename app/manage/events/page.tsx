"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Plus,
  Sparkles,
  Radio,
  AlertTriangle,
  Loader2,
  Trash2
} from "lucide-react";
import { useTranslations } from "next-intl";
import { BottomNav } from "@/components/navigation";
import { EventCard } from "@/components/events";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { TabSwitcher } from "@/components/ui/tab-switcher";
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
import { session } from "@/lib/session";

type EventFilter = "live" | "proposed";

export default function EventsManagePage() {
  const router = useRouter();
  const t = useTranslations("manage");
  const tCommon = useTranslations("common");
  const [filter, setFilter] = useState<EventFilter>("live");
  const [events, setEvents] = useState<StoreEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDrawerOpen, setDeleteDrawerOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<StoreEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  const refetchEvents = useCallback(async () => {
    const storeId = session.getItem("selectedStore");
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
      const role = session.getItem("userRole");
      if (role !== "owner" && role !== "assistant") {
        router.push("/");
        return;
      }

      setIsOwner(role === "owner");

      const storeId = session.getItem("selectedStore");
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
    return <PageLoader />;
  }

  const liveCount = events.filter(e => e.status === "open" || e.status === "full").length;
  const proposedCount = events.filter(e => e.status === "proposed").length;

  const tabs = [
    { id: "live", label: "Live Events", icon: Radio, iconActiveClassName: "text-emerald-400", count: liveCount },
    { id: "proposed", label: "Proposed", icon: Sparkles, iconActiveClassName: "text-sky-400", count: proposedCount, disabled: true },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader title={t("manageEvents")} />

      <div className="px-4 pt-6 space-y-6">
        <TabSwitcher
          tabs={tabs}
          activeTab={filter}
          onChange={(tab) => setFilter(tab as EventFilter)}
        />

        {filteredEvents.length === 0 ? (
          <div className="bg-secondary rounded-2xl p-12 border border-border">
            <EmptyState
              icon={Calendar}
              title={filter === "live" ? t("noLiveEvents") : t("noProposedEvents")}
              message={filter === "live" 
                ? t("createOrApproveEvent")
                : t("noEventProposals")}
            />
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
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors active:scale-[0.98]"
        >
          <Plus size={20} />
          {t("createEvent")}
        </button>
      </div>

      <BottomNav />

      {/* Delete Confirmation Drawer */}
      <Drawer open={deleteDrawerOpen} onOpenChange={setDeleteDrawerOpen}>
        <DrawerContent className="bg-background">
          <DrawerHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-3">
              <AlertTriangle size={28} className="text-rose-600" />
            </div>
            <DrawerTitle className="text-xl text-foreground font-display">
              {t("deleteEventConfirm")}
            </DrawerTitle>
            <DrawerDescription className="text-muted-foreground mt-2">
              {t("confirmDeleteEvent", { title: eventToDelete?.title ?? "" })}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4">
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-rose-800">
                {t("actionCannotBeUndone")}
              </p>
              <ul className="text-sm text-rose-700 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  {t("eventDetailsRemoved")}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  {eventToDelete?.attendees?.length || 0} {t("attendeesLoseRegistration")}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  {t("eventHistoryLost")}
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
                  {t("deleting")}
                </>
              ) : (
                <>
                  <Trash2 size={18} />
                  {t("yesDeleteEvent")}
                </>
              )}
            </button>
            <button
              onClick={cancelDelete}
              disabled={isDeleting}
              className="w-full py-4 rounded-2xl bg-muted text-foreground/70 font-medium hover:bg-muted transition-colors active:scale-[0.98] disabled:opacity-50"
            >
              {tCommon("cancel")}
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
