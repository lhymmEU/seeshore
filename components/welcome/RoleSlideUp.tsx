"use client";

import { useState } from "react";
import { X, Store, Headphones, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import { RoleType } from "./RoleCard";

interface RoleSlideUpProps {
  role: RoleType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue?: (role: RoleType, credentials: { username: string; password: string }) => void;
}

const roleDetails: Record<
  Exclude<RoleType, "user">,
  {
    icon: typeof Store;
    title: string;
    subtitle: string;
    features: string[];
    ctaText: string;
  }
> = {
  owner: {
    icon: Store,
    title: "Store Owner",
    subtitle: "Manage your bookstore with ease",
    features: [
      "Inventory management & tracking",
      "Sales analytics & reports",
      "Customer relationship tools",
      "Staff scheduling & permissions",
    ],
    ctaText: "Access Dashboard",
  },
  assistant: {
    icon: Headphones,
    title: "Store Assistant",
    subtitle: "Help customers find their perfect reads",
    features: [
      "Quick book search & lookup",
      "Customer assistance tools",
      "Inventory status checking",
      "Order processing & returns",
    ],
    ctaText: "Start Shift",
  },
};

export function RoleSlideUp({
  role,
  open,
  onOpenChange,
  onContinue,
}: RoleSlideUpProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Only show for owner and assistant roles
  if (!role || role === "user") return null;

  const details = roleDetails[role];
  const Icon = details.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onContinue && username && password) {
      onContinue(role, { username, password });
    }
  };

  const isFormValid = username.trim() !== "" && password.trim() !== "";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        {/* Close button */}
        <DrawerClose asChild>
          <button
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-zinc-100 transition-colors z-10"
            aria-label="Close"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </DrawerClose>

        <div className="px-6 pt-8 pb-8 flex flex-col gap-6">
          {/* Header with icon */}
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/20">
              <Icon size={32} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-zinc-900">
                {details.title}
              </h2>
              <p className="text-sm text-zinc-500">{details.subtitle}</p>
            </div>
          </div>

          {/* Features list */}
          <div className="bg-zinc-50 rounded-2xl p-5 space-y-3">
            {details.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-medium">
                    {index + 1}
                  </span>
                </div>
                <span className="text-sm text-zinc-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-sm font-medium text-zinc-700">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={!isFormValid}
              className="w-full rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn size={18} className="mr-2" />
              Sign In
            </Button>
          </form>

          {/* Footer note */}
          <p className="text-xs text-center text-zinc-400">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

