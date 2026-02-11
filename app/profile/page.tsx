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
  Clock,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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
function formatCountdown(daysRemaining: number, overdueText: string, oneDayText: string, daysText: string): string {
  if (daysRemaining <= 0) {
    return overdueText;
  } else if (daysRemaining === 1) {
    return oneDayText;
  } else {
    return daysText;
  }
}

// Compact book card for profile with countdown
function BorrowedBookCard({ book, onClick, unknownAuthorText, overdueText, oneDayText, daysTextFn }: { book: Book; onClick: () => void; unknownAuthorText: string; overdueText: string; oneDayText: string; daysTextFn: (count: number) => string }) {
  const daysRemaining = book.borrowedDate ? calculateDaysRemaining(book.borrowedDate) : null;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border hover:border-border transition-all text-left w-full"
    >
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
        {book.cover ? (
          <Image src={book.cover} alt={book.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={16} className="text-muted-foreground/70" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-medium text-foreground text-sm truncate">{book.title}</h4>
        <p className="text-xs text-muted-foreground truncate">{book.author || unknownAuthorText}</p>
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
            <span>{formatCountdown(daysRemaining, overdueText, oneDayText, daysTextFn(daysRemaining))}</span>
          </div>
        )}
      </div>
      <ChevronRight size={16} className="text-muted-foreground/70 flex-shrink-0" />
    </button>
  );
}

// Compact favorite book card
function FavoriteBookCard({ book, onClick }: { book: Book; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border hover:border-border transition-all text-left w-full"
    >
      <div className="w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
        {book.cover ? (
          <Image src={book.cover} alt={book.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={16} className="text-muted-foreground/70" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-medium text-foreground text-sm truncate">{book.title}</h4>
        <p className="text-xs text-muted-foreground truncate">{book.author || ""}</p>
      </div>
      <Heart size={16} className="text-rose-500 fill-rose-500 flex-shrink-0" />
      <ChevronRight size={16} className="text-muted-foreground/70 flex-shrink-0" />
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
      className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border hover:border-border transition-all text-left w-full"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted flex-shrink-0 relative">
        {event.cover ? (
          <Image src={event.cover} alt={event.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar size={16} className="text-muted-foreground/70" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-medium text-foreground text-sm truncate">{event.title}</h4>
        <p className="text-xs text-muted-foreground">{formatDate(event.startDate)}</p>
      </div>
      <span className={cn(
        "px-2 py-1 rounded-full text-[10px] font-medium flex-shrink-0",
        isUpcoming ? "bg-emerald-100 text-emerald-700" :
        isFinished ? "bg-muted text-muted-foreground" :
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <UserIcon size={48} className="text-muted-foreground/40 mb-4" />
        <p className="text-foreground/70 font-medium">{tCommon("notLoggedIn")}</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-muted-foreground underline"
        >
          {tCommon("goToHome")}
        </button>
      </div>
    );
  }

  // Generate dicebear avatar if no avatar
  const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}`;

  return (
    <div className="min-h-screen bg-secondary pb-24 lg:pb-6">
      <div className="relative">
        <PageHeader title={t("title")} showBack={false} />
        <div className="absolute right-4 top-3 z-50 flex items-center gap-0.5 lg:hidden">
          <ThemeToggle variant="icon" />
          <LanguageSwitcher variant="icon" />
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6 max-w-3xl mx-auto lg:px-8">
        {/* Profile Card */}
        <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted relative">
                <Image 
                  src={avatarUrl} 
                  alt={user.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <label className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                <Camera size={14} className="text-primary-foreground" />
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
                    className="w-full px-3 py-2 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-muted-foreground/70" />
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder={t("location")}
                      className="flex-1 px-3 py-2 rounded-xl bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving || !editName.trim()}
                      className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? tCommon("saving") : tCommon("save")}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(user.name);
                        setEditLocation(user.location || "");
                      }}
                      className="px-4 py-2 rounded-xl bg-muted text-foreground/70 text-sm font-medium hover:bg-muted transition-colors"
                    >
                      {tCommon("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg font-bold text-foreground truncate">{user.name}</h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Edit3 size={14} className="text-muted-foreground/70" />
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
                      <MapPin size={12} className="text-muted-foreground/70" />
                      <span className="text-sm text-muted-foreground">{user.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{borrowedBooks.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("borrowed")}</p>
                    </div>
                    <div className="w-px h-8 bg-muted" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{favoriteBooks.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("favorites")}</p>
                    </div>
                    <div className="w-px h-8 bg-muted" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{attendedEvents.length}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{tCommon("events")}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Display Page Setup */}
        <button
          onClick={() => router.push("/profile/display")}
          className="w-full bg-card rounded-2xl p-4 border border-border flex items-center gap-3 hover:border-muted-foreground/30 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <LayoutGrid size={18} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-medium text-foreground text-sm">{t("displayPage")}</h3>
            <p className="text-xs text-muted-foreground">
              {user.displayConfig?.enabled
                ? t("displayPageLive")
                : t("setupDisplayPage")}
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground/70 flex-shrink-0" />
        </button>

        {/* Tab Navigation */}
        <div className="bg-card rounded-2xl p-1.5 border border-border flex">
          <button
            onClick={() => handleTabChange("events")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
              activeTab === "events"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
                <h3 className="font-display font-semibold text-foreground">{t("myEvents")}</h3>
                <span className="text-xs text-muted-foreground">{attendedEvents.length} {tCommon("events")}</span>
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
                <div className="bg-background rounded-2xl p-6 border border-border">
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
                <h3 className="font-display font-semibold text-foreground">{t("borrowedBooks")}</h3>
                <span className="text-xs text-muted-foreground">{borrowedBooks.length} {tCommon("items")}</span>
              </div>
              {borrowedBooks.length > 0 ? (
                <div className="space-y-2">
                  {borrowedBooks.map((book) => (
                    <BorrowedBookCard 
                      key={book.id} 
                      book={book} 
                      onClick={() => handleViewBook(book.id)}
                      unknownAuthorText={t("unknownAuthor")}
                      overdueText={tCommon("overdue")}
                      oneDayText={tCommon("oneDayLeft")}
                      daysTextFn={(count: number) => tCommon("daysLeft", { count })}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-background rounded-2xl p-6 border border-border">
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
                <h3 className="font-display font-semibold text-foreground">{t("favoriteBooks")}</h3>
                <span className="text-xs text-muted-foreground">{favoriteBooks.length} {tCommon("items")}</span>
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
                <div className="bg-background rounded-2xl p-6 border border-border">
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
