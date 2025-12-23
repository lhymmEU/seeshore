"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";

type Tab = "basic" | "items";

interface StoreFormData {
  banner: string;
  name: string;
  description: string;
  rules: string;
}

export default function BookstoreEditorPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<Tab>("basic");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
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

      // Use storeId from sessionStorage (set during login store selection)
      const savedStoreId = sessionStorage.getItem("storeId");
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

  const handleBannerClick = () => {
    fileInputRef.current?.click();
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview(previewUrl);
      // In a real app, you'd upload to storage and get a URL
      // For now, we'll just store the preview
      setFormData(prev => ({ ...prev, banner: previewUrl }));
    }
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
            {storeId ? "Edit Bookstore" : "Create Bookstore"}
          </h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Banner Upload */}
        <button
          onClick={handleBannerClick}
          className="w-full h-44 bg-zinc-100 rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden relative group transition-all hover:bg-zinc-200/80"
        >
          {bannerPreview ? (
            <>
              <img
                src={bannerPreview}
                alt="Banner preview"
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
                Upload Banner Photo
              </span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleBannerChange}
          className="hidden"
        />

        {/* Tabs */}
        <div className="flex bg-zinc-100 rounded-full p-1">
          <button
            onClick={() => setActiveTab("basic")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all",
              activeTab === "basic"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-800"
            )}
          >
            Basic Info
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all",
              activeTab === "items"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-800"
            )}
          >
            Register Items
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "basic" ? (
          <div className="space-y-4">
            {/* Store Name */}
            <div className="bg-zinc-100 rounded-2xl overflow-hidden">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Store Name"
                className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-500 focus:outline-none text-base"
              />
            </div>

            {/* Store Description */}
            <div className="bg-zinc-100 rounded-2xl overflow-hidden">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Store Description"
                rows={4}
                className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-500 focus:outline-none text-base resize-none"
              />
            </div>

            {/* Store Rules */}
            <div className="bg-zinc-100 rounded-2xl overflow-hidden">
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleInputChange}
                placeholder="Store Rules"
                rows={4}
                className="w-full px-4 py-4 bg-transparent text-zinc-900 placeholder:text-zinc-500 focus:outline-none text-base resize-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Items tab - placeholder for now */}
            <div className="bg-zinc-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
              <p className="text-zinc-500 text-sm text-center">
                Register items functionality coming soon.
                <br />
                Use the items page from the dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSaving || !formData.name.trim()}
          className={cn(
            "w-full py-4 rounded-full font-medium text-base transition-all",
            formData.name.trim()
              ? "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 active:scale-[0.98]"
              : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </span>
          ) : (
            storeId ? "Confirm" : "Create/Confirm"
          )}
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

