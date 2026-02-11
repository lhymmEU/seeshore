"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Store,
  BookOpen,
  MapPin,
  Mail,
  Ticket,
  LogIn,
  UserPlus,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { RoleCard, type RoleType } from "./RoleCard";
import { StepsBanner } from "./StepsBanner";
import {
  loginWithEmail,
  registerWithInviteCode,
  fetchStores,
  validateInviteCode,
} from "@/data/supabase";
import { session } from "@/lib/session";
import type { Store as StoreType } from "@/types/type";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type AuthMode = "login" | "register";
type FlowStatus = "idle" | "loading" | "success" | "error";

interface DesktopWelcomeProps {
  onRoleSelected: (role: string) => void;
}

const roles: RoleType[] = ["user", "owner"];

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function DesktopWelcome({ onRoleSelected }: DesktopWelcomeProps) {
  const router = useRouter();
  const t = useTranslations("welcome");
  const tAuth = useTranslations("auth");
  const tStores = useTranslations("stores");
  const tFooter = useTranslations("footer");

  /* ---------- carousel ---------- */
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) return;
    const h = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    h();
    carouselApi.on("select", h);
    return () => {
      carouselApi.off("select", h);
    };
  }, [carouselApi]);

  /* ---------- role selection ---------- */
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);

  /* ---------- store selection ---------- */
  const [stores, setStores] = useState<StoreType[]>([]);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [isLoadingStores, setIsLoadingStores] = useState(false);

  // load stores once on mount
  useEffect(() => {
    setIsLoadingStores(true);
    fetchStores()
      .then(setStores)
      .catch((e) => console.error("Failed to fetch stores:", e))
      .finally(() => setIsLoadingStores(false));
  }, []);

  /* ---------- auth form ---------- */
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeError, setInviteCodeError] = useState("");
  const [flowStatus, setFlowStatus] = useState<FlowStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // refs for animated height on the form panel
  const formRef = useRef<HTMLDivElement>(null);
  const [formHeight, setFormHeight] = useState<number | "auto">("auto");
  const prevAuthMode = useRef(authMode);

  // measure form height on authMode change for smooth animation
  useEffect(() => {
    if (prevAuthMode.current !== authMode && formRef.current) {
      // instantly measure new height
      const el = formRef.current;
      el.style.height = "auto";
      const h = el.scrollHeight;
      // snap to previous height, then animate to new
      el.style.height = `${formHeight === "auto" ? el.scrollHeight : formHeight}px`;
      requestAnimationFrame(() => {
        setFormHeight(h);
      });
    }
    prevAuthMode.current = authMode;
  }, [authMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleAuthMode = () => {
    setAuthMode((m) => (m === "login" ? "register" : "login"));
    setErrorMessage("");
    setInviteCodeError("");
  };

  const isFormValid =
    email.trim() !== "" &&
    password.trim() !== "" &&
    (authMode === "login" ||
      (name.trim() !== "" &&
        (selectedRole !== "user" || inviteCode.trim() !== "")));

  /* ---------- submit ---------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !selectedRole) return;
    if (authMode === "register" && selectedRole === "user" && !inviteCode) {
      setInviteCodeError("Invite code is required");
      return;
    }

    setFlowStatus("loading");
    setErrorMessage("");
    setInviteCodeError("");

    try {
      let result;
      if (authMode === "login") {
        result = await loginWithEmail(email, password);
      } else if (selectedRole === "user") {
        const isValid = await validateInviteCode(inviteCode);
        if (!isValid) {
          setFlowStatus("error");
          setErrorMessage("Invalid or expired invite code");
          return;
        }
        result = await registerWithInviteCode(email, password, name, inviteCode);
      } else {
        const { registerWithEmail: regFn } = await import("@/data/supabase");
        result = await regFn(email, password, name);
      }

      if (result.auth?.user?.id) setUserId(result.auth.user.id);
      if (result.auth?.session?.access_token) setAccessToken(result.auth.session.access_token);
      setFlowStatus("success");
    } catch (error) {
      setFlowStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed");
    }
  };

  /* ---------- post-auth navigation ---------- */
  useEffect(() => {
    if (flowStatus !== "success" || !selectedRole) return;
    const timer = setTimeout(() => {
      session.setItem("userRole", selectedRole === "user" ? "member" : selectedRole);
      if (selectedStore) session.setItem("selectedStore", selectedStore);
      if (userId) session.setItem("userId", userId);
      if (accessToken) session.setItem("accessToken", accessToken);
      onRoleSelected(selectedRole);
      router.push(selectedRole === "user" ? "/items" : "/manage");
    }, 1200);
    return () => clearTimeout(timer);
  }, [flowStatus, selectedRole, selectedStore, userId, accessToken, router, onRoleSelected]);

  /* ---------- derived ---------- */
  const showStores = true; // always show store selection at top
  const showAuth = !!selectedRole && !!selectedStore; // show auth after role + store chosen
  const showRoles = !!selectedStore; // show role cards after store chosen

  /* ================================================================ */
  /*  Render                                                          */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-background flex">
      {/* ==================== LEFT: Carousel ==================== */}
      <div className="w-1/2 min-h-screen relative flex flex-col">
        {/* Steps banner at the top */}
        <div className="px-8 pt-8">
          <StepsBanner />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-10 pb-10 gap-4">
          <Carousel opts={{ loop: true }} setApi={setCarouselApi} className="w-full max-w-xl">
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
          {/* Dot indicators */}
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
      </div>

      {/* ==================== RIGHT: Flow panel ==================== */}
      <div className="w-1/2 min-h-screen border-l border-border flex flex-col">
        {/* Top bar: branding + controls */}
        <div className="flex items-center justify-between px-10 pt-8 pb-4">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight font-display">
            {t("storeName")}
          </h1>
          <div className="flex items-center gap-1">
            <ThemeToggle variant="icon" />
            <LanguageSwitcher variant="full" />
          </div>
        </div>

        <p className="px-10 text-muted-foreground text-sm leading-relaxed font-serif mb-6">
          {t("storeDescription")}
        </p>

        {/* Scrollable flow area */}
        <div className="flex-1 overflow-y-auto px-10 pb-10 flex flex-col gap-8">
          {/* ---- Step 1: Store selection (always visible) ---- */}
          {showStores && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Store size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-foreground">
                    {tStores("selectStore")}
                  </h2>
                  <p className="text-xs text-muted-foreground">{tStores("chooseStore")}</p>
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {isLoadingStores ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex-shrink-0 w-44 rounded-2xl p-4 bg-muted animate-pulse"
                      >
                        <div className="w-full h-20 rounded-xl mb-3 bg-muted-foreground/10" />
                        <div className="h-4 bg-muted-foreground/10 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-muted-foreground/10 rounded w-full" />
                      </div>
                    ))}
                  </>
                ) : stores.length > 0 ? (
                  stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => setSelectedStore(store.id)}
                      className={`flex-shrink-0 w-44 rounded-2xl p-4 text-left transition-all duration-200 ${
                        selectedStore === store.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                          : "bg-muted text-foreground hover:shadow-md"
                      }`}
                    >
                      <div
                        className={`w-full h-20 rounded-xl mb-3 flex items-center justify-center overflow-hidden ${
                          selectedStore === store.id ? "bg-primary-foreground/10" : "bg-background"
                        }`}
                      >
                        <BookOpen
                          size={28}
                          className={
                            selectedStore === store.id
                              ? "text-primary-foreground/50"
                              : "text-muted-foreground/50"
                          }
                        />
                      </div>
                      <h3 className="font-display font-semibold text-sm mb-1 truncate">
                        {store.name}
                      </h3>
                      <p
                        className={`text-xs mb-2 line-clamp-2 ${
                          selectedStore === store.id
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {store.description || "No description"}
                      </p>
                      <div className="flex items-center gap-1">
                        <MapPin
                          size={12}
                          className={
                            selectedStore === store.id
                              ? "text-primary-foreground/50"
                              : "text-muted-foreground/50"
                          }
                        />
                        <span
                          className={`text-xs truncate ${
                            selectedStore === store.id
                              ? "text-primary-foreground/50"
                              : "text-muted-foreground/50"
                          }`}
                        >
                          {store.rules || "See store rules"}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="flex-1 text-center py-8 text-muted-foreground">
                    <p>{tStores("noStores")}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ---- Step 2: Role selection (after store chosen) ---- */}
          <div
            className={`transition-all duration-500 ease-out overflow-hidden ${
              showRoles ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <section className="flex flex-col gap-4">
              <div className="text-left">
                <h2 className="font-display text-base font-semibold text-foreground">
                  {t("chooseRole")}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("selectRoleDescription")}
                </p>
              </div>
              <div className="flex gap-3">
                {roles.map((role) => (
                  <RoleCard
                    key={role}
                    role={role}
                    isSelected={selectedRole === role}
                    onClick={() => setSelectedRole(role)}
                  />
                ))}
              </div>
            </section>
          </div>

          {/* ---- Step 3: Auth form (after role chosen) ---- */}
          <div
            className={`transition-all duration-500 ease-out overflow-hidden ${
              showAuth ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {flowStatus === "idle" || flowStatus === "error" ? (
              <section className="flex flex-col gap-5">
                {/* Animated form container */}
                <div
                  ref={formRef}
                  className="transition-[height] duration-300 ease-out overflow-hidden"
                  style={{ height: formHeight === "auto" ? "auto" : `${formHeight}px` }}
                >
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ---------- Crossfade wrapper ---------- */}
                    <div className="relative">
                      {/* Login fields */}
                      <div
                        className={`transition-all duration-300 ease-out ${
                          authMode === "login"
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 -translate-y-2 absolute inset-x-0 pointer-events-none"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label htmlFor="d-email" className="text-sm font-medium text-foreground/70">
                              {tAuth("email")}
                            </label>
                            <div className="relative">
                              <Mail
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70"
                              />
                              <input
                                id="d-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={tAuth("enterEmail")}
                                className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                                autoComplete="email"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="d-password" className="text-sm font-medium text-foreground/70">
                              {tAuth("password")}
                            </label>
                            <input
                              id="d-password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder={tAuth("enterPassword")}
                              className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                              autoComplete="current-password"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Register fields */}
                      <div
                        className={`transition-all duration-300 ease-out ${
                          authMode === "register"
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-2 absolute inset-x-0 pointer-events-none"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label htmlFor="d-name" className="text-sm font-medium text-foreground/70">
                              {tAuth("name")}
                            </label>
                            <input
                              id="d-name"
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder={tAuth("enterName")}
                              className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                              autoComplete="name"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="d-reg-email" className="text-sm font-medium text-foreground/70">
                              {tAuth("email")}
                            </label>
                            <div className="relative">
                              <Mail
                                size={18}
                                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70"
                              />
                              <input
                                id="d-reg-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={tAuth("enterEmail")}
                                className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                                autoComplete="email"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="d-reg-password" className="text-sm font-medium text-foreground/70">
                              {tAuth("password")}
                            </label>
                            <input
                              id="d-reg-password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder={tAuth("enterPassword")}
                              className="w-full h-12 px-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                              autoComplete="new-password"
                            />
                          </div>

                          {/* Invite code for member registration */}
                          {selectedRole === "user" && (
                            <div className="space-y-1.5">
                              <label
                                htmlFor="d-invite"
                                className="text-sm font-medium text-foreground/70"
                              >
                                {tAuth("inviteCode")}
                              </label>
                              <div className="relative">
                                <Ticket
                                  size={18}
                                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70"
                                />
                                <input
                                  id="d-invite"
                                  type="text"
                                  value={inviteCode}
                                  onChange={(e) => {
                                    setInviteCode(e.target.value.toUpperCase());
                                    setInviteCodeError("");
                                  }}
                                  placeholder={tAuth("enterInviteCode")}
                                  className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow ${
                                    inviteCodeError ? "border-red-300" : "border-border"
                                  }`}
                                  autoComplete="off"
                                />
                              </div>
                              {inviteCodeError && (
                                <p className="text-xs text-red-600">{inviteCodeError}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Error message */}
                    {errorMessage && (
                      <p className="text-sm text-red-600 text-center">{errorMessage}</p>
                    )}

                    {/* Action buttons */}
                    {authMode === "login" ? (
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          size="lg"
                          onClick={toggleAuthMode}
                          className="flex-1 rounded-full h-12 text-base font-medium bg-muted hover:bg-muted/80 text-foreground"
                        >
                          <UserPlus size={18} className="mr-2" />
                          {tAuth("register")}
                        </Button>
                        <Button
                          type="submit"
                          size="lg"
                          disabled={!isFormValid}
                          className="flex-1 rounded-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <LogIn size={18} className="mr-2" />
                          {tAuth("login")}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          type="submit"
                          size="lg"
                          disabled={!isFormValid}
                          className="w-full rounded-full h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <UserPlus size={18} className="mr-2" />
                          {tAuth("register")}
                        </Button>
                        <Button
                          type="button"
                          size="lg"
                          onClick={toggleAuthMode}
                          variant="ghost"
                          className="w-full rounded-full h-12 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          {tAuth("hasAccount")} {tAuth("login")}
                        </Button>
                      </div>
                    )}
                  </form>
                </div>

                {/* Footer */}
                <p className="text-xs text-center text-muted-foreground/70">
                  {tFooter("terms")} & {tFooter("privacy")}
                </p>
              </section>
            ) : flowStatus === "loading" ? (
              /* ---- Loading state ---- */
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center animate-pulse">
                  <Loader2 size={40} className="text-muted-foreground/70 animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {tAuth("verifying")}
                  </h2>
                  <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
                </div>
              </div>
            ) : flowStatus === "success" ? (
              /* ---- Success state ---- */
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle size={40} className="text-emerald-600" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {tAuth("welcomeBack")}
                  </h2>
                  <p className="text-sm text-muted-foreground">{tAuth("redirecting")}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
