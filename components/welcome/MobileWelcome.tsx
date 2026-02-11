"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { RoleSelector, StepsBanner } from "@/components/welcome";

interface MobileWelcomeProps {
  onRoleSelected: (role: string) => void;
}

export function MobileWelcome({ onRoleSelected }: MobileWelcomeProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const t = useTranslations("welcome");

  useEffect(() => {
    if (!carouselApi) return;
    const handleSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    handleSelect();
    carouselApi.on("select", handleSelect);
    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [carouselApi]);

  const handleRoleSelected = (role: string) => {
    onRoleSelected(role);
    setIsDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col justify-center px-6 py-6 gap-6 max-w-7xl mx-auto w-full">
        {/* Text content */}
        <div className="flex flex-col gap-6">
          <StepsBanner />

          <div className="flex items-center justify-between mt-10">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight font-display">
              {t("storeName")}
            </h1>
            <div className="flex items-center gap-1">
              <ThemeToggle variant="icon" />
              <LanguageSwitcher variant="full" />
            </div>
          </div>

          <p className="text-muted-foreground text-sm leading-relaxed font-serif">
            {t("storeDescription")}
          </p>
        </div>

        {/* Hero image carousel */}
        <div className="flex flex-col items-center gap-3">
          <Carousel opts={{ loop: true }} setApi={setCarouselApi} className="w-full">
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
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  currentSlide === i
                    ? "w-6 h-2 bg-foreground"
                    : "w-2 h-2 bg-muted-foreground/30"
                }`}
                onClick={() => carouselApi?.scrollTo(i)}
              />
            ))}
          </div>
        </div>

        {/* CTA Button with Drawer */}
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              size="lg"
              className="w-full rounded-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10"
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
