"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ChevronRight, Check, X, Clock, Eye } from "lucide-react";
import { RichTextRenderer } from "@/components/ui/rich-text-editor";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/loading-spinner";
import { formatDateRange, isEventPastDeadline } from "@/lib/date-utils";
import type { StoreEvent, User } from "@/types/type";
import { session } from "@/lib/session";
import { useTranslations } from "next-intl";

// Generate dicebear avatar URL based on user ID or name
function getDicebearAvatar(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

// Slide to Attend Button Component
function SlideToAttendButton({ 
  onComplete, 
  isLoading 
}: { 
  onComplete: () => void;
  isLoading: boolean;
}) {
  const t = useTranslations("events");
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateWidth = () => {
      if (trackRef.current) {
        setTrackWidth(trackRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!trackRef.current || !thumbRef.current || isLoading) return;
    
    const trackRect = trackRef.current.getBoundingClientRect();
    const thumbWidth = thumbRef.current.offsetWidth;
    const maxDrag = trackRect.width - thumbWidth;
    const currentX = clientX - trackRect.left - thumbWidth / 2;
    const clampedX = Math.max(0, Math.min(currentX, maxDrag));
    const newProgress = clampedX / maxDrag;
    
    setProgress(newProgress);
    
    if (newProgress >= 0.95 && !isCompleted) {
      setIsCompleted(true);
      setProgress(1);
      onComplete();
    }
  }, [isLoading, isCompleted, onComplete]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isLoading || isCompleted) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = () => {
    if (isLoading || isCompleted) return;
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
      if (!isCompleted && progress < 0.95) {
        setProgress(0);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleEnd);
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleEnd);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleEnd);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, isCompleted, progress, handleMove]);

  const thumbTranslateX = progress * Math.max(0, trackWidth - 56);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className={cn(
          "relative h-14 rounded-full overflow-hidden transition-colors",
          isCompleted ? "bg-emerald-100" : "bg-zinc-100"
        )}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-all duration-75",
            isCompleted ? "bg-emerald-200" : "bg-zinc-200"
          )}
          style={{ width: `${progress * 100}%` }}
        />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className={cn(
              "text-sm font-medium transition-opacity",
              isCompleted ? "text-emerald-700" : "text-zinc-500"
            )}
            style={{ opacity: 1 - progress * 0.5 }}
          >
            {isCompleted ? "Event Joined!" : t("attendEventFree")}
          </span>
        </div>

        <div
          ref={thumbRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={cn(
            "absolute top-1 bottom-1 left-1 w-12 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-all",
            isCompleted 
              ? "bg-emerald-500 text-white" 
              : "bg-white shadow-md border border-zinc-200 text-zinc-600",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          style={{
            transform: `translateX(${thumbTranslateX}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
        >
          {isCompleted ? (
            <Check size={20} />
          ) : (
            <ChevronRight size={20} />
          )}
        </div>
      </div>
    </div>
  );
}

// Avatar component with dicebear fallback
function UserAvatar({ 
  user, 
  size = "md" 
}: { 
  user: User; 
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const sizePx = {
    sm: 28,
    md: 36,
    lg: 48,
  };

  const avatarUrl = user.avatar || getDicebearAvatar(user.id || user.name);

  return (
    <Image
      src={avatarUrl}
      alt={user.name}
      width={sizePx[size]}
      height={sizePx[size]}
      className={cn(
        sizeClasses[size],
        "rounded-full border-2 border-white object-cover bg-zinc-100"
      )}
      unoptimized
    />
  );
}

// Avatar stack for participants (clickable)
function ParticipantAvatars({ 
  attendees,
  onClick,
}: { 
  attendees: User[];
  onClick?: () => void;
}) {
  const t = useTranslations("events");
  const displayCount = Math.min(5, attendees.length);
  const displayedAttendees = attendees.slice(0, displayCount);
  
  return (
    <button 
      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      onClick={onClick}
    >
      <div className="flex -space-x-2">
        {displayedAttendees.map((attendee) => (
          <UserAvatar key={attendee.id} user={attendee} />
        ))}
        {attendees.length > 5 && (
          <div className="w-9 h-9 rounded-full bg-zinc-300 border-2 border-white flex items-center justify-center">
            <span className="text-xs font-medium text-zinc-600">
              +{attendees.length - 5}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-zinc-500">{t("participants")}</span>
        {attendees.length > 0 && (
          <ChevronRight size={14} className="text-zinc-400" />
        )}
      </div>
    </button>
  );
}

// Attendee row in the drawer list
function AttendeeRow({ 
  user, 
  onView 
}: { 
  user: User; 
  onView: () => void;
}) {
  const tCommon = useTranslations("common");
  const avatarUrl = user.avatar || getDicebearAvatar(user.id || user.name);

  return (
    <div className="flex items-center gap-3 py-3">
      <Image
        src={avatarUrl}
        alt={user.name}
        width={40}
        height={40}
        className="w-10 h-10 rounded-full border border-zinc-200 object-cover bg-zinc-100"
        unoptimized
      />
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-zinc-900 text-sm truncate">
          {user.name}
        </h4>
        {user.location && (
          <p className="text-xs text-zinc-500 truncate">{user.location}</p>
        )}
      </div>
      <Button
        onClick={onView}
        variant="outline"
        size="sm"
        className="rounded-xl text-xs h-8 px-3 gap-1 border-zinc-200"
      >
        <Eye size={12} />
        {tCommon("view")}
      </Button>
    </div>
  );
}

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const eventId = params.id as string;

  const [event, setEvent] = useState<StoreEvent | null>(null);
  const [hostUsers, setHostUsers] = useState<User[]>([]);
  const [attendeeUsers, setAttendeeUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);
  const [showSuccessDrawer, setShowSuccessDrawer] = useState(false);
  const [showFailureDrawer, setShowFailureDrawer] = useState(false);
  const [showAttendeesDrawer, setShowAttendeesDrawer] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchAttendees = useCallback(async (attendeeIds: string[]) => {
    if (attendeeIds.length === 0) {
      setAttendeeUsers([]);
      return;
    }
    try {
      const response = await fetch(`/api/users?ids=${attendeeIds.join(",")}`);
      if (response.ok) {
        const users = await response.json();
        setAttendeeUsers(users);
      }
    } catch (error) {
      console.error("Failed to fetch attendees:", error);
    }
  }, []);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`/api/events?id=${eventId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch event");
        }
        const eventData = await response.json();
        setEvent(eventData);

        if (eventData.hosts && eventData.hosts.length > 0) {
          const usersResponse = await fetch(`/api/users?ids=${eventData.hosts.join(",")}`);
          if (usersResponse.ok) {
            const users = await usersResponse.json();
            setHostUsers(users);
          }
        }

        if (eventData.attendees && eventData.attendees.length > 0) {
          await fetchAttendees(eventData.attendees);
        }
      } catch (error) {
        console.error("Failed to fetch event:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, fetchAttendees]);

  const handleAttend = async () => {
    if (!event || isAttending) return;
    
    setIsAttending(true);
    try {
      const userId = session.getItem("userId");
      const accessToken = session.getItem("accessToken");
      
      if (!userId || !accessToken) {
        setErrorMessage("Please log in to attend events.");
        setShowFailureDrawer(true);
        return;
      }

      const response = await fetch("/api/events/attend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          eventId: event.id,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to attend event");
      }

      const eventResponse = await fetch(`/api/events?id=${eventId}`);
      if (eventResponse.ok) {
        const updatedEvent = await eventResponse.json();
        setEvent(updatedEvent);
        if (updatedEvent.attendees && updatedEvent.attendees.length > 0) {
          await fetchAttendees(updatedEvent.attendees);
        }
      }

      setShowSuccessDrawer(true);
    } catch (error) {
      console.error("Failed to attend event:", error);
      const message = error instanceof Error ? error.message : "Failed to attend event";
      setErrorMessage(message);
      setShowFailureDrawer(true);
    } finally {
      setIsAttending(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessDrawer(false);
    router.back();
  };

  const handleCloseFailure = () => {
    setShowFailureDrawer(false);
    setErrorMessage("");
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <p className="text-zinc-600 mb-4">{t("eventNotFound")}</p>
        <Button onClick={() => router.back()} variant="outline">
          {tCommon("goBack")}
        </Button>
      </div>
    );
  }

  const hostNames = hostUsers.length > 0 
    ? hostUsers.map(h => h.name).join(", ")
    : event.hosts.length > 0 
      ? `${event.hosts.length} ${t("hosts")}`
      : t("noHosts");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Cover Image Area */}
      <div className="relative w-full aspect-[4/5] bg-zinc-100 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm border border-zinc-200/50"
        >
          <ArrowLeft size={20} className="text-zinc-800" />
        </button>

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
            <p className="text-zinc-500 text-center px-8">
              {t("posterAreaPlaceholder")}
            </p>
          </div>
        )}
      </div>

      {/* Content Sheet */}
      <div className="relative -mt-6 bg-white rounded-t-3xl flex-1 flex flex-col">
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-12 h-1.5 rounded-full bg-zinc-200" />
        </div>

        <div className="px-5 pb-6 flex-1 flex flex-col">
          <div className="mb-4">
            <h1 className="font-display text-xl font-bold text-zinc-900 mb-2">
              {event.title}
            </h1>
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>{formatDateRange(event.startDate, event.endDate)}</span>
              <span>{t("hostsLabel")}{hostNames}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <ParticipantAvatars 
              attendees={attendeeUsers} 
              onClick={() => attendeeUsers.length > 0 && setShowAttendeesDrawer(true)}
            />
            
            <button
              disabled
              className="px-4 py-2.5 bg-zinc-100 rounded-xl text-sm font-medium text-zinc-400 cursor-not-allowed"
            >
              {t("mapButton")}
            </button>
          </div>

          <div className="flex-1 mb-6">
            <h2 className="font-display text-base font-semibold text-zinc-900 mb-2">
              {t("aboutEvent")}
            </h2>
            {event.description ? (
              <div className="font-serif">
                <RichTextRenderer content={event.description} />
              </div>
            ) : (
              <p className="font-serif text-sm text-zinc-600 leading-relaxed">
                {t("noDescription")}
              </p>
            )}
          </div>

          <div className="mt-auto pb-safe">
            {/* Show different UI based on event status */}
            {event.status === 'finished' || isEventPastDeadline(event.endDate) ? (
              <div className="h-14 rounded-full bg-zinc-100 flex items-center justify-center gap-2">
                <Clock size={18} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-500">{t("eventEnded")}</span>
              </div>
            ) : event.status === 'cancelled' ? (
              <div className="h-14 rounded-full bg-zinc-100 flex items-center justify-center gap-2">
                <X size={18} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-500">{t("eventCancelled")}</span>
              </div>
            ) : event.status === 'proposed' ? (
              <div className="h-14 rounded-full bg-sky-50 flex items-center justify-center gap-2">
                <Clock size={18} className="text-sky-400" />
                <span className="text-sm font-medium text-sky-600">{t("pendingApproval")}</span>
              </div>
            ) : (
              <SlideToAttendButton 
                onComplete={handleAttend}
                isLoading={isAttending}
              />
            )}
          </div>
        </div>
      </div>

      {/* Success Drawer */}
      <Drawer open={showSuccessDrawer} onOpenChange={setShowSuccessDrawer}>
        <DrawerContent className="bg-white">
          <DrawerHeader className="text-center pb-0">
            <DrawerTitle className="text-xl text-zinc-900">
              {event.title}
            </DrawerTitle>
            <DrawerDescription className="text-zinc-500 mt-1">
              {formatDateRange(event.startDate, event.endDate)}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 py-8">
            <div className="aspect-[4/3] bg-zinc-100 rounded-2xl flex items-center justify-center border border-zinc-200">
              <div className="text-center px-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Check size={32} className="text-emerald-600" />
                </div>
                <p className="text-zinc-500 font-medium">
                  Display Event Joined Vector Art
                </p>
              </div>
            </div>
          </div>

          <DrawerFooter className="pt-0">
            <Button
              onClick={handleCloseSuccess}
              className="w-full h-14 rounded-2xl bg-zinc-100 text-zinc-700 font-medium hover:bg-zinc-200 text-base"
              variant="secondary"
            >
              {tCommon("close")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Failure Drawer */}
      <Drawer open={showFailureDrawer} onOpenChange={setShowFailureDrawer}>
        <DrawerContent className="bg-white">
          <DrawerHeader className="text-center pb-0">
            <DrawerTitle className="text-xl text-zinc-900">
              {t("unableToAttend")}
            </DrawerTitle>
            <DrawerDescription className="text-zinc-500 mt-1">
              {event.title}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 py-8">
            <div className="aspect-[4/3] bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
              <div className="text-center px-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
                  <X size={32} className="text-rose-600" />
                </div>
                <p className="text-rose-600 font-medium mb-2">
                  {t("attendanceFailed")}
                </p>
                <p className="text-zinc-500 text-sm">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>

          <DrawerFooter className="pt-0">
            <Button
              onClick={handleCloseFailure}
              className="w-full h-14 rounded-2xl bg-zinc-100 text-zinc-700 font-medium hover:bg-zinc-200 text-base"
              variant="secondary"
            >
              {tCommon("close")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Attendees List Drawer */}
      <Drawer open={showAttendeesDrawer} onOpenChange={setShowAttendeesDrawer}>
        <DrawerContent className="bg-white max-h-[70vh]">
          <DrawerHeader className="text-center pb-0">
            <DrawerTitle className="text-lg text-zinc-900">
              {t("participants")}
            </DrawerTitle>
            <DrawerDescription className="text-zinc-500 mt-0.5">
              {attendeeUsers.length} {attendeeUsers.length !== 1 ? t("attendees") : t("attendee")}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-6 py-2 overflow-y-auto flex-1">
            <div className="divide-y divide-zinc-100">
              {attendeeUsers.map((attendee) => (
                <AttendeeRow
                  key={attendee.id}
                  user={attendee}
                  onView={() => {
                    setShowAttendeesDrawer(false);
                    router.push(`/members/${attendee.id}`);
                  }}
                />
              ))}
            </div>
          </div>

          <DrawerFooter className="pt-0">
            <Button
              onClick={() => setShowAttendeesDrawer(false)}
              className="w-full h-12 rounded-2xl bg-zinc-100 text-zinc-700 font-medium hover:bg-zinc-200 text-sm"
              variant="secondary"
            >
              {tCommon("close")}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
