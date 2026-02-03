"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen,
  User,
  Calendar,
  FileText,
  MapPin,
  Link as LinkIcon,
  Tag,
  Scan,
  PenLine,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ImageUpload } from "@/components/ui/image-upload";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import { FormInput, FormTextarea } from "@/components/ui/form-input";
import { uploadImage } from "@/data/supabase";

type RegistrationTab = "manual" | "scan";

interface BookFormData {
  isbn: string;
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
  
  const [activeTab, setActiveTab] = useState<RegistrationTab>("manual");
  const [isSaving, setIsSaving] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<BookFormData>({
    isbn: "",
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

  const handleCoverSelect = (file: File) => {
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

  const handleSubmit = async () => {
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

      let coverUrl: string | undefined;
      if (coverFile) {
        try {
          coverUrl = await uploadImage(coverFile, 'images', 'books');
        } catch (uploadError) {
          console.error("Failed to upload cover image:", uploadError);
        }
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const categoriesArray = formData.categories
        .split(",")
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0);

      const response = await fetch("/api/books", {
        method: "POST",
        headers,
        body: JSON.stringify({
          storeId,
          isbn: formData.isbn.trim() || undefined,
          title: formData.title.trim(),
          author: formData.author.trim() || undefined,
          cover: coverUrl,
          publicationDate: formData.publicationDate || undefined,
          description: formData.description.trim() || undefined,
          categories: categoriesArray.length > 0 ? categoriesArray : undefined,
          location: formData.location.trim() || undefined,
          link: formData.link.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to register book");
      }

      setFormData({
        isbn: "",
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

  const isFormValid = formData.title.trim().length > 0;

  const tabs = [
    { id: "manual", label: "Manual Entry", icon: PenLine },
    { id: "scan", label: "Scan ISBN", icon: Scan },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      <PageHeader title="Register Item" />

      <div className="px-4 pt-6 space-y-5">
        <TabSwitcher
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as RegistrationTab)}
        />

        {activeTab === "manual" ? (
          <>
            <ImageUpload
              preview={coverPreview}
              onFileSelect={handleCoverSelect}
              label="Upload Book Cover"
            />

            <FormInput
              label="ISBN"
              icon={BookOpen}
              name="isbn"
              value={formData.isbn}
              onChange={handleInputChange}
              placeholder="Enter ISBN (e.g., 978-0-13-468599-1)"
            />

            <FormInput
              label="Book Title"
              icon={FileText}
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter book title"
              required
            />

            <FormInput
              label="Author"
              icon={User}
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              placeholder="Enter author name"
            />

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

            <FormInput
              label="Categories"
              icon={Tag}
              name="categories"
              value={formData.categories}
              onChange={handleInputChange}
              placeholder="Fiction, Mystery, Thriller (comma-separated)"
            />

            <FormInput
              label="Location"
              icon={MapPin}
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Shelf A3, Row 2"
            />

            <FormInput
              label="External Link"
              icon={LinkIcon}
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="https://example.com/book"
              type="url"
            />

            <FormTextarea
              label="Description"
              icon={FileText}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter book description..."
              rows={4}
            />

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

      <BottomNav />
    </div>
  );
}
