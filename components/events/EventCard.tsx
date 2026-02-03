"use client";

import { Calendar, MapPin, Users, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/date-utils";
import type { StoreEvent } from "@/types/type";

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
  const statusBadge = getStatusBadge(event.status);
  const attendeeCount = event.attendees?.length || 0;
  
  return (
    <div 
      className={cn(
        "bg-zinc-50 rounded-2xl overflow-hidden border border-zinc-100 transition-colors",
        onClick && "cursor-pointer hover:border-zinc-200"
      )}
      onClick={onClick}
    >
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
            <span>{attendeeCount} attending</span>
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
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-200/80 text-zinc-700 font-medium text-sm hover:bg-zinc-300/80 transition-colors active:scale-[0.98]"
            >
              <Edit2 size={16} />
              Edit
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

