"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { X, Camera, Plus, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/data/supabase";

interface CreatePostDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPostCreated: () => void;
}

export function CreatePostDrawer({
  open,
  onOpenChange,
  onPostCreated,
}: CreatePostDrawerProps) {
  const t = useTranslations("collaborate");
  const tCommon = useTranslations("common");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 photos total
    const remainingSlots = 5 - photoFiles.length;
    const newFiles = files.slice(0, remainingSlots);

    setPhotoFiles((prev) => [...prev, ...newFiles]);
    
    // Create previews
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    // Revoke the preview URL to free memory
    URL.revokeObjectURL(photoPreviews[index]);
    
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);

    try {
      const storeId = sessionStorage.getItem("selectedStore");
      const userId = sessionStorage.getItem("userId");
      const accessToken = sessionStorage.getItem("accessToken");

      if (!storeId || !userId) {
        console.error("Missing store or user ID");
        return;
      }

      // Upload photos first
      const photoUrls: string[] = [];
      for (const file of photoFiles) {
        const url = await uploadImage(file, "images", "collaborate");
        photoUrls.push(url);
      }

      // Create the post
      const response = await fetch("/api/collaborate/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          storeId,
          authorId: userId,
          title: title.trim(),
          description: description.trim(),
          photos: photoUrls,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      // Reset form
      setTitle("");
      setDescription("");
      setPhotoFiles([]);
      setPhotoPreviews([]);
      
      onOpenChange(false);
      onPostCreated();
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URLs
    photoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setTitle("");
    setDescription("");
    setPhotoFiles([]);
    setPhotoPreviews([]);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="flex flex-row items-center justify-between border-b border-zinc-100 pb-4">
          <DrawerTitle className="text-lg">{t("createPost")}</DrawerTitle>
          <DrawerClose asChild>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X size={20} className="text-zinc-500" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              {t("postTitle")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("enterTitle")}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              {t("postDescription")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("enterDescription")}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              {t("photos")} ({photoPreviews.length}/5)
            </label>
            <div className="flex flex-wrap gap-2">
              {photoPreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative w-20 h-20 rounded-xl overflow-hidden group"
                >
                  <Image
                    src={preview}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} className="text-white" />
                  </button>
                </div>
              ))}
              
              {photoFiles.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center gap-1 hover:border-zinc-400 transition-colors"
                >
                  {photoFiles.length === 0 ? (
                    <Camera size={20} className="text-zinc-400" />
                  ) : (
                    <Plus size={20} className="text-zinc-400" />
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="p-4 border-t border-zinc-100">
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !description.trim() || isSubmitting}
            className="w-full py-3 rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                {tCommon("saving")}
              </>
            ) : (
              t("publishPost")
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
