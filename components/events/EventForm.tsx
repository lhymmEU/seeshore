"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { ImageUpload } from "@/components/ui/image-upload";
import { FormInput, FormTextarea, DateTimeInput } from "@/components/ui/form-input";
import { PageLoader } from "@/components/ui/loading-spinner";
import { BottomNav } from "@/components/navigation";
import { uploadImage } from "@/data/supabase";
import { combineDateTime, parseDateTime } from "@/lib/date-utils";
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

interface EventFormProps {
  mode: "create" | "edit";
  eventId?: string;
  initialData?: StoreEvent;
  isLoading?: boolean;
}

export function EventForm({ mode, eventId, initialData, isLoading = false }: EventFormProps) {
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
      let coverUrl: string | undefined = mode === "edit" ? (originalCover || undefined) : undefined;
      if (coverFile) {
        try {
          coverUrl = await uploadImage(coverFile, 'images', 'events');
        } catch (uploadError) {
          console.error("Failed to upload cover image:", uploadError);
        }
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const body = mode === "create"
        ? {
            storeId,
            title: formData.title.trim(),
            cover: coverUrl,
            startDate: combineDateTime(formData.startDate, formData.startTime),
            endDate: combineDateTime(formData.endDate, formData.endTime),
            description: formData.description.trim() || undefined,
            location: formData.location.trim() || undefined,
            hostIds: userId ? [userId] : undefined,
          }
        : {
            eventId,
            title: formData.title.trim(),
            cover: coverUrl,
            startDate: combineDateTime(formData.startDate, formData.startTime),
            endDate: combineDateTime(formData.endDate, formData.endTime),
            description: formData.description.trim() || undefined,
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

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <PageHeader title={mode === "create" ? "Create Event" : "Edit Event"} />

      <div className="px-4 pt-6 space-y-5">
        <ImageUpload
          preview={coverPreview}
          onFileSelect={handleFileSelect}
          label="Upload Event Cover"
        />

        <FormInput
          label="Event Title"
          icon={FileText}
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="Enter event title"
          required
        />

        <DateTimeInput
          label="Start Date & Time"
          icon={Calendar}
          dateName="startDate"
          timeName="startTime"
          dateValue={formData.startDate}
          timeValue={formData.startTime}
          onDateChange={handleInputChange}
          onTimeChange={handleInputChange}
        />

        <DateTimeInput
          label="End Date & Time"
          icon={Calendar}
          dateName="endDate"
          timeName="endTime"
          dateValue={formData.endDate}
          timeValue={formData.endTime}
          onDateChange={handleInputChange}
          onTimeChange={handleInputChange}
        />

        <FormInput
          label="Location"
          icon={MapPin}
          name="location"
          value={formData.location}
          onChange={handleInputChange}
          placeholder="Where will the event take place?"
        />

        <FormTextarea
          label="Description"
          icon={FileText}
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Describe your event..."
          rows={4}
        />

        <button
          onClick={handleSubmit}
          disabled={isSaving || !canSubmit}
          className={cn(
            "w-full py-4 rounded-2xl font-medium text-base transition-all mt-4",
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

      <BottomNav />
    </div>
  );
}
