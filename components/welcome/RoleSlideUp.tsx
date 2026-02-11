"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X, Store, Headphones, User, LogIn, UserPlus, CheckCircle, XCircle, Loader2, MapPin, BookOpen, ArrowRight, Mail, Heart, Calendar, Library, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import { RoleType } from "./RoleCard";
import { loginWithEmail, registerWithInviteCode, fetchStores, validateInviteCode } from "@/data/supabase";
import { session } from "@/lib/session";
import type { Store as StoreType } from "@/types/type";

type VerificationStatus = "idle" | "loading" | "success" | "error";
type ViewState = "login" | "verifying" | "storeSelection" | "memberWelcome" | "memberStoreSelection";
type AuthMode = "login" | "register";

interface RoleSlideUpProps {
  role: RoleType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue?: (role: RoleType, credentials: { email: string; password: string }) => void;
}

const roleIcons: Record<RoleType, typeof Store> = {
  user: User,
  owner: Store,
  assistant: Headphones,
};

const roleTranslationKeys: Record<RoleType, string> = {
  user: "member",
  owner: "owner",
  assistant: "assistant",
};

export function RoleSlideUp({
  role,
  open,
  onOpenChange,
  onContinue,
}: RoleSlideUpProps) {
  const router = useRouter();
  const t = useTranslations();
  const tRoles = useTranslations("roles");
  const tAuth = useTranslations("auth");
  const tStores = useTranslations("stores");
  const tMemberWelcome = useTranslations("memberWelcome");
  const tFooter = useTranslations("footer");
  
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeError, setInviteCodeError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [viewState, setViewState] = useState<ViewState>("login");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // When role changes or drawer opens, set the correct initial view for members
  // Only switch to store selection if no store has been selected yet
  useEffect(() => {
    if (open && role === "user" && viewState === "login" && !selectedStore) {
      setViewState("memberStoreSelection");
      setIsLoadingStores(true);
    }
  }, [open, role, viewState, selectedStore]);

  // For members, load stores when drawer opens
  useEffect(() => {
    if (open && role === "user" && isLoadingStores && stores.length === 0) {
      const loadStores = async () => {
        try {
          const fetchedStores = await fetchStores();
          setStores(fetchedStores);
        } catch (error) {
          console.error("Failed to fetch stores:", error);
        } finally {
          setIsLoadingStores(false);
        }
      };
      loadStores();
    }
  }, [open, role, isLoadingStores, stores.length]);

  // Transition from success to appropriate view after 1 second
  useEffect(() => {
    if (verificationStatus === "success" && viewState === "verifying") {
      const timer = setTimeout(async () => {
        if (role === "user") {
          // For members, show welcome view then redirect to items page
          setViewState("memberWelcome");
        } else {
          // For owner/assistant, fetch stores for selection
          try {
            const fetchedStores = await fetchStores();
            setStores(fetchedStores);
          } catch (error) {
            console.error("Failed to fetch stores:", error);
          }
          setViewState("storeSelection");
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus, viewState, role]);

  // Don't render if no role selected
  if (!role) return null;

  const translationKey = roleTranslationKeys[role];
  const Icon = roleIcons[role];
  
  // Get translated role details
  const roleTitle = tRoles(`${translationKey}.title`);
  const roleSubtitle = tRoles(`${translationKey}.subtitle`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (authMode === "register" && !name) return;
    
    // For member registration, require invite code
    if (authMode === "register" && role === "user" && !inviteCode) {
      setInviteCodeError("Invite code is required");
      return;
    }

    setVerificationStatus("loading");
    setViewState("verifying");
    setErrorMessage("");
    setInviteCodeError("");

    try {
      let result;
      if (authMode === "login") {
        result = await loginWithEmail(email, password);
      } else {
        // For member registration with invite code
        if (role === "user") {
          // First validate the invite code
          const isValid = await validateInviteCode(inviteCode);
          if (!isValid) {
            setVerificationStatus("error");
            setErrorMessage("Invalid or expired invite code");
            return;
          }
          result = await registerWithInviteCode(email, password, name, inviteCode);
        } else {
          // For owner/assistant registration (no invite code needed)
          const { registerWithEmail } = await import("@/data/supabase");
          result = await registerWithEmail(email, password, name);
        }
      }
      // Store the user ID and access token for later use
      if (result.auth?.user?.id) {
        setUserId(result.auth.user.id);
      }
      if (result.auth?.session?.access_token) {
        setAccessToken(result.auth.session.access_token);
      }
      setVerificationStatus("success");
    } catch (error) {
      setVerificationStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Authentication failed");
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setVerificationStatus("idle");
      setViewState("login");
      setIsLoadingStores(false);
      setErrorMessage("");
      setEmail("");
      setPassword("");
      setName("");
      setInviteCode("");
      setInviteCodeError("");
      setSelectedStore(null);
      setAuthMode("login");
      setStores([]);
      setUserId(null);
      setAccessToken(null);
    }
    onOpenChange(newOpen);
  };

  const handleRetry = () => {
    setVerificationStatus("idle");
    setViewState("login");
    setErrorMessage("");
  };

  const handleStoreSelect = (storeId: string) => {
    setSelectedStore(storeId);
  };

  const handleEnterStore = () => {
    if (selectedStore && role) {
      // Store the role and user info in persistent session (7-day TTL)
      session.setItem("userRole", role);
      session.setItem("selectedStore", selectedStore);
      if (userId) {
        session.setItem("userId", userId);
      }
      if (accessToken) {
        session.setItem("accessToken", accessToken);
      }
      
      // Call onContinue if provided
      if (onContinue) {
        onContinue(role, { email, password });
      }
      
      // Navigate to the management page
      router.push("/manage");
    }
  };

  const handleMemberContinue = () => {
    if (role) {
      // Store the member info in persistent session (7-day TTL)
      session.setItem("userRole", "member");
      if (selectedStore) {
        session.setItem("selectedStore", selectedStore);
      }
      if (userId) {
        session.setItem("userId", userId);
      }
      if (accessToken) {
        session.setItem("accessToken", accessToken);
      }
      
      // Call onContinue if provided
      if (onContinue) {
        onContinue(role, { email, password });
      }
      
      // Navigate to the items/books page for members
      router.push("/items");
    }
  };

  // Handler for member store selection - proceed to login after selecting store
  const handleMemberStoreConfirm = () => {
    if (selectedStore) {
      setViewState("login");
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === "login" ? "register" : "login");
    setErrorMessage("");
  };

  // Form validation - require invite code for member registration
  const isFormValid = 
    email.trim() !== "" && 
    password.trim() !== "" && 
    (authMode === "login" || (
      name.trim() !== "" && 
      (role !== "user" || inviteCode.trim() !== "")
    ));

  // Verification Result View
  const renderVerificationResult = () => (
    <div className="px-6 pt-12 pb-8 flex flex-col items-center gap-6">
      {verificationStatus === "loading" && (
        <>
          <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center animate-pulse">
            <Loader2 size={40} className="text-zinc-400 animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-display text-xl font-semibold text-zinc-900">
              {tAuth("verifying")}
            </h2>
            <p className="text-sm text-zinc-500">
              {t("common.loading")}
            </p>
          </div>
        </>
      )}

      {verificationStatus === "success" && (
        <>
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle size={40} className="text-emerald-600" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-display text-xl font-semibold text-zinc-900">
              {tAuth("welcomeBack")}
            </h2>
            <p className="text-sm text-zinc-500">
              {tAuth("redirecting")}
            </p>
          </div>
        </>
      )}

      {verificationStatus === "error" && (
        <>
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle size={40} className="text-red-600" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="font-display text-xl font-semibold text-zinc-900">
              {authMode === "login" ? tAuth("loginFailed") : tAuth("registerFailed")}
            </h2>
            <p className="text-sm text-zinc-500">
              {errorMessage || tAuth("loginFailed")}
            </p>
          </div>
          <Button
            onClick={handleRetry}
            size="lg"
            className="w-full rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            {t("common.cancel")}
          </Button>
        </>
      )}
    </div>
  );

  // Store Selection View
  const renderStoreSelection = () => (
    <div className="px-6 pt-8 pb-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center">
          <Store size={32} className="text-zinc-600" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold text-zinc-900">
            {tStores("selectStore")}
          </h2>
          <p className="text-sm text-zinc-500">
            {tStores("chooseStore")}
          </p>
        </div>
      </div>

      {/* Horizontally scrollable store cards */}
      <div className="-mx-6 px-6">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {stores.length > 0 ? stores.map((store) => (
            <button
              key={store.id}
              onClick={() => handleStoreSelect(store.id)}
              className={`flex-shrink-0 w-44 rounded-2xl p-4 text-left transition-all ${
                selectedStore === store.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              }`}
            >
              {/* Store image placeholder */}
              <div
                className={`w-full h-24 rounded-xl mb-3 flex items-center justify-center overflow-hidden ${
                  selectedStore === store.id ? "bg-zinc-800" : "bg-zinc-200"
                }`}
              >
                <BookOpen
                  size={32}
                  className={selectedStore === store.id ? "text-zinc-400" : "text-zinc-400"}
                />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1 truncate">{store.name}</h3>
              <p
                className={`text-xs mb-2 line-clamp-2 ${
                  selectedStore === store.id ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {store.description || "No description"}
              </p>
              <div className="flex items-center gap-1">
                <MapPin
                  size={12}
                  className={selectedStore === store.id ? "text-zinc-400" : "text-zinc-400"}
                />
                <span
                  className={`text-xs truncate ${
                    selectedStore === store.id ? "text-zinc-400" : "text-zinc-400"
                  }`}
                >
                  {store.rules || "See store rules"}
                </span>
              </div>
            </button>
          )) : (
            <div className="flex-1 text-center py-8 text-zinc-500">
              <p>{tStores("noStores")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Enter store button */}
      <Button
        onClick={handleEnterStore}
        size="lg"
        disabled={!selectedStore}
        className="w-full rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {tStores("continue")}
        <ArrowRight size={18} className="ml-2" />
      </Button>
    </div>
  );

  // Member Welcome View
  const renderMemberWelcome = () => (
    <div className="px-6 pt-8 pb-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold text-zinc-900">
            {tMemberWelcome("title")}
          </h2>
          <p className="text-sm text-zinc-500">
            {tMemberWelcome("subtitle")}
          </p>
        </div>
      </div>

      {/* Quick access features */}
      <div className="bg-zinc-50 rounded-2xl p-5 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Library size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">{tMemberWelcome("features.library.title")}</p>
              <p className="text-xs text-zinc-500">{tMemberWelcome("features.library.description")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
              <Heart size={20} className="text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">{tMemberWelcome("features.favorites.title")}</p>
              <p className="text-xs text-zinc-500">{tMemberWelcome("features.favorites.description")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Calendar size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">{tMemberWelcome("features.events.title")}</p>
              <p className="text-xs text-zinc-500">{tMemberWelcome("features.events.description")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Continue button */}
      <Button
        onClick={handleMemberContinue}
        size="lg"
        className="w-full rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white"
      >
        {tMemberWelcome("continue")}
        <ArrowRight size={18} className="ml-2" />
      </Button>
    </div>
  );

  // Member Store Selection View (before login)
  const renderMemberStoreSelection = () => (
    <div className="px-6 pt-8 pb-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-3">
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center">
          <Store size={32} className="text-zinc-600" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold text-zinc-900">
            {tStores("selectStore")}
          </h2>
          <p className="text-sm text-zinc-500">
            {tStores("chooseStore")}
          </p>
        </div>
      </div>

      {/* Horizontally scrollable store cards */}
      <div className="-mx-6 px-6">
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {isLoadingStores ? (
            // Loading skeleton
            <>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-44 rounded-2xl p-4 bg-zinc-100 animate-pulse"
                >
                  <div className="w-full h-24 rounded-xl mb-3 bg-zinc-200" />
                  <div className="h-4 bg-zinc-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-zinc-200 rounded w-full mb-1" />
                  <div className="h-3 bg-zinc-200 rounded w-2/3" />
                </div>
              ))}
            </>
          ) : stores.length > 0 ? stores.map((store) => (
            <button
              key={store.id}
              onClick={() => handleStoreSelect(store.id)}
              className={`flex-shrink-0 w-44 rounded-2xl p-4 text-left transition-all ${
                selectedStore === store.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
              }`}
            >
              {/* Store image placeholder */}
              <div
                className={`w-full h-24 rounded-xl mb-3 flex items-center justify-center overflow-hidden ${
                  selectedStore === store.id ? "bg-zinc-800" : "bg-zinc-200"
                }`}
              >
                <BookOpen
                  size={32}
                  className={selectedStore === store.id ? "text-zinc-400" : "text-zinc-400"}
                />
              </div>
              <h3 className="font-display font-semibold text-sm mb-1 truncate">{store.name}</h3>
              <p
                className={`text-xs mb-2 line-clamp-2 ${
                  selectedStore === store.id ? "text-zinc-300" : "text-zinc-500"
                }`}
              >
                {store.description || "No description"}
              </p>
              <div className="flex items-center gap-1">
                <MapPin
                  size={12}
                  className={selectedStore === store.id ? "text-zinc-400" : "text-zinc-400"}
                />
                <span
                  className={`text-xs truncate ${
                    selectedStore === store.id ? "text-zinc-400" : "text-zinc-400"
                  }`}
                >
                  {store.rules || "See store rules"}
                </span>
              </div>
            </button>
          )) : (
            <div className="flex-1 text-center py-8 text-zinc-500">
              <p>{tStores("noStores")}</p>
            </div>
          )}
        </div>
      </div>

      {/* Continue button */}
      <Button
        onClick={handleMemberStoreConfirm}
        size="lg"
        disabled={!selectedStore}
        className="w-full rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {tStores("continue")}
        <ArrowRight size={18} className="ml-2" />
      </Button>
    </div>
  );

  // Login Form View
  const renderLoginForm = () => (
    <div className="px-6 pt-8 pb-8 flex flex-col gap-6">
      {/* Header with icon */}
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-900/20">
          <Icon size={32} className="text-white" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-semibold text-zinc-900">
            {roleTitle}
          </h2>
          <p className="font-serif text-sm text-zinc-500">{roleSubtitle}</p>
        </div>
      </div>

      {/* Login/Register form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {/* Name field for registration */}
          {authMode === "register" && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-zinc-700">
                {tAuth("name")}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={tAuth("enterName")}
                className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
                autoComplete="name"
              />
            </div>
          )}
          
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              {tAuth("email")}
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tAuth("enterEmail")}
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
                autoComplete="email"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              {tAuth("password")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tAuth("enterPassword")}
              className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
              autoComplete={authMode === "register" ? "new-password" : "current-password"}
            />
          </div>
          
          {/* Invite code field for member registration */}
          {authMode === "register" && role === "user" && (
            <div className="space-y-1.5">
              <label htmlFor="inviteCode" className="text-sm font-medium text-zinc-700">
                {tAuth("inviteCode")}
              </label>
              <div className="relative">
                <Ticket size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    setInviteCodeError("");
                  }}
                  placeholder={tAuth("enterInviteCode")}
                  className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow ${
                    inviteCodeError ? "border-red-300" : "border-zinc-200"
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

        {errorMessage && viewState === "login" && (
          <p className="text-sm text-red-600 text-center">{errorMessage}</p>
        )}

        {authMode === "login" ? (
          <div className="flex gap-3">
            <Button
              type="button"
              size="lg"
              onClick={toggleAuthMode}
              className="flex-1 rounded-full h-12 text-base font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-900"
            >
              <UserPlus size={18} className="mr-2" />
              {tAuth("register")}
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={!isFormValid}
              className="flex-1 rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus size={18} className="mr-2" />
              {tAuth("register")}
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={toggleAuthMode}
              variant="ghost"
              className="w-full rounded-full h-12 text-base font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            >
              {tAuth("hasAccount")} {tAuth("login")}
            </Button>
          </div>
        )}
      </form>

      {/* Footer note */}
      <p className="text-xs text-center text-zinc-400">
        {tFooter("terms")} & {tFooter("privacy")}
      </p>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[85vh] px-4 flex flex-col">
        {/* Close button */}
        <DrawerClose asChild>
          <button
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-zinc-100 transition-colors z-10"
            aria-label="Close"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </DrawerClose>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {viewState === "memberStoreSelection" && renderMemberStoreSelection()}
          {viewState === "login" && renderLoginForm()}
          {viewState === "verifying" && renderVerificationResult()}
          {viewState === "storeSelection" && renderStoreSelection()}
          {viewState === "memberWelcome" && renderMemberWelcome()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
