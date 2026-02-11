"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Blocks } from "lucide-react";
import { BottomNav } from "@/components/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState } from "@/components/ui/empty-state";
import { PostCard, CreatePostDrawer } from "@/components/collaborate";
import type { CollaboratePost } from "@/types/type";
import { session } from "@/lib/session";

export default function CollaboratePage() {
  const router = useRouter();
  const t = useTranslations("collaborate");
  
  const [posts, setPosts] = useState<CollaboratePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);

  const fetchPosts = async () => {
    try {
      const storeId = session.getItem("selectedStore");
      if (!storeId) {
        console.error("No store selected");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/collaborate/posts?storeId=${storeId}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.description.toLowerCase().includes(query) ||
      post.author.name.toLowerCase().includes(query)
    );
  });

  const handleViewPost = (postId: string) => {
    router.push(`/collaborate/${postId}`);
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header Section */}
      <div className="px-4 pt-12 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 font-display">{t("title")}</h1>
          <button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="p-2 bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <p className="text-sm text-zinc-500 font-serif">{t("subtitle")}</p>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("searchPosts")}
        />
      </div>

      {/* Posts List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-zinc-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => handleViewPost(post.id)}
            />
          ))
        ) : (
          <EmptyState
            icon={Blocks}
            title={searchQuery ? t("noPostsFound") : t("noPosts")}
            message={searchQuery ? t("tryDifferentSearch") : t("beFirstToPost")}
          />
        )}
      </div>

      {/* Create Post Drawer */}
      <CreatePostDrawer
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
        onPostCreated={handlePostCreated}
      />

      <BottomNav />
    </div>
  );
}
