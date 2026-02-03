"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Store, 
  Users, 
  CalendarDays, 
  ClipboardList, 
  Package, 
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageLoader } from "@/components/ui/loading-spinner";

type UserRole = "owner" | "assistant";

interface DashboardCard {
  id: string;
  title: string;
  icon: typeof Store;
  href: string;
  size?: "large" | "medium" | "wide";
  disabled?: boolean;
}

const ownerCards: DashboardCard[] = [
  { id: "edit-bookstore", title: "Edit Bookstore", icon: Edit3, href: "/manage/bookstore", size: "large" },
  { id: "manage-roles", title: "Manage Roles", icon: Users, href: "/manage/roles", size: "medium", disabled: true },
  { id: "manage-events", title: "Manage Events", icon: CalendarDays, href: "/manage/events", size: "medium" },
  { id: "internal-tasks", title: "Manage Internal Tasks", icon: ClipboardList, href: "/manage/tasks", size: "medium", disabled: true },
  { id: "register-items", title: "Register Items", icon: Package, href: "/manage/items", size: "medium" },
];

const assistantCards: DashboardCard[] = [
  { id: "edit-bookstore", title: "Edit Bookstore", icon: Store, href: "/manage/bookstore", size: "large" },
  { id: "manage-roles", title: "Manage Roles", icon: Users, href: "/manage/roles", size: "medium", disabled: true },
  { id: "draft-events", title: "Draft Events", icon: CalendarDays, href: "/manage/events", size: "medium" },
  { id: "task-list", title: "Task List", icon: ClipboardList, href: "/manage/tasks", size: "medium", disabled: true },
  { id: "register-items", title: "Register Items", icon: Package, href: "/manage/items", size: "medium" },
];

function DashboardCardComponent({ card }: { card: DashboardCard }) {
  const Icon = card.icon;
  
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

  const enabledClasses = "bg-white border border-zinc-200/80 shadow-sm hover:shadow-md hover:border-zinc-300 active:scale-[0.98]";
  const disabledClasses = "bg-zinc-100/50 border border-zinc-200/50 cursor-not-allowed";

  const content = (
    <>
      <div className={cn(
        "flex items-center justify-center rounded-2xl transition-colors",
        card.size === "wide" ? "w-10 h-10" : "w-14 h-14",
        card.disabled 
          ? "bg-zinc-200/50" 
          : "bg-zinc-100 group-hover:bg-zinc-200/80"
      )}>
        <Icon 
          size={card.size === "wide" ? 20 : 26} 
          className={cn(
            "transition-colors",
            card.disabled ? "text-zinc-400" : "text-zinc-700"
          )} 
          strokeWidth={1.5} 
        />
      </div>
      <span className={cn(
        "font-medium tracking-tight",
        card.size === "wide" ? "text-sm" : "text-[13px]",
        card.disabled ? "text-zinc-400" : "text-zinc-800"
      )}>
        {card.title}
      </span>
      {card.disabled && (
        <span className={cn(
          "absolute text-[10px] font-medium text-zinc-400 uppercase tracking-wide",
          card.size === "wide" ? "right-4" : "bottom-3"
        )}>
          Coming Soon
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
  
  const [role] = useState<UserRole | null>(() => {
    if (typeof window === "undefined") return null;
    const storedRole = sessionStorage.getItem("userRole") as UserRole | null;
    return storedRole === "owner" || storedRole === "assistant" ? storedRole : null;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = sessionStorage.getItem("userRole") as UserRole | null;
      if (!storedRole || (storedRole !== "owner" && storedRole !== "assistant")) {
        router.push("/");
      }
    }
  }, [router]);

  if (!role) {
    return <PageLoader />;
  }

  const cards = role === "owner" ? ownerCards : assistantCards;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="px-4 pt-14 pb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => (
            <DashboardCardComponent key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
