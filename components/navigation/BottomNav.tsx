"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Blocks, BookCheck, PartyPopper, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { session } from "@/lib/session";
import { useState } from "react";

interface NavItem {
  href: string;
  icon: typeof Blocks;
  labelKey: string;
  disabled?: boolean;
}

const baseNavConfigs: NavItem[] = [
  { href: "/collaborate", icon: Blocks, labelKey: "collaborate" },
  { href: "/items", icon: BookCheck, labelKey: "items" },
  { href: "/events", icon: PartyPopper, labelKey: "events" },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  
  // Initialize role synchronously from session
  const [isStaff] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const userRole = session.getItem("userRole");
    return userRole === "owner" || userRole === "assistant";
  });

  const navItems: NavItem[] = [
    ...baseNavConfigs,
    isStaff
      ? { href: "/manage", icon: Settings, labelKey: "manage" }
      : { href: "/profile", icon: User, labelKey: "profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border pb-safe z-50">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const isDisabled = item.disabled;
          const Icon = item.icon;
          const label = t(item.labelKey);

          if (isDisabled) {
            return (
              <div
                key={item.href}
                className="flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl text-muted-foreground/40 cursor-not-allowed"
              >
                <Icon size={24} strokeWidth={1.5} />
                <span className="text-xs font-medium">{label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
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
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
