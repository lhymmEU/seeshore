"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  preview: string | null;
  onFileSelect: (file: File) => void;
  label?: string;
  height?: string;
  className?: string;
}

export function ImageUpload({
  preview,
  onFileSelect,
  label = "Upload Image",
  height = "h-44",
  className,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "w-full bg-muted rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden relative group transition-all hover:bg-muted/80",
          height,
          className
        )}
      >
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera size={28} className="text-white" />
            </div>
          </>
        ) : (
          <>
            <Camera size={28} className="text-muted-foreground/70" />
            <span className="text-muted-foreground font-medium text-sm">{label}</span>
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
}
