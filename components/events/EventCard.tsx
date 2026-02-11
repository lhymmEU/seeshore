"use client";

import Image from "next/image";
import { Calendar, MapPin, Users, Edit2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/date-utils";
import type { StoreEvent } from "@/types/type";

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

function getStatusBadge(status: StoreEvent["status"], t: (key: string) => string) {
  const statusConfig = {
    open: { label: t("statusOpen"), className: "bg-emerald-100 text-emerald-700" },
    full: { label: t("statusFull"), className: "bg-amber-100 text-amber-700" },
    proposed: { label: t("statusProposed"), className: "bg-sky-100 text-sky-700" },
    cancelled: { label: t("statusCancelled"), className: "bg-muted text-muted-foreground" },
    rejected: { label: t("statusRejected"), className: "bg-rose-100 text-rose-700" },
    finished: { label: t("statusFinished"), className: "bg-muted text-muted-foreground" },
  };
  
  return statusConfig[status] || { label: status, className: "bg-muted text-muted-foreground" };
}

export interface EventCardProps {
  event: StoreEvent;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function EventCard({ 
  event, 
  onClick,
  onEdit, 
  onDelete,
  showActions = false
}: EventCardProps) {
  const t = useTranslations("events");
  const tCommon = useTranslations("common");
  const statusBadge = getStatusBadge(event.status, t);
  const attendeeCount = event.attendees?.length || 0;
  
  return (
    <div 
      className={cn(
        "bg-secondary rounded-2xl overflow-hidden border border-border transition-colors",
        onClick && "cursor-pointer hover:border-border"
      )}
      onClick={onClick}
    >
      {/* Event Cover */}
      {event.cover ? (
        <div className="h-32 w-full relative">
          <Image
            src={event.cover}
            alt={event.title}
            fill
            className="object-cover"
            unoptimized
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
        <div className="h-24 w-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center relative">
          <Calendar size={32} className="text-muted-foreground/70" />
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
        <h3 className="font-display font-semibold text-foreground text-lg leading-tight line-clamp-2">
          {event.title}
        </h3>
        
        {event.description && (
          <p className="font-serif text-sm text-muted-foreground line-clamp-2">
            {extractPlainText(event.description)}
          </p>
        )}
        
        <div className="space-y-2">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar size={14} className="text-muted-foreground/70 shrink-0" />
            <span>
              {formatDate(event.startDate)}
              {event.startDate && (
                <span className="text-muted-foreground/70 ml-1">
                  {formatTime(event.startDate)}
                </span>
              )}
            </span>
          </div>
          
          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin size={14} className="text-muted-foreground/70 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          
          {/* Attendees */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users size={14} className="text-muted-foreground/70 shrink-0" />
            <span>{attendeeCount} {t("attending")}</span>
          </div>
        </div>
        
        {/* Action Buttons - Only shown for owners */}
        {showActions && onEdit && onDelete && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-muted/80 text-foreground/70 font-medium text-sm hover:bg-muted/80 transition-colors active:scale-[0.98]"
            >
              <Edit2 size={16} />
              {tCommon("edit")}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-100 text-rose-600 font-medium text-sm hover:bg-rose-200 transition-colors active:scale-[0.98]"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

