"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { uploadImage } from "@/data/supabase";

interface EventFormData {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  description: string;
  location: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    description: "",
    location: "",
  });

  const handleCoverClick = () => {
    fileInputRef.current?.click();
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the file for later upload
      setCoverFile(file);
      // Create blob URL only for preview (not for storage)
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
      // If no time specified, use start of day
      return new Date(date).toISOString();
    }
    const combined = new Date(`${date}T${time}`);
    return combined.toISOString();
  };

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
      
      if (!storeId) {
        throw new Error("No store found");
      }

      // Upload cover image if present
      let coverUrl: string | undefined;
      if (coverFile) {
        try {
          coverUrl = await uploadImage(coverFile, 'images', 'events');
        } catch (uploadError) {
          console.error("Failed to upload cover image:", uploadError);
          // Continue without cover if upload fails
        }
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/events", {
        method: "POST",
        headers,
        body: JSON.stringify({
          storeId,
          title: formData.title.trim(),
          cover: coverUrl,
          startDate: combineDateTime(formData.startDate, formData.startTime),
          endDate: combineDateTime(formData.endDate, formData.endTime),
          description: formData.description.trim() || undefined,
          location: formData.location.trim() || undefined,
          hostIds: userId ? [userId] : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create event");
      }

      router.push("/manage/events");
    } catch (error) {
      console.error("Failed to create event:", error);
      alert("Failed to create event. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.title.trim().length > 0;

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
            Create Event
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
          disabled={isSaving || !isFormValid}
          className={cn(
            "w-full py-4 rounded-2xl font-medium text-base transition-all mt-4",
            isFormValid
              ? "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
              : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Creating...
            </span>
          ) : (
            "Create Event"
          )}
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

