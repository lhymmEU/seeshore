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
    <div className="min-h-screen bg-background pb-24 lg:pb-6">
      {/* Header Section */}
      <div className="px-4 pt-12 pb-4 space-y-4 max-w-5xl mx-auto lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground font-display">{t("title")}</h1>
          <button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground font-serif">{t("subtitle")}</p>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("searchPosts")}
        />
      </div>

      {/* Posts List */}
      <div className="px-4 space-y-3 max-w-5xl mx-auto lg:px-8 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {isLoading ? (
          // Loading skeleton
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-muted rounded-2xl animate-pulse"
              />
            ))}
          </>
        ) : filteredPosts.length > 0 ? (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => handleViewPost(post.id)}
            />
          ))
        ) : (
          <div className="lg:col-span-2">
            <EmptyState
              icon={Blocks}
              title={searchQuery ? t("noPostsFound") : t("noPosts")}
              message={searchQuery ? t("tryDifferentSearch") : t("beFirstToPost")}
            />
          </div>
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
