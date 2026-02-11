"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Blocks, BookCheck, PartyPopper, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { session } from "@/lib/session";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
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

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tWelcome = useTranslations("welcome");

  const [isStaff] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const userRole = session.getItem("userRole");
    return userRole === "owner" || userRole === "assistant";
  });

  // Don't render sidebar on welcome page
  if (pathname === "/") return null;

  const navItems: NavItem[] = [
    ...baseNavConfigs,
    isStaff
      ? { href: "/manage", icon: Settings, labelKey: "manage" }
      : { href: "/profile", icon: User, labelKey: "profile" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Brand */}
      <div className="px-6 pt-8 pb-6">
        <Link href="/" className="block">
          <h1 className="font-display text-xl font-bold text-sidebar-foreground tracking-tight">
            {tWelcome("storeName")}
          </h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const label = t(item.labelKey);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2 : 1.5}
                className="shrink-0"
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="px-4 pb-6 pt-4 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between">
          <ThemeToggle variant="icon" />
          <LanguageSwitcher variant="full" />
        </div>
      </div>
    </aside>
  );
}
