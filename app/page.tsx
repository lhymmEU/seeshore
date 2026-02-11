"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { MobileWelcome, DesktopWelcome } from "@/components/welcome";
import { session } from "@/lib/session";

export default function WelcomePage() {
  const router = useRouter();
  const isDesktop = useIsDesktop();

  // Check for an existing valid session and auto-redirect
  useEffect(() => {
    if (session.isActive()) {
      const role = session.getRole();
      if (role === "owner" || role === "assistant") {
        router.replace("/manage");
        return;
      }
      if (role === "member" || role === "user") {
        router.replace("/items");
        return;
      }
    }
  }, [router]);

  const handleRoleSelected = (role: string) => {
    console.log("Selected role:", role);
  };

  // Avoid rendering until we know which layout to show (prevents flash)
  if (isDesktop === undefined) return null;

  return isDesktop ? (
    <DesktopWelcome onRoleSelected={handleRoleSelected} />
  ) : (
    <MobileWelcome onRoleSelected={handleRoleSelected} />
  );
}
