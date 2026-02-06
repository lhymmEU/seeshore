"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  User as UserIcon,
  Loader2,
  Search,
  BookOpen,
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
  DrawerFooter,
} from "@/components/ui/drawer";
import type { Book, User } from "@/types/type";
import { session } from "@/lib/session";

interface BorrowDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: Book | null;
  onSuccess?: () => void;
}

export function BorrowDrawer({
  open,
  onOpenChange,
  book,
  onSuccess,
}: BorrowDrawerProps) {
  const [inputValue, setInputValue] = useState("");
  const [members, setMembers] = useState<User[]>([]);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLending, setIsLending] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset state when drawer opens/closes
  useEffect(() => {
    if (!open) {
      setInputValue("");
      setMembers([]);
      setSelectedMember(null);
      setShowDropdown(false);
      setIsSuccess(false);
    }
  }, [open]);

  // Search for members when input contains @
  const searchMembers = useCallback(async (query: string) => {
    const storeId = session.getItem("selectedStore");
    if (!storeId) return;

    setIsSearching(true);
    try {
      const url = query
        ? `/api/members?storeId=${storeId}&q=${encodeURIComponent(query)}`
        : `/api/members?storeId=${storeId}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error("Failed to search members:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Check if @ is typed
    if (value.includes("@")) {
      const searchQuery = value.split("@").pop() || "";
      setShowDropdown(true);
      searchMembers(searchQuery);
    } else {
      setShowDropdown(false);
      setMembers([]);
    }
    
    // Clear selected member if input changes
    if (selectedMember && value !== `@${selectedMember.name}`) {
      setSelectedMember(null);
    }
  };

  // Handle member selection
  const handleSelectMember = (member: User) => {
    setSelectedMember(member);
    setInputValue(`@${member.name}`);
    setShowDropdown(false);
  };

  // Handle lend button click
  const handleLend = async () => {
    if (!selectedMember || !book) return;

    setIsLending(true);
    try {
      const accessToken = session.getItem("accessToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`/api/books/${book.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          status: "borrowed",
          borrowerId: selectedMember.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to lend book");
      }

      setIsSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 1000);
    } catch (error) {
      console.error("Failed to lend book:", error);
      alert("Failed to lend book. Please try again.");
    } finally {
      setIsLending(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate avatar URL
  const getAvatarUrl = (member: User) => {
    return member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.id)}`;
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-zinc-100">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-lg font-semibold">
              Lend Book
            </DrawerTitle>
            <DrawerClose className="p-2 rounded-full hover:bg-zinc-100 transition-colors">
              <X size={20} className="text-zinc-500" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Book Info */}
          {book && (
            <div className="flex gap-4 p-4 bg-zinc-50 rounded-2xl">
              <div className="w-16 h-22 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 relative">
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
                    <BookOpen size={20} className="text-zinc-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-900 line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">
                  {book.author || "Unknown Author"}
                </p>
              </div>
            </div>
          )}

          {/* Member Search Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-700">
              Select Member
            </label>
            <p className="text-xs text-zinc-500">
              Type @ to search for a member
            </p>
            <div className="relative">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Type @ to search members..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-100 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 transition-all"
                />
                {isSearching && (
                  <Loader2
                    size={18}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin"
                  />
                )}
              </div>

              {/* Member Dropdown */}
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-zinc-200 shadow-lg max-h-64 overflow-y-auto z-50"
                >
                  {members.length > 0 ? (
                    members.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleSelectMember(member)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 flex-shrink-0 relative">
                          <Image
                            src={getAvatarUrl(member)}
                            alt={member.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-zinc-900 truncate">
                            {member.name}
                          </p>
                          {member.location && (
                            <p className="text-xs text-zinc-500 truncate">
                              {member.location}
                            </p>
                          )}
                        </div>
                      </button>
                    ))
                  ) : isSearching ? (
                    <div className="p-4 text-center text-zinc-500">
                      <Loader2 size={20} className="animate-spin mx-auto mb-2" />
                      <p className="text-sm">Searching...</p>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-zinc-500">
                      <UserIcon size={20} className="mx-auto mb-2 text-zinc-400" />
                      <p className="text-sm">No members found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Member Display */}
            {selectedMember && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-100 flex-shrink-0 relative">
                  <Image
                    src={getAvatarUrl(selectedMember)}
                    alt={selectedMember.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-emerald-900 truncate">
                    {selectedMember.name}
                  </p>
                  <p className="text-xs text-emerald-700">
                    Selected as borrower
                  </p>
                </div>
                <Check size={20} className="text-emerald-600 flex-shrink-0" />
              </div>
            )}
          </div>
        </div>

        <DrawerFooter className="border-t border-zinc-100">
          <button
            onClick={handleLend}
            disabled={!selectedMember || isLending || isSuccess}
            className={cn(
              "w-full py-3.5 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2",
              selectedMember && !isLending && !isSuccess
                ? "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-[0.98]"
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
            )}
          >
            {isSuccess ? (
              <>
                <Check size={20} />
                Book Lent Successfully
              </>
            ) : isLending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Lending...
              </>
            ) : (
              "Lend Book"
            )}
          </button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
