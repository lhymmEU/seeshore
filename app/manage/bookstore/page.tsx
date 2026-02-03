"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, BookOpen, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/loading-spinner";
import { ImageUpload } from "@/components/ui/image-upload";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import { FormInput, FormTextarea } from "@/components/ui/form-input";
import { EmptyState } from "@/components/ui/empty-state";
import type { Book } from "@/types/type";

type Tab = "basic" | "items";

interface StoreFormData {
  banner: string;
  name: string;
  description: string;
  rules: string;
}

// Compact book item for the list
function BookListItem({ book }: { book: Book }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
      {/* Book Cover */}
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-200 flex-shrink-0 relative">
        {book.cover ? (
          <Image
            src={book.cover}
            alt={book.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={16} className="text-zinc-400" />
          </div>
        )}
      </div>

      {/* Book Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-zinc-900 text-sm truncate">
          {book.title}
        </h4>
        <p className="text-xs text-zinc-500 truncate">
          {book.author || "Unknown Author"}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-medium",
            book.status === "available" 
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          )}>
            {book.status === "available" ? "Available" : "Borrowed"}
          </span>
          {book.location && (
            <span className="text-[10px] text-zinc-400 truncate">
              {book.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookstoreEditorPage() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [formData, setFormData] = useState<StoreFormData>({
    banner: "",
    name: "",
    description: "",
    rules: "",
  });
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const role = sessionStorage.getItem("userRole");
      if (role !== "owner" && role !== "assistant") {
        router.push("/");
        return;
      }

      // Try to get storeId from sessionStorage or selectedStore
      const savedStoreId = sessionStorage.getItem("storeId") || sessionStorage.getItem("selectedStore");
      if (savedStoreId) {
        setStoreId(savedStoreId);
        try {
          const response = await fetch(`/api/store?id=${savedStoreId}`);
          if (response.ok) {
            const store = await response.json();
            setFormData({
              banner: store.banner || "",
              name: store.name || "",
              description: store.description || "",
              rules: store.rules || "",
            });
            if (store.banner) {
              setBannerPreview(store.banner);
            }
          }
        } catch (error) {
          console.error("Failed to fetch store:", error);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Fetch books when switching to items tab
  useEffect(() => {
    const fetchBooks = async () => {
      const currentStoreId = storeId || sessionStorage.getItem("selectedStore");
      if (activeTab === "items" && currentStoreId && books.length === 0) {
        setIsLoadingBooks(true);
        try {
          const response = await fetch(`/api/books?storeId=${currentStoreId}`);
          if (response.ok) {
            const data = await response.json();
            setBooks(data);
          }
        } catch (error) {
          console.error("Failed to fetch books:", error);
        } finally {
          setIsLoadingBooks(false);
        }
      }
    };

    fetchBooks();
  }, [activeTab, storeId, books.length]);

  const handleBannerSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setBannerPreview(previewUrl);
    setFormData(prev => ({ ...prev, banner: previewUrl }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a store name");
      return;
    }

    setIsSaving(true);
    try {
      const userId = sessionStorage.getItem("userId");
      const accessToken = sessionStorage.getItem("accessToken");

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/store", {
        method: storeId ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          ...(storeId && { id: storeId }),
          ...formData,
          ownerId: userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save store");
      }

      const savedStore = await response.json();
      sessionStorage.setItem("storeId", savedStore.id);
      setStoreId(savedStore.id);
      
      router.push("/manage");
    } catch (error) {
      console.error("Failed to save store:", error);
      alert("Failed to save store. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterNewItem = () => {
    router.push("/manage/items");
  };

  if (isLoading) {
    return <PageLoader />;
  }

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "items", label: "Registered Items" },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      <PageHeader title="Edit Bookstore" />

      <div className="px-4 pt-6 space-y-6">
        <ImageUpload
          preview={bannerPreview}
          onFileSelect={handleBannerSelect}
          label="Upload Banner Photo"
        />

        <TabSwitcher
          tabs={tabs}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as Tab)}
        />

        {activeTab === "basic" ? (
          <div className="space-y-4">
            <FormInput
              label="Store Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter store name"
              required
            />

            <FormTextarea
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your bookstore..."
              rows={4}
            />

            <FormTextarea
              label="Store Rules"
              name="rules"
              value={formData.rules}
              onChange={handleInputChange}
              placeholder="Borrowing policies, opening hours, etc."
              rows={4}
            />

            <button
              onClick={handleSubmit}
              disabled={isSaving || !formData.name.trim()}
              className={cn(
                "w-full py-4 rounded-2xl font-medium text-base transition-all",
                formData.name.trim()
                  ? "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
                  : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header with count and add button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900">Books</h3>
                <p className="text-xs text-zinc-500">
                  {books.length} {books.length === 1 ? "item" : "items"} registered
                </p>
              </div>
              <button
                onClick={handleRegisterNewItem}
                className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors active:scale-[0.98]"
              >
                + Add New
              </button>
            </div>

            {/* Books List */}
            {isLoadingBooks ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl animate-pulse"
                  >
                    <div className="w-12 h-16 bg-zinc-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-zinc-200 rounded w-3/4" />
                      <div className="h-3 bg-zinc-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : books.length > 0 ? (
              <div className="space-y-3">
                {books.map((book) => (
                  <BookListItem key={book.id} book={book} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Package}
                title="No items registered"
                message="Start by adding books to your bookstore"
                action={
                  <button
                    onClick={handleRegisterNewItem}
                    className="mt-2 px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    Register First Item
                  </button>
                }
              />
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
