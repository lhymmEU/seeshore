"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  Loader2,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { ImageUpload } from "@/components/ui/image-upload";
import { TabSwitcher } from "@/components/ui/tab-switcher";
import { FormInput, FormTextarea } from "@/components/ui/form-input";
import { uploadImage } from "@/data/supabase";
import type { Book } from "@/types/type";
import { session } from "@/lib/session";

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

interface ItemRegistrationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editBook?: Book | null;
  onSuccess?: () => void;
}

const initialFormData: BookFormData = {
  isbn: "",
  title: "",
  author: "",
  publicationDate: "",
  description: "",
  categories: "",
  location: "",
  link: "",
};

export function ItemRegistrationDrawer({
  open,
  onOpenChange,
  editBook,
  onSuccess,
}: ItemRegistrationDrawerProps) {
  const [activeTab, setActiveTab] = useState<RegistrationTab>("manual");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<BookFormData>(initialFormData);

  const tManage = useTranslations("manage");
  const tBooks = useTranslations("books");
  const tCommon = useTranslations("common");
  const isEditMode = !!editBook;

  // Populate form when editing
  useEffect(() => {
    if (editBook) {
      setFormData({
        isbn: editBook.isbn || "",
        title: editBook.title,
        author: editBook.author || "",
        publicationDate: editBook.publicationDate || "",
        description: editBook.description || "",
        categories: editBook.categories?.join(", ") || "",
        location: editBook.location || "",
        link: editBook.link || "",
      });
      setCoverPreview(editBook.cover || null);
    } else {
      resetForm();
    }
  }, [editBook, open]);

  const resetForm = () => {
    setFormData(initialFormData);
    setCoverPreview(null);
    setCoverFile(null);
    setIsSuccess(false);
  };

  const handleCoverSelect = (file: File) => {
    setCoverFile(file);
    const previewUrl = URL.createObjectURL(file);
    setCoverPreview(previewUrl);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("Please enter the book title");
      return;
    }

    setIsSaving(true);
    try {
      const storeId = session.getItem("selectedStore");
      const accessToken = session.getItem("accessToken");

      if (!storeId) {
        throw new Error("No store found");
      }

      let coverUrl: string | undefined;
      if (coverFile) {
        try {
          coverUrl = await uploadImage(coverFile, "images", "books");
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
        .map((cat) => cat.trim())
        .filter((cat) => cat.length > 0);

      const bookPayload = {
        storeId,
        isbn: formData.isbn.trim() || undefined,
        title: formData.title.trim(),
        author: formData.author.trim() || undefined,
        cover: coverUrl || (isEditMode ? editBook?.cover : undefined),
        publicationDate: formData.publicationDate || undefined,
        description: formData.description.trim() || undefined,
        categories: categoriesArray.length > 0 ? categoriesArray : undefined,
        location: formData.location.trim() || undefined,
        link: formData.link.trim() || undefined,
      };

      const url = isEditMode ? `/api/books/${editBook?.id}` : "/api/books";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(bookPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${isEditMode ? "update" : "register"} book`);
      }

      setIsSaving(false);
      setIsSuccess(true);
      
      // Show success state briefly, then close the drawer
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      }, 1200);
    } catch (error) {
      console.error(`Failed to ${isEditMode ? "update" : "register"} book:`, error);
      alert(`Failed to ${isEditMode ? "update" : "register"} book. Please try again.`);
      setIsSaving(false);
    }
  };

  const isFormValid = formData.title.trim().length > 0;

  const tabs = [
    { id: "manual", label: tManage("manualEntry"), icon: PenLine },
    { id: "scan", label: tManage("scanISBN"), icon: Scan, disabled: true },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="relative border-b border-border pb-4">
          <DrawerTitle className="font-display text-lg font-semibold text-foreground">
            {isEditMode ? tManage("editItem") : tManage("registerItem")}
          </DrawerTitle>
          <DrawerClose className="absolute right-4 top-4 p-1 rounded-full hover:bg-muted transition-colors">
            <X size={20} className="text-muted-foreground" />
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 py-5 space-y-5">
          {!isEditMode && (
            <TabSwitcher
              tabs={tabs}
              activeTab={activeTab}
              onChange={(tab) => setActiveTab(tab as RegistrationTab)}
            />
          )}

          {activeTab === "manual" || isEditMode ? (
            <>
              <ImageUpload
                preview={coverPreview}
                onFileSelect={handleCoverSelect}
                label={tManage("uploadBookCover")}
              />

              <FormInput
                label={tBooks("isbn")}
                icon={BookOpen}
                name="isbn"
                value={formData.isbn}
                onChange={handleInputChange}
                placeholder={tManage("enterISBNPlaceholder")}
              />

              <FormInput
                label={tBooks("bookTitle")}
                icon={FileText}
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={tManage("enterBookTitle")}
                required
              />

              <FormInput
                label={tBooks("author")}
                icon={User}
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder={tManage("enterAuthorName")}
              />

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground/70 px-1">
                  <Calendar size={14} className="text-muted-foreground/70" />
                  {tBooks("publicationDate")}
                </label>
                <div className="bg-muted rounded-2xl overflow-hidden">
                  <input
                    type="date"
                    name="publicationDate"
                    value={formData.publicationDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 bg-transparent text-foreground focus:outline-none text-base dark:[color-scheme:dark] [color-scheme:light]"
                  />
                </div>
              </div>

              <FormInput
                label={tBooks("categories")}
                icon={Tag}
                name="categories"
                value={formData.categories}
                onChange={handleInputChange}
                placeholder={tManage("categoriesPlaceholder")}
              />

              <FormInput
                label={tCommon("location")}
                icon={MapPin}
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder={tManage("locationPlaceholder")}
              />

              <FormInput
                label={tBooks("externalLink")}
                icon={LinkIcon}
                name="link"
                value={formData.link}
                onChange={handleInputChange}
                placeholder={tManage("externalLinkPlaceholder")}
                type="url"
              />

              <FormTextarea
                label={tCommon("description")}
                icon={FileText}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder={tManage("enterBookDescription")}
                rows={4}
              />

              <button
                onClick={handleSubmit}
                disabled={isSaving || isSuccess || !isFormValid}
                className={cn(
                  "w-full py-4 rounded-2xl font-medium text-base transition-all mt-4 mb-4",
                  isSuccess
                    ? "bg-emerald-500 text-white"
                    : isFormValid
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                    : "bg-muted text-muted-foreground/70 cursor-not-allowed"
                )}
              >
                {isSuccess ? (
                  <span className="flex items-center justify-center gap-2">
                    <Check size={18} strokeWidth={2.5} />
                    {isEditMode ? tCommon("updated") : tCommon("registered")}
                  </span>
                ) : isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    {isEditMode ? tCommon("updating") : tCommon("registering")}
                  </span>
                ) : isEditMode ? (
                  tManage("updateBook")
                ) : (
                  tManage("registerBook")
                )}
              </button>
            </>
          ) : (
            <div className="bg-muted rounded-2xl p-12 flex flex-col items-center justify-center gap-4 min-h-[300px]">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <Scan size={36} className="text-muted-foreground/70" />
              </div>
              <div className="text-center">
                <p className="text-muted-foreground font-medium">{tManage("isbnScanning")}</p>
                <p className="text-muted-foreground/70 text-sm mt-1">
                  {tManage("isbnScanningComingSoon")}
                </p>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
