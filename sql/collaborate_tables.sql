-- ============================================
-- COLLABORATE FEATURE DATABASE TABLES
-- Run these SQL commands in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. COLLABORATE POSTS TABLE
-- ============================================
-- This table stores collaborative forum posts
-- Posts can have photos attached (stored as array of URLs)

CREATE TABLE IF NOT EXISTS collaborate_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by store
CREATE INDEX IF NOT EXISTS idx_collaborate_posts_store_id ON collaborate_posts(store_id);

-- Create index for faster queries by author
CREATE INDEX IF NOT EXISTS idx_collaborate_posts_author_id ON collaborate_posts(author_id);

-- Create index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_collaborate_posts_created_at ON collaborate_posts(created_at DESC);

-- ============================================
-- 2. COLLABORATE REPLIES TABLE
-- ============================================
-- This table stores replies to collaborative posts

CREATE TABLE IF NOT EXISTS collaborate_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES collaborate_posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by post
CREATE INDEX IF NOT EXISTS idx_collaborate_replies_post_id ON collaborate_replies(post_id);

-- Create index for faster queries by author
CREATE INDEX IF NOT EXISTS idx_collaborate_replies_author_id ON collaborate_replies(author_id);

-- Create index for ordering by creation date
CREATE INDEX IF NOT EXISTS idx_collaborate_replies_created_at ON collaborate_replies(created_at ASC);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on collaborate_posts
ALTER TABLE collaborate_posts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on collaborate_replies
ALTER TABLE collaborate_replies ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view posts in their store
CREATE POLICY "Users can view posts in their store" ON collaborate_posts
    FOR SELECT
    USING (true);

-- Policy: Anyone authenticated can create posts
CREATE POLICY "Users can create posts" ON collaborate_posts
    FOR INSERT
    WITH CHECK (auth.uid() = author_id);

-- Policy: Authors can update their own posts
CREATE POLICY "Authors can update own posts" ON collaborate_posts
    FOR UPDATE
    USING (auth.uid() = author_id);

-- Policy: Authors can delete their own posts
CREATE POLICY "Authors can delete own posts" ON collaborate_posts
    FOR DELETE
    USING (auth.uid() = author_id);

-- Policy: Anyone can view replies
CREATE POLICY "Users can view replies" ON collaborate_replies
    FOR SELECT
    USING (true);

-- Policy: Anyone authenticated can create replies
CREATE POLICY "Users can create replies" ON collaborate_replies
    FOR INSERT
    WITH CHECK (auth.uid() = author_id);

-- Policy: Authors can update their own replies
CREATE POLICY "Authors can update own replies" ON collaborate_replies
    FOR UPDATE
    USING (auth.uid() = author_id);

-- Policy: Authors can delete their own replies
CREATE POLICY "Authors can delete own replies" ON collaborate_replies
    FOR DELETE
    USING (auth.uid() = author_id);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for collaborate_posts
CREATE TRIGGER update_collaborate_posts_updated_at
    BEFORE UPDATE ON collaborate_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for collaborate_replies
CREATE TRIGGER update_collaborate_replies_updated_at
    BEFORE UPDATE ON collaborate_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
