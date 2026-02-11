"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ArrowLeft, Send, Trash2, Loader2, MessageCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { CollaboratePost, CollaborateReply } from "@/types/type";
import { session } from "@/lib/session";

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations("collaborate");

  const [post, setPost] = useState<CollaboratePost | null>(null);
  const [replies, setReplies] = useState<CollaborateReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newReply, setNewReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const userId = session.getItem("userId");
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    const fetchPostAndReplies = async () => {
      try {
        // Fetch post
        const postResponse = await fetch(`/api/collaborate/posts/${id}`);
        if (postResponse.ok) {
          const postData = await postResponse.json();
          setPost(postData);
        }

        // Fetch replies
        const repliesResponse = await fetch(`/api/collaborate/replies?postId=${id}`);
        if (repliesResponse.ok) {
          const repliesData = await repliesResponse.json();
          setReplies(repliesData);
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostAndReplies();
  }, [id]);

  const handleSubmitReply = async () => {
    if (!newReply.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const userId = session.getItem("userId");
      const accessToken = session.getItem("accessToken");

      if (!userId) {
        console.error("No user ID");
        return;
      }

      const response = await fetch("/api/collaborate/replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          postId: id,
          authorId: userId,
          content: newReply.trim(),
        }),
      });

      if (response.ok) {
        const reply = await response.json();
        setReplies((prev) => [...prev, reply]);
        setNewReply("");
      }
    } catch (error) {
      console.error("Failed to submit reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    const accessToken = session.getItem("accessToken");

    try {
      const response = await fetch(`/api/collaborate/replies/${replyId}`, {
        method: "DELETE",
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });

      if (response.ok) {
        setReplies((prev) => prev.filter((r) => r.id !== replyId));
      }
    } catch (error) {
      console.error("Failed to delete reply:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!post) return;

    const accessToken = session.getItem("accessToken");

    try {
      const response = await fetch(`/api/collaborate/posts/${post.id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });

      if (response.ok) {
        router.push("/collaborate");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-muted-foreground/70" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-muted-foreground" />
          </button>
        </div>
        <EmptyState
          icon={MessageCircle}
          title={t("postNotFound")}
          message={t("postMayBeDeleted")}
        />
      </div>
    );
  }

  const isAuthor = currentUserId === post.author.id;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-muted-foreground" />
          </button>
          {isAuthor && (
            <button
              onClick={handleDeletePost}
              className="p-2 -mr-2 hover:bg-red-50 rounded-full transition-colors text-red-500"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4 border-b border-border max-w-3xl mx-auto lg:px-8">
        {/* Author Info */}
        <div className="flex items-center gap-3 mb-4">
          {post.author.avatar ? (
            <div className="w-12 h-12 rounded-full overflow-hidden relative">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
              <span className="text-muted-foreground font-semibold text-lg">
                {post.author.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground">{post.author.name}</p>
            <p className="text-sm text-muted-foreground">
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="text-xl font-bold text-foreground mb-2 font-display">{post.title}</h1>
        <p className="text-muted-foreground whitespace-pre-wrap font-serif">{post.description}</p>

        {/* Photos */}
        {post.photos && post.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {post.photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(photo)}
                className="relative aspect-square rounded-xl overflow-hidden bg-muted"
              >
                <Image
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Replies Section */}
      <div className="p-4 max-w-3xl mx-auto lg:px-8">
        <h2 className="font-semibold text-foreground mb-4 font-display">
          {t("replies")} ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground/70">
            <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("noRepliesYet")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="flex gap-3 p-3 bg-secondary rounded-xl"
              >
                {/* Reply Author Avatar */}
                {reply.author.avatar ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden relative flex-shrink-0">
                    <Image
                      src={reply.author.avatar}
                      alt={reply.author.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-muted-foreground font-medium text-xs">
                      {reply.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm">
                      <span className="font-semibold text-foreground">
                        {reply.author.name}
                      </span>
                      <span className="text-muted-foreground/70 ml-2">
                        {formatRelativeTime(reply.createdAt)}
                      </span>
                    </p>
                    {currentUserId === reply.author.id && (
                      <button
                        onClick={() => handleDeleteReply(reply.id)}
                        className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground/70 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1 whitespace-pre-wrap">
                    {reply.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 pb-safe lg:left-64">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            placeholder={t("writeReply")}
            className="flex-1 px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitReply();
              }
            }}
          />
          <button
            onClick={handleSubmitReply}
            disabled={!newReply.trim() || isSubmitting}
            className="px-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 text-white hover:bg-background/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="relative max-w-full max-h-full">
            <Image
              src={selectedImage}
              alt="Full size"
              width={1000}
              height={1000}
              className="object-contain max-h-[85vh]"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
