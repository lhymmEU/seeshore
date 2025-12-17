"use client";

import { LucideIcon, User, Headphones, Store } from "lucide-react";

export type RoleType = "user" | "assistant" | "owner";

interface RoleCardProps {
  role: RoleType;
  isSelected?: boolean;
  onClick?: () => void;
}

const roleConfig: Record<
  RoleType,
  {
    icon: LucideIcon;
    title: string;
    description: string;
  }
> = {
  user: {
    icon: User,
    title: "Reader",
    description: "Browse and discover books, manage your reading list",
  },
  assistant: {
    icon: Headphones,
    title: "Assistant",
    description: "Help customers find their perfect reads",
  },
  owner: {
    icon: Store,
    title: "Owner",
    description: "Manage your bookstore inventory and sales",
  },
};

export function RoleCard({ role, isSelected = false, onClick }: RoleCardProps) {
  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 w-[200px] p-5 rounded-2xl border-2 transition-all duration-200
        flex flex-col items-start gap-4 text-left
        ${
          isSelected
            ? "border-zinc-900 bg-zinc-900 text-white shadow-lg shadow-zinc-900/20"
            : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md"
        }
      `}
    >
      <div
        className={`
        w-12 h-12 rounded-xl flex items-center justify-center
        ${isSelected ? "bg-white/10" : "bg-zinc-100"}
      `}
      >
        <Icon
          size={24}
          className={isSelected ? "text-white" : "text-zinc-700"}
          strokeWidth={1.5}
        />
      </div>

      <div className="space-y-1">
        <h3
          className={`font-semibold text-base ${isSelected ? "text-white" : "text-zinc-900"}`}
        >
          {config.title}
        </h3>
        <p
          className={`text-xs leading-relaxed ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}
        >
          {config.description}
        </p>
      </div>
    </button>
  );
}

