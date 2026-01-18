"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Store, Headphones, User, LogIn, UserPlus, CheckCircle, XCircle, Loader2, MapPin, BookOpen, ArrowRight, Mail, Heart, Calendar, Library, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import { RoleType } from "./RoleCard";
import { loginWithEmail, registerWithInviteCode, fetchStores, validateInviteCode } from "@/data/supabase";
import type { Store as StoreType } from "@/types/type";

type VerificationStatus = "idle" | "loading" | "success" | "error";
type ViewState = "login" | "verifying" | "storeSelection" | "memberWelcome";
type AuthMode = "login" | "register";

interface RoleSlideUpProps {
  role: RoleType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue?: (role: RoleType, credentials: { email: string; password: string }) => void;
}

const roleDetails: Record<
  RoleType,
  {
    icon: typeof Store;
    title: string;
    subtitle: string;
    features: string[];
    ctaText: string;
  }
> = {
  user: {
    icon: User,
    title: "Member",
    subtitle: "Your personal reading journey starts here",
    features: [
      "Browse & discover curated books",
      "Save favorites to your reading list",
      "Borrow books from the library",
      "Join community events & discussions",
    ],
    ctaText: "Start Reading",
  },
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
  const router = useRouter();
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
  const [userId, setUserId] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

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

  const details = roleDetails[role];
  const Icon = details.icon;

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
      // Store the role and user info in sessionStorage for the management page
      sessionStorage.setItem("userRole", role);
      sessionStorage.setItem("selectedStore", selectedStore);
      if (userId) {
        sessionStorage.setItem("userId", userId);
      }
      if (accessToken) {
        sessionStorage.setItem("accessToken", accessToken);
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
      // Store the member info in sessionStorage
      sessionStorage.setItem("userRole", "member");
      if (userId) {
        sessionStorage.setItem("userId", userId);
      }
      if (accessToken) {
        sessionStorage.setItem("accessToken", accessToken);
      }
      
      // Call onContinue if provided
      if (onContinue) {
        onContinue(role, { email, password });
      }
      
      // Navigate to the items/books page for members
      router.push("/items");
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
            <h2 className="text-xl font-semibold text-zinc-900">
              {authMode === "login" ? "Signing in..." : "Creating account..."}
            </h2>
            <p className="text-sm text-zinc-500">
              Please wait while we verify your credentials
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
            <h2 className="text-xl font-semibold text-zinc-900">
              {authMode === "login" ? "Welcome Back!" : "Account Created!"}
            </h2>
            <p className="text-sm text-zinc-500">
              Loading your stores...
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
            <h2 className="text-xl font-semibold text-zinc-900">
              {authMode === "login" ? "Login Failed" : "Registration Failed"}
            </h2>
            <p className="text-sm text-zinc-500">
              {errorMessage || "Unable to verify your credentials"}
            </p>
          </div>
          <Button
            onClick={handleRetry}
            size="lg"
            className="w-full rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white"
          >
            Try Again
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
          <h2 className="text-xl font-semibold text-zinc-900">
            Select Your Store
          </h2>
          <p className="text-sm text-zinc-500">
            Choose which store you want to manage today
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
              className={`flex-shrink-0 w-44 snap-start rounded-2xl p-4 text-left transition-all ${
                selectedStore === store.id
                  ? "bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-2"
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
              <h3 className="font-semibold text-sm mb-1 truncate">{store.name}</h3>
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
              <p>No stores available</p>
              <p className="text-sm mt-1">Contact admin to create a store</p>
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
        Enter Store
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
          <h2 className="text-xl font-semibold text-zinc-900">
            Welcome to Seashore Books!
          </h2>
          <p className="text-sm text-zinc-500">
            You&apos;re all set to start your reading journey
          </p>
        </div>
      </div>

      {/* Quick access features */}
      <div className="bg-zinc-50 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-zinc-700">What you can do now:</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Library size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">Browse Books</p>
              <p className="text-xs text-zinc-500">Discover our curated collection</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
              <Heart size={20} className="text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">Save Favorites</p>
              <p className="text-xs text-zinc-500">Build your personal reading list</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Calendar size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900">Join Events</p>
              <p className="text-xs text-zinc-500">Connect with fellow readers</p>
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
        Start Exploring
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

      {/* Login/Register form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {/* Name field for registration */}
          {authMode === "register" && (
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium text-zinc-700">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
                autoComplete="name"
              />
            </div>
          )}
          
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full h-12 pl-11 pr-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
                autoComplete="email"
              />
            </div>
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
              placeholder={authMode === "register" ? "Create a password" : "Enter your password"}
              className="w-full h-12 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow"
              autoComplete={authMode === "register" ? "new-password" : "current-password"}
            />
          </div>
          
          {/* Invite code field for member registration */}
          {authMode === "register" && role === "user" && (
            <div className="space-y-1.5">
              <label htmlFor="inviteCode" className="text-sm font-medium text-zinc-700">
                Invite Code
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
                  placeholder="Enter your invite code"
                  className={`w-full h-12 pl-11 pr-4 rounded-xl border bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-shadow ${
                    inviteCodeError ? "border-red-300" : "border-zinc-200"
                  }`}
                  autoComplete="off"
                />
              </div>
              {inviteCodeError && (
                <p className="text-xs text-red-600">{inviteCodeError}</p>
              )}
              <p className="text-xs text-zinc-400">
                Ask a store owner or assistant for an invite code
              </p>
            </div>
          )}
        </div>

        {errorMessage && viewState === "login" && (
          <p className="text-sm text-red-600 text-center">{errorMessage}</p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={!isFormValid}
          className="w-full rounded-full h-12 text-base font-medium bg-zinc-900 hover:bg-zinc-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {authMode === "login" ? (
            <>
              <LogIn size={18} className="mr-2" />
              Sign In
            </>
          ) : (
            <>
              <UserPlus size={18} className="mr-2" />
              Create Account
            </>
          )}
        </Button>
      </form>

      {/* Toggle auth mode */}
      <div className="text-center">
        <button
          type="button"
          onClick={toggleAuthMode}
          className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          {authMode === "login" ? (
            <>Don&apos;t have an account? <span className="font-medium">Sign up</span></>
          ) : (
            <>Already have an account? <span className="font-medium">Sign in</span></>
          )}
        </button>
      </div>

      {/* Footer note */}
      <p className="text-xs text-center text-zinc-400">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={handleClose}>
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

        {viewState === "login" && renderLoginForm()}
        {viewState === "verifying" && renderVerificationResult()}
        {viewState === "storeSelection" && renderStoreSelection()}
        {viewState === "memberWelcome" && renderMemberWelcome()}
      </DrawerContent>
    </Drawer>
  );
}
