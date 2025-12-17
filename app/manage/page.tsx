"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Store, 
  Users, 
  CalendarDays, 
  ClipboardList, 
  Package, 
  Wallet,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";

type UserRole = "owner" | "assistant";

interface DashboardCard {
  id: string;
  title: string;
  icon: typeof Store;
  href: string;
  size?: "large" | "medium" | "wide";
}

const ownerCards: DashboardCard[] = [
  { id: "edit-bookstore", title: "Create / Edit Bookstore", icon: Edit3, href: "/manage/bookstore", size: "large" },
  { id: "manage-roles", title: "Manage Roles", icon: Users, href: "/manage/roles", size: "medium" },
  { id: "manage-events", title: "Manage Events", icon: CalendarDays, href: "/manage/events", size: "medium" },
  { id: "internal-tasks", title: "Manage Internal Tasks", icon: ClipboardList, href: "/manage/tasks", size: "medium" },
  { id: "register-items", title: "Register Items", icon: Package, href: "/manage/items", size: "medium" },
  { id: "manage-spending", title: "Manage Spending", icon: Wallet, href: "/manage/spending", size: "wide" },
];

const assistantCards: DashboardCard[] = [
  { id: "edit-bookstore", title: "Edit Bookstore", icon: Store, href: "/manage/bookstore", size: "large" },
  { id: "manage-roles", title: "Manage Roles", icon: Users, href: "/manage/roles", size: "medium" },
  { id: "draft-events", title: "Draft Events", icon: CalendarDays, href: "/manage/events", size: "medium" },
  { id: "task-list", title: "Task List", icon: ClipboardList, href: "/manage/tasks", size: "medium" },
  { id: "register-items", title: "Register Items", icon: Package, href: "/manage/items", size: "medium" },
];

function DashboardCardComponent({ card }: { card: DashboardCard }) {
  const Icon = card.icon;
  
  const sizeClasses = {
    large: "col-span-2 h-40",
    medium: "col-span-1 h-36",
    wide: "col-span-2 h-16",
  };

  return (
    <button
      className={cn(
        "bg-zinc-200/80 rounded-2xl p-4 flex items-center transition-all active:scale-[0.98] hover:bg-zinc-300/80",
        sizeClasses[card.size || "medium"],
        card.size === "wide" ? "justify-center" : "justify-center flex-col gap-2"
      )}
    >
      {card.size !== "wide" && (
        <Icon size={24} className="text-zinc-600" strokeWidth={1.5} />
      )}
      <span className={cn(
        "font-medium text-zinc-800",
        card.size === "wide" ? "text-base" : "text-sm"
      )}>
        {card.title}
      </span>
    </button>
  );
}

export default function ManagePage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Get role from sessionStorage (set during login)
    const storedRole = sessionStorage.getItem("userRole") as UserRole | null;
    
    if (!storedRole || (storedRole !== "owner" && storedRole !== "assistant")) {
      // Redirect to home if not logged in as owner or assistant
      router.push("/");
      return;
    }
    
    setRole(storedRole);
  }, [router]);

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  const cards = role === "owner" ? ownerCards : assistantCards;

  return (
    <div className="px-4 pt-12 pb-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <DashboardCardComponent key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

