"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/manage", icon: Settings, label: "Manage" },
  { href: "/collaborate", icon: Users, label: "Collaborate" },
];

export function BottomNav() {
  const pathname = usePathname();

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

