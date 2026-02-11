"use client";

import { LucideIcon, User, Headphones, Store } from "lucide-react";
import { useTranslations } from "next-intl";

export type RoleType = "user" | "assistant" | "owner";

interface RoleCardProps {
  role: RoleType;
  isSelected?: boolean;
  onClick?: () => void;
}

const roleIcons: Record<RoleType, LucideIcon> = {
  user: User,
  assistant: Headphones,
  owner: Store,
};

const roleTranslationKeys: Record<RoleType, string> = {
  user: "member",
  assistant: "assistant",
  owner: "owner",
};

export function RoleCard({ role, isSelected = false, onClick }: RoleCardProps) {
  const t = useTranslations("roles");
  const translationKey = roleTranslationKeys[role];
  const Icon = roleIcons[role];

  return (
    <button
      onClick={onClick}
      className={`
        flex-shrink-0 w-[200px] p-5 rounded-2xl border-2 transition-all duration-200
        flex flex-col items-start gap-4 text-left
        ${
          isSelected
            ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            : "border-border bg-background hover:border-border hover:shadow-md"
        }
      `}
    >
      <div
        className={`
        w-12 h-12 rounded-xl flex items-center justify-center
        ${isSelected ? "bg-background/10" : "bg-muted"}
      `}
      >
        <Icon
          size={24}
          className={isSelected ? "text-primary-foreground" : "text-foreground/70"}
          strokeWidth={1.5}
        />
      </div>

      <div className="space-y-1">
        <h3
          className={`font-semibold text-base ${isSelected ? "text-primary-foreground" : "text-foreground"}`}
        >
          {t(`${translationKey}.title`)}
        </h3>
        <p
          className={`text-xs leading-relaxed ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}
        >
          {t(`${translationKey}.description`)}
        </p>
      </div>
    </button>
  );
}







