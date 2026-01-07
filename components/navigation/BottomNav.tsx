"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Blocks, BookCheck, Handshake, Home, PartyPopper, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const baseNavItems: NavItem[] = [
  { href: "/collaborate", icon: Blocks, label: "Collaborate" },
  { href: "/items", icon: BookCheck, label: "Items" },
  { href: "/events", icon: PartyPopper, label: "Events" },
  { href: "/friends", icon: Handshake, label: "Friends" },
];

export function BottomNav() {
  const pathname = usePathname();
  
  // Initialize role synchronously from sessionStorage
  const [isStaff] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const userRole = sessionStorage.getItem("userRole");
    return userRole === "owner" || userRole === "assistant";
  });

  const navItems: NavItem[] = [
    ...baseNavItems,
    isStaff
      ? { href: "/manage", icon: Settings, label: "Manage" }
      : { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 pb-safe z-50">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/manage" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all",
                isActive
                  ? "text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2 : 1.5}
                className={cn(
                  "transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

