"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  Loader2,
  Calendar,
  Clock,
  MapPin,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { uploadImage, fetchEvent } from "@/data/supabase";

interface EventFormData {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  description: string;
  location: string;
}

function parseDateTime(isoString: string): { date: string; time: string } {
  if (!isoString) return { date: "", time: "" };
  const dateObj = new Date(isoString);
  const date = dateObj.toISOString().split("T")[0];
  const time = dateObj.toTimeString().slice(0, 5);
  return { date, time };
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
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

  // Store initial form data to compare for changes
  const [initialFormData, setInitialFormData] = useState<EventFormData | null>(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const event = await fetchEvent(eventId);
        
        const startParsed = parseDateTime(event.startDate);
        const endParsed = parseDateTime(event.endDate);
        
        const loadedFormData: EventFormData = {
          title: event.title || "",
          startDate: startParsed.date,
          startTime: startParsed.time,
          endDate: endParsed.date,
          endTime: endParsed.time,
          description: event.description || "",
          location: event.location || "",
        };
        
        setFormData(loadedFormData);
        setInitialFormData(loadedFormData);
        
        if (event.cover) {
          setCoverPreview(event.cover);
          setOriginalCover(event.cover);
        }
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

  const handleCoverClick = () => {
    fileInputRef.current?.click();
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverPreview(previewUrl);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const combineDateTime = (date: string, time: string): string | undefined => {
    if (!date) return undefined;
    if (!time) {
      return new Date(date).toISOString();
    }
    const combined = new Date(`${date}T${time}`);
    return combined.toISOString();
  };

  // Check if any changes have been made
  const hasChanges = useMemo(() => {
    if (!initialFormData) return false;
    
    // Check if cover changed
    if (coverFile) return true;
    
    // Check form data changes
    return (
      formData.title !== initialFormData.title ||
      formData.startDate !== initialFormData.startDate ||
      formData.startTime !== initialFormData.startTime ||
      formData.endDate !== initialFormData.endDate ||
      formData.endTime !== initialFormData.endTime ||
      formData.description !== initialFormData.description ||
      formData.location !== initialFormData.location
    );
  }, [formData, initialFormData, coverFile]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("Please enter an event title");
      return;
    }

    setIsSaving(true);
    try {
      const accessToken = sessionStorage.getItem("accessToken");

      // Upload new cover image if changed
      let coverUrl: string | undefined = originalCover || undefined;
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

      const response = await fetch("/api/events", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          eventId,
          title: formData.title.trim(),
          cover: coverUrl,
          startDate: combineDateTime(formData.startDate, formData.startTime),
          endDate: combineDateTime(formData.endDate, formData.endTime),
          description: formData.description.trim() || undefined,
          location: formData.location.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update event");
      }

      router.push("/manage/events");
    } catch (error) {
      console.error("Failed to update event:", error);
      alert("Failed to update event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.title.trim().length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
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
            Edit Event
          </h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-5">
        {/* Cover Image Upload */}
        <button
          onClick={handleCoverClick}
          className="w-full h-44 bg-zinc-100 rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden relative group transition-all hover:bg-zinc-200/80"
        >
          {coverPreview ? (
            <>
              <img
                src={coverPreview}
                alt="Cover preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={28} className="text-white" />
              </div>
            </>
          ) : (
            <>
              <Camera size={28} className="text-zinc-400" />
              <span className="text-zinc-500 font-medium text-sm">
                Upload Event Cover
              </span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverChange}
          className="hidden"
        />

        {/* Event Title */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
            <FileText size={14} className="text-zinc-400" />
            Event Title <span className="text-rose-500">*</span>
          </label>
          <div className="bg-zinc-100 rounded-2xl overflow-hidden">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter event title"
              className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-base"
            />
          </div>
        </div>

        {/* Start Date & Time */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
            <Calendar size={14} className="text-zinc-400" />
            Start Date & Time
          </label>
          <div className="flex gap-3">
            <div className="flex-1 bg-zinc-100 rounded-2xl overflow-hidden">
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className="w-full px-4 py-4 bg-transparent text-zinc-900 focus:outline-none text-base [color-scheme:light]"
              />
            </div>
            <div className="w-32 bg-zinc-100 rounded-2xl overflow-hidden flex items-center">
              <Clock size={16} className="text-zinc-400 ml-4" />
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full px-3 py-4 bg-transparent text-zinc-900 focus:outline-none text-base [color-scheme:light]"
              />
            </div>
          </div>
        </div>

        {/* End Date & Time */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
            <Calendar size={14} className="text-zinc-400" />
            End Date & Time
          </label>
          <div className="flex gap-3">
            <div className="flex-1 bg-zinc-100 rounded-2xl overflow-hidden">
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full px-4 py-4 bg-transparent text-zinc-900 focus:outline-none text-base [color-scheme:light]"
              />
            </div>
            <div className="w-32 bg-zinc-100 rounded-2xl overflow-hidden flex items-center">
              <Clock size={16} className="text-zinc-400 ml-4" />
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-3 py-4 bg-transparent text-zinc-900 focus:outline-none text-base [color-scheme:light]"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
            <MapPin size={14} className="text-zinc-400" />
            Location
          </label>
          <div className="bg-zinc-100 rounded-2xl overflow-hidden">
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Where will the event take place?"
              className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-base"
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
            <FileText size={14} className="text-zinc-400" />
            Description
          </label>
          <div className="bg-zinc-100 rounded-2xl overflow-hidden">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your event..."
              rows={4}
              className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-base resize-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSaving || !isFormValid || !hasChanges}
          className={cn(
            "w-full py-4 rounded-2xl font-medium text-base transition-all mt-4",
            isFormValid && hasChanges
              ? "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </span>
          ) : !hasChanges ? (
            "No Changes"
          ) : (
            "Confirm Edit"
          )}
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

