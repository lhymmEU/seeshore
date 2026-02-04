"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { MessageCircle, ChevronRight } from "lucide-react";
import type { CollaboratePost } from "@/types/type";

interface PostCardProps {
  post: CollaboratePost;
  onClick: () => void;
}

export function PostCard({ post, onClick }: PostCardProps) {
  const t = useTranslations("collaborate");

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("justNow");
    if (diffMins < 60) return t("minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("hoursAgo", { count: diffHours });
    if (diffDays < 7) return t("daysAgo", { count: diffDays });
    
    return date.toLocaleDateString();
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl border border-zinc-100 p-4 text-left hover:border-zinc-200 hover:shadow-sm transition-all active:scale-[0.99]"
    >
      <div className="flex gap-3">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          {post.author.avatar ? (
            <div className="w-10 h-10 rounded-full overflow-hidden relative">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-200 to-zinc-100 flex items-center justify-center">
              <span className="text-zinc-500 font-medium text-sm">
                {post.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-zinc-900 line-clamp-1">
                {post.title}
              </h3>
              <p className="text-sm text-zinc-500 mt-0.5">
                {post.author.name} · {formatRelativeTime(post.createdAt)}
              </p>
            </div>
            <ChevronRight size={18} className="text-zinc-400 flex-shrink-0 mt-1" />
          </div>

          <p className="text-sm text-zinc-600 mt-2 line-clamp-2">
            {post.description}
          </p>

          {/* Photos Preview */}
          {post.photos && post.photos.length > 0 && (
            <div className="flex gap-2 mt-3">
              {post.photos.slice(0, 3).map((photo, index) => (
                <div
                  key={index}
                  className="relative w-16 h-16 rounded-lg overflow-hidden bg-zinc-100"
                >
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {index === 2 && post.photos.length > 3 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        +{post.photos.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reply Count */}
          <div className="flex items-center gap-1.5 mt-3 text-zinc-400">
            <MessageCircle size={14} />
            <span className="text-xs">
              {post.replyCount} {t("replies")}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
