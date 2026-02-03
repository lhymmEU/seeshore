"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PageLoader } from "@/components/ui/loading-spinner";
import { ImageUpload } from "@/components/ui/image-upload";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import { FormInput, FormTextarea } from "@/components/ui/form-input";

type Tab = "basic" | "items";

interface StoreFormData {
  banner: string;
  name: string;
  description: string;
  rules: string;
}

export default function BookstoreEditorPage() {
  const router = useRouter();
  
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

  if (isLoading) {
    return <PageLoader />;
  }

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "items", label: "Register Items" },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      <PageHeader title={storeId ? "Edit Bookstore" : "Create Bookstore"} />

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
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Store Name"
            />

            <FormTextarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Store Description"
              rows={4}
            />

            <FormTextarea
              name="rules"
              value={formData.rules}
              onChange={handleInputChange}
              placeholder="Store Rules"
              rows={4}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-zinc-100 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 min-h-[200px]">
              <p className="text-zinc-500 text-sm text-center">
                Register items functionality coming soon.
                <br />
                Use the items page from the dashboard.
              </p>
            </div>
          </div>
        )}

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

      <BottomNav />
    </div>
  );
}
