"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { 
  Store, 
  Users, 
  CalendarDays, 
  ClipboardList, 
  Package, 
  Edit3,
  Star,
  LogOut,
  Loader2,
  Ticket
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui/loading-spinner";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logout } from "@/data/supabase";
import { session } from "@/lib/session";
import type { Book } from "@/types/type";

type UserRole = "owner" | "assistant";

interface DashboardCard {
  id: string;
  titleKey: string;
  icon: typeof Store;
  href: string;
  size?: "large" | "medium" | "wide";
  disabled?: boolean;
}

// Calculate days remaining for a borrowed book (30-day lending period)
function calculateDaysRemaining(borrowedDate: string): number {
  const borrowed = new Date(borrowedDate);
  const dueDate = new Date(borrowed);
  dueDate.setDate(dueDate.getDate() + 30);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

const ownerCardConfigs: DashboardCard[] = [
  { id: "edit-bookstore", titleKey: "editBookstore", icon: Edit3, href: "/manage/bookstore", size: "large" },
  { id: "featured-books", titleKey: "thisWeeksBooks", icon: Star, href: "/manage/featured", size: "medium" },
  { id: "manage-events", titleKey: "manageEvents", icon: CalendarDays, href: "/manage/events", size: "medium" },
  { id: "invitation-code", titleKey: "invitationCode", icon: Ticket, href: "/manage/invitation-codes", size: "medium" },
  { id: "register-items", titleKey: "manageItems", icon: Package, href: "/manage/items", size: "medium" },
];

const assistantCardConfigs: DashboardCard[] = [
  { id: "edit-bookstore", titleKey: "editBookstore", icon: Store, href: "/manage/bookstore", size: "large" },
  { id: "manage-roles", titleKey: "manageRoles", icon: Users, href: "/manage/roles", size: "medium", disabled: true },
  { id: "draft-events", titleKey: "draftEvents", icon: CalendarDays, href: "/manage/events", size: "medium" },
  { id: "task-list", titleKey: "taskList", icon: ClipboardList, href: "/manage/tasks", size: "medium", disabled: true },
  { id: "register-items", titleKey: "registerItems", icon: Package, href: "/manage/items", size: "medium" },
];

function DashboardCardComponent({ card, title, comingSoonText, dueSoonText, alertCount }: { card: DashboardCard; title: string; comingSoonText: string; dueSoonText: string; alertCount?: number }) {
  const Icon = card.icon;
  const hasAlert = alertCount !== undefined && alertCount > 0;
  
  const sizeClasses = {
    large: "col-span-2 h-40",
    medium: "col-span-1 h-36",
    wide: "col-span-2 h-14",
  };

  const baseClasses = cn(
    "relative rounded-3xl flex items-center transition-all duration-200",
    sizeClasses[card.size || "medium"],
    card.size === "wide" ? "justify-center gap-3" : "justify-center flex-col gap-3"
  );

  const enabledClasses = cn(
    "shadow-sm hover:shadow-md active:scale-[0.98]",
    hasAlert
      ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 hover:border-amber-400"
      : "bg-card border border-border hover:border-muted-foreground/30"
  );
  const disabledClasses = "bg-secondary/50 border border-border/50 cursor-not-allowed";

  const content = (
    <>
      {/* Alert badge */}
      {hasAlert && (
        <div className="absolute top-3 right-3 flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold shadow-sm animate-in fade-in zoom-in duration-300">
          {alertCount}
        </div>
      )}
      <div className={cn(
        "relative flex items-center justify-center rounded-2xl transition-colors",
        card.size === "wide" ? "w-10 h-10" : "w-14 h-14",
        card.disabled 
          ? "bg-muted/50" 
          : hasAlert
          ? "bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200/80 dark:group-hover:bg-amber-800/40"
          : "bg-secondary group-hover:bg-muted"
      )}>
        <Icon 
          size={card.size === "wide" ? 20 : 26} 
          className={cn(
            "transition-colors",
            card.disabled ? "text-muted-foreground/50" : hasAlert ? "text-amber-700 dark:text-amber-400" : "text-foreground/70"
          )} 
          strokeWidth={1.5} 
        />
      </div>
      <span className={cn(
        "font-medium tracking-tight",
        card.size === "wide" ? "text-sm" : "text-[13px]",
        card.disabled ? "text-muted-foreground/50" : hasAlert ? "text-amber-900 dark:text-amber-300" : "text-foreground/80"
      )}>
        {title}
      </span>
      {hasAlert && (
        <span className="text-[10px] font-medium text-amber-600">
          {dueSoonText}
        </span>
      )}
      {card.disabled && (
        <span className={cn(
          "absolute text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wide",
          card.size === "wide" ? "right-4" : "bottom-3"
        )}>
          {comingSoonText}
        </span>
      )}
    </>
  );

  if (card.disabled) {
    return (
      <div className={cn(baseClasses, disabledClasses, "p-4")}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={card.href}
      className={cn(baseClasses, enabledClasses, "p-4 group")}
    >
      {content}
    </Link>
  );
}

export default function ManagePage() {
  const router = useRouter();
  const t = useTranslations("manage");
  const tCommon = useTranslations("common");
  
  const [role] = useState<UserRole | null>(() => {
    if (typeof window === "undefined") return null;
    const storedRole = session.getItem("userRole") as UserRole | null;
    return storedRole === "owner" || storedRole === "assistant" ? storedRole : null;
  });
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);

  // Count of borrowed items due within 7 days (or overdue)
  const dueSoonCount = useMemo(() => {
    return books.filter((book) => {
      if (book.status !== "borrowed" || !book.borrowedDate) return false;
      const daysRemaining = calculateDaysRemaining(book.borrowedDate);
      return daysRemaining <= 7;
    }).length;
  }, [books]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = session.getItem("userRole") as UserRole | null;
      if (!storedRole || (storedRole !== "owner" && storedRole !== "assistant")) {
        router.push("/");
      }
    }
  }, [router]);

  // Fetch books to check for due-soon alerts
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const storeId = session.getItem("selectedStore");
        const url = storeId ? `/api/books?storeId=${storeId}` : "/api/books";
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setBooks(data);
        }
      } catch (error) {
        console.error("Failed to fetch books for alerts:", error);
      }
    };
    fetchBooks();
  }, []);

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

  if (!role) {
    return <PageLoader />;
  }

  const cardConfigs = role === "owner" ? ownerCardConfigs : assistantCardConfigs;

  return (
    <div className="min-h-screen bg-secondary">
      <div className="px-4 pt-14 pb-8 max-w-5xl mx-auto lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">{t("dashboard")}</h1>
          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle variant="icon" />
            <LanguageSwitcher variant="full" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {cardConfigs.map((card) => (
            <DashboardCardComponent 
              key={card.id} 
              card={card} 
              title={t(card.titleKey)}
              comingSoonText={tCommon("comingSoon")}
              dueSoonText={t("dueSoon")}
              alertCount={card.id === "register-items" ? dueSoonCount : undefined}
            />
          ))}
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 py-4 mt-6 rounded-2xl bg-card border border-border text-rose-600 dark:text-rose-400 font-medium hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-200 dark:hover:border-rose-800 transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <LogOut size={18} />
          )}
          {isLoggingOut ? tCommon("loggingOut") : tCommon("logOut")}
        </button>
      </div>
    </div>
  );
}
