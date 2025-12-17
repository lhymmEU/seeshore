"use client";

import { useState, useEffect } from "react";
import { X, Store, Headphones, LogIn, CheckCircle, XCircle, Loader2, MapPin, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
import { RoleType } from "./RoleCard";

type VerificationStatus = "idle" | "loading" | "success" | "error";
type ViewState = "login" | "verifying" | "storeSelection";

interface StoreInfo {
  id: string;
  name: string;
  description: string;
  address: string;
}

// Mock store data - in real app, this would come from API
const mockStores: StoreInfo[] = [
  {
    id: "1",
    name: "Seashore Downtown",
    description: "Our flagship store in the heart of the city",
    address: "123 Main Street",
  },
  {
    id: "2",
    name: "Seashore Westside",
    description: "Cozy neighborhood bookstore with cafe",
    address: "456 Oak Avenue",
  }
];

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
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [viewState, setViewState] = useState<ViewState>("login");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  // Transition from success to store selection after 1 second
  useEffect(() => {
    if (verificationStatus === "success" && viewState === "verifying") {
      const timer = setTimeout(() => {
        setViewState("storeSelection");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus, viewState]);

  // Only show for owner and assistant roles
  if (!role || role === "user") return null;

  const details = roleDetails[role];
  const Icon = details.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setVerificationStatus("loading");
    setViewState("verifying");
    setErrorMessage("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setVerificationStatus("success");
        // Don't call onContinue here - wait for store selection
      } else {
        setVerificationStatus("error");
        setErrorMessage(data.message || "Login failed");
      }
    } catch {
      setVerificationStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setVerificationStatus("idle");
      setViewState("login");
      setErrorMessage("");
      setUsername("");
      setPassword("");
      setSelectedStore(null);
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
    if (selectedStore && onContinue) {
      // Call onContinue with the selected credentials
      onContinue(role, { username, password });
    }
  };

  const isFormValid = username.trim() !== "" && password.trim() !== "";

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
              Verifying...
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
              Verification Successful
            </h2>
            <p className="text-sm text-zinc-500">
              Welcome back! Loading your stores...
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
              Verification Failed
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
          {mockStores.map((store) => (
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
                className={`w-full h-24 rounded-xl mb-3 flex items-center justify-center ${
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
                {store.description}
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
                  {store.address}
                </span>
              </div>
            </button>
          ))}
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
      </DrawerContent>
    </Drawer>
  );
}

