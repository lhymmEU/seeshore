"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  Loader2,
  BookOpen,
  User,
  Calendar,
  FileText,
  MapPin,
  Link as LinkIcon,
  Tag,
  Scan,
  PenLine
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { uploadImage } from "@/data/supabase";

type RegistrationTab = "manual" | "scan";

interface BookFormData {
  id: string; // ISBN
  title: string;
  author: string;
  publicationDate: string;
  description: string;
  categories: string;
  location: string;
  link: string;
}

export default function ItemRegistrationPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<RegistrationTab>("manual");
  const [isSaving, setIsSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<BookFormData>({
    id: "",
    title: "",
    author: "",
    publicationDate: "",
    description: "",
    categories: "",
    location: "",
    link: "",
  });

  useEffect(() => {
    const checkAuth = () => {
      const role = sessionStorage.getItem("userRole");
      if (role !== "owner" && role !== "assistant") {
        router.push("/");
        return;
      }
    };

    checkAuth();
  }, [router]);

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

  const handleSubmit = async () => {
    if (!formData.id.trim()) {
      alert("Please enter the ISBN");
      return;
    }
    if (!formData.title.trim()) {
      alert("Please enter the book title");
      return;
    }

    setIsSaving(true);
    try {
      const storeId = sessionStorage.getItem("selectedStore");
      const accessToken = sessionStorage.getItem("accessToken");
      
      if (!storeId) {
        throw new Error("No store found");
      }

      // Upload cover image if present
      let coverUrl: string | undefined;
      if (coverFile) {
        try {
          coverUrl = await uploadImage(coverFile, 'images', 'books');
        } catch (uploadError) {
          console.error("Failed to upload cover image:", uploadError);
          // Continue without cover if upload fails
        }
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      // Parse categories from comma-separated string
      const categoriesArray = formData.categories
        .split(",")
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0);

      const response = await fetch("/api/books", {
        method: "POST",
        headers,
        body: JSON.stringify({
          storeId,
          id: formData.id.trim(),
          title: formData.title.trim(),
          author: formData.author.trim() || undefined,
          cover: coverUrl,
          publicationDate: formData.publicationDate || undefined,
          description: formData.description.trim() || undefined,
          categories: categoriesArray.length > 0 ? categoriesArray : undefined,
          location: formData.location.trim() || undefined,
          link: formData.link.trim() || undefined,
          status: "available",
          likes: 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register book");
      }

      // Reset form and show success
      setFormData({
        id: "",
        title: "",
        author: "",
        publicationDate: "",
        description: "",
        categories: "",
        location: "",
        link: "",
      });
      setCoverPreview(null);
      setCoverFile(null);
      
      alert("Book registered successfully!");
      router.push("/manage");
    } catch (error) {
      console.error("Failed to register book:", error);
      alert("Failed to register book. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = formData.id.trim().length > 0 && formData.title.trim().length > 0;

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
            Register Item
          </h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-5">
        {/* Registration Method Toggle */}
        <div className="flex bg-zinc-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab("manual")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all",
              activeTab === "manual"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-800"
            )}
          >
            <PenLine size={14} />
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab("scan")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-sm font-medium transition-all",
              activeTab === "scan"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-800"
            )}
          >
            <Scan size={14} />
            Scan ISBN
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "manual" ? (
          <>
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
                    Upload Book Cover
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

            {/* ISBN (ID) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
                <BookOpen size={14} className="text-zinc-400" />
                ISBN <span className="text-rose-500">*</span>
              </label>
              <div className="bg-zinc-100 rounded-2xl overflow-hidden">
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  placeholder="Enter ISBN (e.g., 978-0-13-468599-1)"
                  className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-base"
                />
              </div>
            </div>

            {/* Book Title */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
                <FileText size={14} className="text-zinc-400" />
                Book Title <span className="text-rose-500">*</span>
              </label>
              <div className="bg-zinc-100 rounded-2xl overflow-hidden">
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter book title"
                  className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-base"
                />
              </div>
            </div>

            {/* Author */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
                <User size={14} className="text-zinc-400" />
                Author
              </label>
              <div className="bg-zinc-100 rounded-2xl overflow-hidden">
                <input
                  type="text"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  placeholder="Enter author name"
                  className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-base"
                />
              </div>
            </div>

            {/* Publication Date */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
                <Calendar size={14} className="text-zinc-400" />
                Publication Date
              </label>
              <div className="bg-zinc-100 rounded-2xl overflow-hidden">
                <input
                  type="date"
                  name="publicationDate"
                  value={formData.publicationDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-4 bg-transparent text-zinc-900 focus:outline-none text-base [color-scheme:light]"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
                <Tag size={14} className="text-zinc-400" />
                Categories
              </label>
              <div className="bg-zinc-100 rounded-2xl overflow-hidden">
                <input
                  type="text"
                  name="categories"
                  value={formData.categories}
                  onChange={handleInputChange}
                  placeholder="Fiction, Mystery, Thriller (comma-separated)"
                  className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-base"
                />
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
                  placeholder="Shelf A3, Row 2"
                  className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none text-base"
                />
              </div>
            </div>

            {/* External Link */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 px-1">
                <LinkIcon size={14} className="text-zinc-400" />
                External Link
              </label>
              <div className="bg-zinc-100 rounded-2xl overflow-hidden">
                <input
                  type="url"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="https://example.com/book"
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
                  placeholder="Enter book description..."
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
                  Registering...
                </span>
              ) : (
                "Register Book"
              )}
            </button>
          </>
        ) : (
          /* Scan Tab - Placeholder */
          <div className="bg-zinc-100 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 min-h-[300px]">
            <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center">
              <Scan size={36} className="text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-zinc-600 font-medium">
                ISBN Scanning
              </p>
              <p className="text-zinc-400 text-sm mt-1">
                Coming soon. Use manual entry for now.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

