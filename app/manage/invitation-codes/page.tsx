"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Ticket,
  Plus,
  Copy,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

export interface InviteCodeRow {
  id: string;
  code: string;
  store_id: string;
  created_by: string | null;
  used_by: string | null;
  used_at: string | null;
  expires_at: string | null;
  is_used: boolean;
  created_at: string;
}

export default function InvitationCodesPage() {
  const router = useRouter();
  const t = useTranslations("manage.invitationCodes");

  const [codes, setCodes] = useState<InviteCodeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);

  const fetchCodes = async (sid: string) => {
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const res = await fetch(`/api/invite-codes?storeId=${encodeURIComponent(sid)}`, {
        headers,
      });
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/manage");
          return;
        }
        throw new Error("Failed to fetch codes");
      }
      const data = await res.json();
      setCodes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch invite codes:", err);
      setCodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const role = sessionStorage.getItem("userRole");
    if (role !== "owner") {
      router.push("/manage");
      return;
    }
    const sid = sessionStorage.getItem("selectedStore");
    if (!sid) {
      setStoreId(null);
      setIsLoading(false);
      return;
    }
    setStoreId(sid);
    fetchCodes(sid);
  }, [router]);

  const handleGenerate = async () => {
    if (!storeId) return;
    setIsGenerating(true);
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const res = await fetch("/api/invite-codes", {
        method: "POST",
        headers,
        body: JSON.stringify({ storeId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to generate code");
      }
      const newCode = await res.json();
      setCodes((prev) => [newCode, ...prev]);
    } catch (err) {
      console.error("Failed to generate invite code:", err);
      alert(err instanceof Error ? err.message : "Failed to generate code.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!t("revokeConfirm") || !confirm(t("revokeConfirm"))) return;
    setRevokingId(id);
    try {
      const accessToken = sessionStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      const res = await fetch(`/api/invite-codes/${id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to revoke code");
      }
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to revoke invite code:", err);
      alert(err instanceof Error ? err.message : "Failed to revoke code.");
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      alert("Copy failed");
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  if (!storeId && !isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 pb-24">
        <PageHeader title={t("title")} />
        <div className="px-4 pt-6">
          <p className="text-zinc-600 text-sm">{t("onlyOwnerStore")}</p>
          <a
            href="/manage"
            className="mt-4 inline-block text-emerald-600 font-medium"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-24">
      <PageHeader title={t("title")} />

      <div className="px-4 pt-5 space-y-4">
        <p className="text-sm text-zinc-600">{t("description")}</p>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !storeId}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium transition-colors",
            "bg-white border border-zinc-200 text-zinc-800",
            "hover:bg-zinc-50 hover:border-zinc-300",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {isGenerating ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Plus size={20} />
          )}
          {isGenerating ? t("generating") : t("generate")}
        </button>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-zinc-400" />
          </div>
        ) : codes.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <Ticket size={40} className="mx-auto text-zinc-300 mb-3" />
            <p className="font-medium text-zinc-700">{t("noCodes")}</p>
            <p className="text-sm text-zinc-500 mt-1">{t("generateFirst")}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {codes.map((row) => (
              <li
                key={row.id}
                className={cn(
                  "rounded-2xl border bg-white overflow-hidden",
                  row.is_used
                    ? "border-zinc-100 bg-zinc-50/50"
                    : "border-zinc-200 shadow-sm"
                )}
              >
                <div className="p-4 flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "font-mono font-semibold text-base tracking-wide",
                          row.is_used ? "text-zinc-400" : "text-zinc-900"
                        )}
                      >
                        {row.code}
                      </span>
                      {!row.is_used && (
                        <button
                          type="button"
                          onClick={() => handleCopy(row.code)}
                          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors"
                          title={t("copyCode")}
                        >
                          {copiedCode === row.code ? (
                            <Check size={16} className="text-emerald-600" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                      <span>
                        {t("createdAt")}: {formatDate(row.created_at)}
                      </span>
                      {row.expires_at && (
                        <span>
                          {t("expiresAt")}: {formatDate(row.expires_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium",
                        row.is_used
                          ? "bg-zinc-200 text-zinc-600"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {row.is_used ? t("used") : t("unused")}
                    </span>
                    {!row.is_used && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(row.id)}
                        disabled={revokingId === row.id}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
                        title={t("revoke")}
                      >
                        {revokingId === row.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
