"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/navigation";
import { PageHeader } from "@/components/ui/page-header";
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
import { formatDate } from "@/lib/date-utils";
import type { User, Book, StoreEvent } from "@/types/type";

// Compact book card for profile
function BorrowedBookCard({ book, onClick }: { book: Book; onClick: () => void }) {
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
        <p className="text-xs text-zinc-500 truncate">{book.author || "Unknown Author"}</p>
        {book.borrowedDate && (
          <p className="text-[10px] text-amber-600 mt-1">
            Borrowed {formatDate(book.borrowedDate)}
          </p>
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
      className="flex-shrink-0 w-24 text-center"
    >
      <div className="w-24 h-32 rounded-xl overflow-hidden bg-zinc-100 shadow-sm hover:shadow-md transition-shadow relative">
        {book.cover ? (
          <Image src={book.cover} alt={book.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen size={24} className="text-zinc-400" />
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-700 font-medium mt-2 truncate">{book.title}</p>
    </button>
  );
}

// Compact event card for profile
function AttendedEventCard({ event, onClick }: { event: StoreEvent; onClick: () => void }) {
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
        event.status === "open" ? "bg-emerald-100 text-emerald-700" :
        event.status === "finished" ? "bg-zinc-100 text-zinc-600" :
        "bg-amber-100 text-amber-700"
      )}>
        {event.status === "open" ? "Upcoming" : event.status === "finished" ? "Completed" : event.status}
      </span>
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userId = sessionStorage.getItem("userId");
        const userRole = sessionStorage.getItem("userRole");
        
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

        // Fetch borrowed books
        if (userData.borrowed && userData.borrowed.length > 0) {
          const books = await fetchBooksByIds(userData.borrowed);
          setBorrowedBooks(books);
        }

        // Fetch favorite books
        if (userData.favoriteBooks && userData.favoriteBooks.length > 0) {
          const books = await fetchBooksByIds(userData.favoriteBooks);
          setFavoriteBooks(books);
        }

        // Fetch attended events
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
      const accessToken = sessionStorage.getItem("accessToken");
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
      const accessToken = sessionStorage.getItem("accessToken");
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
      sessionStorage.clear();
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
        <p className="text-zinc-600 font-medium">Not logged in</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 text-zinc-500 underline"
        >
          Go to home
        </button>
      </div>
    );
  }

  // Generate dicebear avatar if no avatar
  const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}`;

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <PageHeader title="Profile" showBack={false} />

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
                    placeholder="Your name"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-100 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  />
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-zinc-400" />
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="Location (optional)"
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-100 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving || !editName.trim()}
                      className="flex-1 py-2 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(user.name);
                        setEditLocation(user.location || "");
                      }}
                      className="px-4 py-2 rounded-xl bg-zinc-100 text-zinc-700 text-sm font-medium hover:bg-zinc-200 transition-colors"
                    >
                      Cancel
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
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Borrowed</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-200" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-zinc-900">{favoriteBooks.length}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Favorites</p>
                    </div>
                    <div className="w-px h-8 bg-zinc-200" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-zinc-900">{attendedEvents.length}</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Events</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Borrowed Books Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-900">Borrowed Books</h3>
            <span className="text-xs text-zinc-500">{borrowedBooks.length} items</span>
          </div>
          {borrowedBooks.length > 0 ? (
            <div className="space-y-2">
              {borrowedBooks.map((book) => (
                <BorrowedBookCard 
                  key={book.id} 
                  book={book} 
                  onClick={() => handleViewBook(book.id)} 
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-zinc-100">
              <EmptyState
                icon={BookOpen}
                title="No borrowed books"
                message="Browse the library to borrow books"
              />
            </div>
          )}
        </section>

        {/* Favorite Books Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-900">Favorites</h3>
            <span className="text-xs text-zinc-500">{favoriteBooks.length} items</span>
          </div>
          {favoriteBooks.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
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
                title="No favorites yet"
                message="Like books to add them here"
              />
            </div>
          )}
        </section>

        {/* Attended Events Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-zinc-900">My Events</h3>
            <span className="text-xs text-zinc-500">{attendedEvents.length} events</span>
          </div>
          {attendedEvents.length > 0 ? (
            <div className="space-y-2">
              {attendedEvents.slice(0, 3).map((event) => (
                <AttendedEventCard 
                  key={event.id} 
                  event={event} 
                  onClick={() => handleViewEvent(event.id)} 
                />
              ))}
              {attendedEvents.length > 3 && (
                <button
                  onClick={() => router.push("/events")}
                  className="w-full py-3 text-sm text-zinc-600 font-medium hover:text-zinc-900 transition-colors"
                >
                  View all {attendedEvents.length} events
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-zinc-100">
              <EmptyState
                icon={Calendar}
                title="No events yet"
                message="Join events to see them here"
              />
            </div>
          )}
        </section>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white border border-zinc-200 text-rose-600 font-medium hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <LogOut size={18} />
          )}
          {isLoggingOut ? "Logging out..." : "Log Out"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
