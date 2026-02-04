"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Logo, WelcomeHero, Footer, RoleSelector } from "@/components/welcome";

export default function WelcomePage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const t = useTranslations("welcome");

  const handleRoleSelected = (role: string) => {
    console.log("Selected role:", role);
    // TODO: Navigate to the appropriate page based on role
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-10">
        <LanguageSwitcher variant="full" />
      </div>

      {/* Main content area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 gap-8">
        {/* Logo */}
        <Logo size="lg" />

        {/* Store name and description */}
        <div className="text-center space-y-3 max-w-xs">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            {t("storeName")}
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            {t("storeDescription")}
          </p>
        </div>

        {/* Hero illustration */}
        <WelcomeHero />

        {/* CTA Button with Drawer */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              size="lg"
              className="w-full max-w-xs rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-900/10"
            >
              {t("getStarted")}
              <ArrowRight size={18} className="ml-1" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="pb-6">
            <div className="pt-4">
              <RoleSelector onContinue={handleRoleSelected} />
            </div>
          </DrawerContent>
        </Drawer>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
