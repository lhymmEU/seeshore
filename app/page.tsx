"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { RoleSelector, StepsBanner } from "@/components/welcome";
import { session } from "@/lib/session";

export default function WelcomePage() {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const t = useTranslations("welcome");

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
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main content area */}
      <main className="flex-1 flex flex-col justify-center px-6 py-12 gap-6">
        {/* Steps animation banner */}
        <StepsBanner />

        {/* Title row with language switcher */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
            {t("storeName")}
          </h1>
          <LanguageSwitcher variant="full" />
        </div>

        {/* Description */}
        <p className="text-zinc-500 text-sm leading-relaxed">
          {t("storeDescription")}
        </p>

        {/* Hero image carousel */}
        <Carousel opts={{ loop: true }} className="w-full">
          <CarouselContent>
            {[1, 2, 3].map((i) => (
              <CarouselItem key={i}>
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
                  <Image
                    src={`/welcome-pic-${i}.png`}
                    alt={`${t("storeName")} ${i}`}
                    fill
                    className="object-cover"
                    priority={i === 1}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* CTA Button with Drawer */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              size="lg"
              className="w-full rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-900/10"
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
    </div>
  );
}
