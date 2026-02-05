"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { EventForm } from "@/components/events";
import { PageLoader } from "@/components/ui/loading-spinner";
import { fetchEvent } from "@/data/supabase";
import type { StoreEvent } from "@/types/type";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [event, setEvent] = useState<StoreEvent | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const eventData = await fetchEvent(eventId);
        setEvent(eventData);
      } catch (error) {
        console.error("Failed to load event:", error);
        alert("Failed to load event");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      loadEvent();
    }
  }, [eventId, router]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!event) {
    return <PageLoader />;
  }

  return (
    <EventForm
      mode="edit"
      eventId={eventId}
      initialData={event}
    />
  );
}
