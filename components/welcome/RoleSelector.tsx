"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { RoleCard, RoleType } from "./RoleCard";
import { Button } from "@/components/ui/button";

interface RoleSelectorProps {
  onContinue?: (role: RoleType) => void;
}

const roles: RoleType[] = ["user", "assistant", "owner"];

export function RoleSelector({ onContinue }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);

  const handleContinue = () => {
    if (selectedRole && onContinue) {
      onContinue(selectedRole);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center px-4">
        <h2 className="text-lg font-semibold text-zinc-900">Choose your role</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Select how you&apos;ll be using Seashore Books
        </p>
      </div>

      {/* Horizontally scrollable role cards */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
        <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
          {roles.map((role) => (
            <RoleCard
              key={role}
              role={role}
              isSelected={selectedRole === role}
              onClick={() => setSelectedRole(role)}
            />
          ))}
        </div>
      </div>

      {/* Continue button */}
      <div className="px-4 pb-2">
        <Button
          onClick={handleContinue}
          disabled={!selectedRole}
          size="lg"
          className="w-full rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight size={18} className="ml-1" />
        </Button>
      </div>
    </div>
  );
}

