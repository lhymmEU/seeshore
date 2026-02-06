"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { 
  User as UserIcon, 
  BookOpen, 
  Heart, 
  Calendar, 
  LogOut,
  MapPin,
  Camera,
  Edit3,
  ChevronRight,
  Loader2,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { PageLoader } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { 
  fetchUser, 
  fetchBooksByIds, 
  fetchEventsByIds, 
  updateUserProfile,
  uploadImage,
  logout 
} from "@/data/supabase";
import { formatDate, isEventPastDeadline } from "@/lib/date-utils";
import { session } from "@/lib/session";
import type { User, Book, StoreEvent } from "@/types/type";

// Calculate days remaining for a borrowed book (30-day lending period)
function calculateDaysRemaining(borrowedDate: string): number {
  const borrowed = new Date(borrowedDate);
  const dueDate = new Date(borrowed);
  dueDate.setDate(dueDate.getDate() + 30);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Format the countdown display
function formatCountdown(daysRemaining: number): string {
  if (daysRemaining <= 0) {
    return "Overdue";
  } else if (daysRemaining === 1) {
    return "1 day left";
  } else {
    return `${daysRemaining} days`;
  }
}

// Compact book card for profile with countdown
function BorrowedBookCard({ book, onClick, unknownAuthorText }: { book: Book; onClick: () => void; unknownAuthorText: string }) {
  const daysRemaining = book.borrowedDate ? calculateDaysRemaining(book.borrowedDate) : null;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 transition-all text-left w-full"
    >
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 relative">
        {book.cover ? (
          <Image src={book.cover} alt={book.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={16} className="text-zinc-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-zinc-900 text-sm truncate">{book.title}</h4>
        <p className="text-xs text-zinc-500 truncate">{book.author || unknownAuthorText}</p>
        {daysRemaining !== null && (
          <div
            className={cn(
              "flex items-center gap-1 mt-1.5 text-[10px] font-medium",
              daysRemaining <= 0
                ? "text-red-600"
                : daysRemaining <= 7
                ? "text-amber-600"
                : "text-blue-600"
            )}
          >
            <Clock size={10} />
            <span>{formatCountdown(daysRemaining)}</span>
          </div>
        )}
      </div>
      <ChevronRight size={16} className="text-zinc-400 flex-shrink-0" />
    </button>
  );
}

// Compact favorite book card
function FavoriteBookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 transition-all text-left w-full"
    >
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 relative">
        {book.cover ? (
          <Image src={book.cover} alt={book.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={16} className="text-zinc-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-zinc-900 text-sm truncate">{book.title}</h4>
        <p className="text-xs text-zinc-500 truncate">{book.author || ""}</p>
      </div>
      <Heart size={16} className="text-rose-500 fill-rose-500 flex-shrink-0" />
      <ChevronRight size={16} className="text-zinc-400 flex-shrink-0" />
    </button>
  );
}

// Compact event card for profile
function AttendedEventCard({ event, onClick, upcomingText, completedText }: { event: StoreEvent; onClick: () => void; upcomingText: string; completedText: string }) {
  // Determine if event is finished (either by status or past deadline)
  const isFinished = event.status === "finished" || isEventPastDeadline(event.endDate);
  // Event is upcoming only if it's open and not past deadline
  const isUpcoming = event.status === "open" && !isEventPastDeadline(event.endDate);
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 transition-all text-left w-full"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 flex-shrink-0 relative">
        {event.cover ? (
          <Image src={event.cover} alt={event.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar size={16} className="text-zinc-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-zinc-900 text-sm truncate">{event.title}</h4>
        <p className="text-xs text-zinc-500">{formatDate(event.startDate)}</p>
      </div>
      <span className={cn(
        "px-2 py-1 rounded-full text-[10px] font-medium flex-shrink-0",
        isUpcoming ? "bg-emerald-100 text-emerald-700" :
        isFinished ? "bg-zinc-100 text-zinc-600" :
        "bg-amber-100 text-amber-700"
      )}>
        {isUpcoming ? upcomingText : isFinished ? completedText : event.status}
      </span>
    </button>
  );
}

type ProfileTab = "events" | "borrowed" | "favorites";

export default function ProfilePage() {
  const router = useRouter();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [favoriteBooks, setFavoriteBooks] = useState<Book[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<StoreEvent[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("events");
  const [loadedTabs, setLoadedTabs] = useState<Set<ProfileTab>>(new Set(["events"]));

  // Load tab-specific data
  const loadTabData = async (tab: ProfileTab, userData: User) => {
    try {
      if (tab === "borrowed" && userData.borrowed && userData.borrowed.length > 0) {
        const books = await fetchBooksByIds(userData.borrowed);
        setBorrowedBooks(books);
      } else if (tab === "favorites" && userData.favoriteBooks && userData.favoriteBooks.length > 0) {
        const books = await fetchBooksByIds(userData.favoriteBooks);
        setFavoriteBooks(books);
      } else if (tab === "events" && userData.attendedEvents && userData.attendedEvents.length > 0) {
        const events = await fetchEventsByIds(userData.attendedEvents);
        setAttendedEvents(events);
      }
    } catch (error) {
      console.error(`Failed to load ${tab} data:`, error);
    }
  };

  // Handle tab switching with lazy loading
  const handleTabChange = async (tab: ProfileTab) => {
    setActiveTab(tab);
    if (!loadedTabs.has(tab) && user) {
      setLoadedTabs((prev) => new Set(prev).add(tab));
      await loadTabData(tab, user);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userId = session.getItem("userId");
        const userRole = session.getItem("userRole");
        
        if (!userId) {
          router.push("/");
          return;
        }

        // Redirect staff to manage page
        if (userRole === "owner" || userRole === "assistant") {
          router.push("/manage");
          return;
        }

        // Fetch user data
        const userData = await fetchUser(userId);
        setUser(userData);
        setEditName(userData.name);
        setEditLocation(userData.location || "");

        // Only fetch events data initially (default tab)
        if (userData.attendedEvents && userData.attendedEvents.length > 0) {
          const events = await fetchEventsByIds(userData.attendedEvents);
          setAttendedEvents(events);
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsSaving(true);
    try {
      const accessToken = session.getItem("accessToken");
      const avatarUrl = await uploadImage(file, "images", "avatars");
      const updatedUser = await updateUserProfile(user.id, { avatar: avatarUrl }, accessToken || undefined);
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user || !editName.trim()) return;

    setIsSaving(true);
    try {
      const accessToken = session.getItem("accessToken");
      const updatedUser = await updateUserProfile(
        user.id, 
        { 
          name: editName.trim(),
          location: editLocation.trim() || undefined
        }, 
        accessToken || undefined
      );
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      session.clear();
      router.push("/");
    } catch (error) {
      console.error("Failed to logout:", error);
      alert("Failed to logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleViewBook = (bookId: string) => {
    router.push(`/items/${bookId}`);
  };

  const handleViewEvent = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <UserIcon size={48} className="text-zinc-300 mb-4" />
        <p className="text-zinc-600 font-medium">{tCommon("notLoggedIn")}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-zinc-500 underline"
        >
          {tCommon("goToHome")}
        </button>
      </div>
    );
  }

  // Generate dicebear avatar if no avatar
  const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}`;

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <div className="relative">
        <PageHeader title={t("title")} showBack={false} />
        <div className="absolute right-4 top-3 z-50">
          <LanguageSwitcher variant="icon" />
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-100 relative">
                <Image 
                  src={avatarUrl} 
                  alt={user.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors">
                <Camera size={14} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isSaving}
                />
              </label>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder={t("yourName")}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-100 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-zinc-400" />
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder={t("location")}
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-100 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving || !editName.trim()}
                      className="flex-1 py-2 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? tCommon("saving") : tCommon("save")}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(user.name);
                        setEditLocation(user.location || "");
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-sm font-medium hover:bg-zinc-200 transition-colors"
                    >
                      {tCommon("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-900 truncate">{user.name}</h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                      <Edit3 size={14} className="text-zinc-400" />
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="p-1.5 rounded-lg hover:bg-rose-50 transition-colors ml-auto disabled:opacity-50"
                      title={tCommon("logOut")}
                    >
                      {isLoggingOut ? (
                        <Loader2 size={14} className="text-rose-500 animate-spin" />
                      ) : (
                        <LogOut size={14} className="text-rose-500" />
                      )}
                    </button>
                  </div>
                  {user.location && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin size={12} className="text-zinc-400" />
                      <span className="text-sm text-zinc-500">{user.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-zinc-900">{borrowedBooks.length}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{t("borrowed")}</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-200" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-zinc-900">{favoriteBooks.length}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{t("favorites")}</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-200" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-zinc-900">{attendedEvents.length}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{tCommon("events")}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-1.5 border border-zinc-100 flex">
          <button
            onClick={() => handleTabChange("events")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
              activeTab === "events"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <Calendar size={16} />
            <span>{t("myEvents")}</span>
          </button>
          <button
            onClick={() => handleTabChange("borrowed")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
              activeTab === "borrowed"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <BookOpen size={16} />
            <span>{t("borrowed")}</span>
          </button>
          <button
            onClick={() => handleTabChange("favorites")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
              activeTab === "favorites"
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
            )}
          >
            <Heart size={16} />
            <span>{t("favorites")}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {/* My Events Tab */}
          {activeTab === "events" && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900">{t("myEvents")}</h3>
                <span className="text-xs text-zinc-500">{attendedEvents.length} {tCommon("events")}</span>
              </div>
              {attendedEvents.length > 0 ? (
                <div className="space-y-2">
                  {attendedEvents.map((event) => (
                    <AttendedEventCard 
                      key={event.id} 
                      event={event} 
                      onClick={() => handleViewEvent(event.id)}
                      upcomingText={t("upcoming")}
                      completedText={t("completed")}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-zinc-100">
                  <EmptyState
                    icon={Calendar}
                    title={t("noEvents")}
                    message={t("joinEvents")}
                  />
                </div>
              )}
            </section>
          )}

          {/* Borrowed Books Tab */}
          {activeTab === "borrowed" && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900">{t("borrowedBooks")}</h3>
                <span className="text-xs text-zinc-500">{borrowedBooks.length} {tCommon("items")}</span>
              </div>
              {borrowedBooks.length > 0 ? (
                <div className="space-y-2">
                  {borrowedBooks.map((book) => (
                    <BorrowedBookCard 
                      key={book.id} 
                      book={book} 
                      onClick={() => handleViewBook(book.id)}
                      unknownAuthorText={t("unknownAuthor")}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-zinc-100">
                  <EmptyState
                    icon={BookOpen}
                    title={t("noBorrowedBooks")}
                    message={t("browseLibrary")}
                  />
                </div>
              )}
            </section>
          )}

          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-zinc-900">{t("favoriteBooks")}</h3>
                <span className="text-xs text-zinc-500">{favoriteBooks.length} {tCommon("items")}</span>
              </div>
              {favoriteBooks.length > 0 ? (
                <div className="space-y-2">
                  {favoriteBooks.map((book) => (
                    <FavoriteBookCard 
                      key={book.id} 
                      book={book} 
                      onClick={() => handleViewBook(book.id)} 
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-zinc-100">
                  <EmptyState
                    icon={Heart}
                    title={t("noFavorites")}
                    message={t("likeBooks")}
                  />
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
