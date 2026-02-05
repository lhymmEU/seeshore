"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  ImagePlus,
  Users,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { uploadImage } from "@/data/supabase";
import { combineDateTime, parseDateTime, formatDateRange } from "@/lib/date-utils";
import type { StoreEvent } from "@/types/type";

export interface EventFormData {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  description: string;
  location: string;
}

interface EventPreviewEditorProps {
  mode: "create" | "edit";
  eventId?: string;
  initialData?: StoreEvent;
  isLoading?: boolean;
}

// Inline editable text input
function EditableTitle({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative group">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          "w-full text-xl font-bold text-zinc-900 bg-transparent border-none outline-none",
          "placeholder:text-zinc-400",
          !value && !isFocused && "text-zinc-400"
        )}
      />
      {!isFocused && (
        <Pencil
          size={14}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      )}
    </div>
  );
}

// Inline editable location input
function EditableLocation({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="flex items-center gap-2 group">
      <MapPin size={16} className="text-zinc-400 flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          "flex-1 text-sm text-zinc-600 bg-transparent border-none outline-none",
          "placeholder:text-zinc-400"
        )}
      />
      {!isFocused && value && (
        <Pencil
          size={12}
          className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        />
      )}
    </div>
  );
}

// Date time picker inline
function EditableDateTime({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  label,
}: {
  dateValue: string;
  timeValue: string;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Calendar size={14} className="text-zinc-400" />
        <span className="text-xs text-zinc-500">{label}:</span>
      </div>
      <input
        type="date"
        value={dateValue}
        onChange={(e) => onDateChange(e.target.value)}
        className="text-sm text-zinc-700 bg-transparent border-none outline-none cursor-pointer"
      />
      <input
        type="time"
        value={timeValue}
        onChange={(e) => onTimeChange(e.target.value)}
        className="text-sm text-zinc-700 bg-transparent border-none outline-none cursor-pointer"
      />
    </div>
  );
}

// Cover image upload area
function CoverImageUpload({
  preview,
  onFileSelect,
}: {
  preview: string | null;
  onFileSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative w-full aspect-[4/5] bg-zinc-100 cursor-pointer group overflow-hidden"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      
      {preview ? (
        <>
          <Image
            src={preview}
            alt="Event cover"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
              <ImagePlus size={24} className="text-zinc-700" />
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 group-hover:text-zinc-600 transition-colors">
          <ImagePlus size={48} strokeWidth={1.5} />
          <p className="mt-3 text-sm font-medium">Upload Event Cover</p>
          <p className="mt-1 text-xs">Click to add an image</p>
        </div>
      )}
    </div>
  );
}

// Mock participant avatars for preview
function PreviewParticipants() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        <div className="w-9 h-9 rounded-full bg-zinc-200 border-2 border-white flex items-center justify-center">
          <Users size={14} className="text-zinc-400" />
        </div>
      </div>
      <span className="text-sm text-zinc-400">No participants yet</span>
    </div>
  );
}

export function EventPreviewEditor({
  mode,
  eventId,
  initialData,
  isLoading = false,
}: EventPreviewEditorProps) {
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [originalCover, setOriginalCover] = useState<string>("");
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    description: "",
    location: "",
  });
  const [initialFormData, setInitialFormData] = useState<EventFormData | null>(null);

  // Initialize form with event data for edit mode
  useEffect(() => {
    if (initialData && mode === "edit") {
      const startParsed = parseDateTime(initialData.startDate);
      const endParsed = parseDateTime(initialData.endDate);

      const loadedFormData: EventFormData = {
        title: initialData.title || "",
        startDate: startParsed.date,
        startTime: startParsed.time,
        endDate: endParsed.date,
        endTime: endParsed.time,
        description: initialData.description || "",
        location: initialData.location || "",
      };

      setFormData(loadedFormData);
      setInitialFormData(loadedFormData);

      if (initialData.cover) {
        setCoverPreview(initialData.cover);
        setOriginalCover(initialData.cover);
      }
    }
  }, [initialData, mode]);

  const handleFileSelect = (file: File) => {
    setCoverFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  };

  const updateField = <K extends keyof EventFormData>(
    field: K,
    value: EventFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Check if any changes have been made (for edit mode)
  const hasChanges = useMemo(() => {
    if (mode === "create") return true;
    if (!initialFormData) return false;

    if (coverFile) return true;

    return (
      formData.title !== initialFormData.title ||
      formData.startDate !== initialFormData.startDate ||
      formData.startTime !== initialFormData.startTime ||
      formData.endDate !== initialFormData.endDate ||
      formData.endTime !== initialFormData.endTime ||
      formData.description !== initialFormData.description ||
      formData.location !== initialFormData.location
    );
  }, [formData, initialFormData, coverFile, mode]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("Please enter an event title");
      return;
    }

    setIsSaving(true);
    try {
      const storeId = sessionStorage.getItem("selectedStore");
      const userId = sessionStorage.getItem("userId");
      const accessToken = sessionStorage.getItem("accessToken");

      if (!storeId && mode === "create") {
        throw new Error("No store found");
      }

      // Upload cover image if present
      let coverUrl: string | undefined =
        mode === "edit" ? originalCover || undefined : undefined;
      if (coverFile) {
        try {
          coverUrl = await uploadImage(coverFile, "images", "events");
        } catch (uploadError) {
          console.error("Failed to upload cover image:", uploadError);
        }
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const body =
        mode === "create"
          ? {
              storeId,
              title: formData.title.trim(),
              cover: coverUrl,
              startDate: combineDateTime(formData.startDate, formData.startTime),
              endDate: combineDateTime(formData.endDate, formData.endTime),
              description: formData.description || undefined,
              location: formData.location.trim() || undefined,
              hostIds: userId ? [userId] : undefined,
            }
          : {
              eventId,
              title: formData.title.trim(),
              cover: coverUrl,
              startDate: combineDateTime(formData.startDate, formData.startTime),
              endDate: combineDateTime(formData.endDate, formData.endTime),
              description: formData.description || undefined,
              location: formData.location.trim() || undefined,
            };

      const response = await fetch("/api/events", {
        method: mode === "create" ? "POST" : "PUT",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${mode} event`);
      }

      router.push("/manage/events");
    } catch (error) {
      console.error(`Failed to ${mode} event:`, error);
      alert(`Failed to ${mode} event. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.title.trim().length > 0;
  const canSubmit = isFormValid && (mode === "create" || hasChanges);

  // Format date range for preview
  const dateRangePreview = useMemo(() => {
    if (!formData.startDate && !formData.endDate) {
      return "Select event dates";
    }
    const startISO = combineDateTime(formData.startDate, formData.startTime);
    const endISO = combineDateTime(formData.endDate, formData.endTime);
    if (!startISO && !endISO) {
      return "Select event dates";
    }
    return formatDateRange(startISO || "", endISO || "");
  }, [formData.startDate, formData.startTime, formData.endDate, formData.endTime]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Cover Image Area */}
      <div className="relative w-full flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm border border-zinc-200/50"
        >
          <ArrowLeft size={20} className="text-zinc-800" />
        </button>

        <CoverImageUpload preview={coverPreview} onFileSelect={handleFileSelect} />
      </div>

      {/* Content Sheet */}
      <div className="relative -mt-6 bg-white rounded-t-3xl flex-1 flex flex-col">
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-12 h-1.5 rounded-full bg-zinc-200" />
        </div>

        <div className="px-5 pb-6 flex-1 flex flex-col">
          {/* Title */}
          <div className="mb-4">
            <EditableTitle
              value={formData.title}
              onChange={(value) => updateField("title", value)}
              placeholder="Enter event title"
            />

            {/* Date preview */}
            <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500">
              <Clock size={14} />
              <span>{dateRangePreview}</span>
            </div>
          </div>

          {/* Date & Time Pickers */}
          <div className="mb-4 p-4 bg-zinc-50 rounded-2xl space-y-3">
            <EditableDateTime
              label="Start"
              dateValue={formData.startDate}
              timeValue={formData.startTime}
              onDateChange={(value) => updateField("startDate", value)}
              onTimeChange={(value) => updateField("startTime", value)}
            />
            <EditableDateTime
              label="End"
              dateValue={formData.endDate}
              timeValue={formData.endTime}
              onDateChange={(value) => updateField("endDate", value)}
              onTimeChange={(value) => updateField("endTime", value)}
            />
          </div>

          {/* Participants and Location */}
          <div className="flex items-center justify-between mb-6">
            <PreviewParticipants />

            <div className="flex-shrink-0 max-w-[140px]">
              <EditableLocation
                value={formData.location}
                onChange={(value) => updateField("location", value)}
                placeholder="Add location"
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex-1 mb-6">
            <h2 className="text-base font-semibold text-zinc-900 mb-3">
              About Event
            </h2>
            <RichTextEditor
              content={formData.description}
              onChange={(content) => updateField("description", content)}
              placeholder="Describe your event... Use the toolbar to add headings, lists, tables, and more."
              className="min-h-[200px]"
            />
          </div>

          {/* Submit Button */}
          <div className="mt-auto pb-safe">
            <button
              onClick={handleSubmit}
              disabled={isSaving || !canSubmit}
              className={cn(
                "w-full py-4 rounded-2xl font-medium text-base transition-all",
                canSubmit
                  ? "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </span>
              ) : mode === "edit" && !hasChanges ? (
                "No Changes"
              ) : mode === "create" ? (
                "Create Event"
              ) : (
                "Confirm Edit"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
