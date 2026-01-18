-- ============================================
-- SEASHORE DATABASE SCHEMA FOR SUPABASE
-- ============================================
-- Run this SQL in your Supabase SQL Editor to create all tables and policies

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar TEXT,
    type TEXT CHECK (type IN ('Guest', 'Member', 'Owner', 'Assistant')) DEFAULT 'Guest',
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores table
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    banner TEXT,
    name TEXT NOT NULL,
    description TEXT,
    rules TEXT,
    balance DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store owners junction table
CREATE TABLE store_owners (
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (store_id, user_id)
);

-- Store assistants junction table
CREATE TABLE store_assistants (
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (store_id, user_id)
);

-- Store members junction table
CREATE TABLE store_members (
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (store_id, user_id)
);

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    status TEXT CHECK (status IN ('created', 'assigned')) DEFAULT 'created',
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ,
    status TEXT CHECK (status IN ('created', 'assigned', 'finished')) DEFAULT 'created',
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books table
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    cover TEXT,
    background TEXT,
    title TEXT NOT NULL,
    author TEXT,
    publication_date TEXT,
    description TEXT,
    categories TEXT[] DEFAULT '{}',
    likes INTEGER DEFAULT 0,
    is_borrowed BOOLEAN DEFAULT FALSE,
    borrower_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User favorite books junction table
CREATE TABLE user_favorite_books (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, book_id)
);

-- Spendings table
CREATE TABLE spendings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    categories TEXT,
    time TIMESTAMPTZ DEFAULT NOW(),
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    cover TEXT,
    title TEXT NOT NULL,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT CHECK (status IN ('proposed', 'open', 'full', 'cancelled', 'rejected', 'finished')) DEFAULT 'proposed',
    description TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event attendees junction table
CREATE TABLE event_attendees (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- Event hosts junction table
CREATE TABLE event_hosts (
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- User attended events junction table
CREATE TABLE user_attended_events (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, event_id)
);

-- User hosted events junction table
CREATE TABLE user_hosted_events (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, event_id)
);

-- Invite codes table for member registration
CREATE TABLE invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Users indexes
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_users_name ON users(name);

-- Stores indexes
CREATE INDEX idx_stores_name ON stores(name);

-- Store relationships indexes
CREATE INDEX idx_store_owners_store ON store_owners(store_id);
CREATE INDEX idx_store_owners_user ON store_owners(user_id);
CREATE INDEX idx_store_assistants_store ON store_assistants(store_id);
CREATE INDEX idx_store_assistants_user ON store_assistants(user_id);
CREATE INDEX idx_store_members_store ON store_members(store_id);
CREATE INDEX idx_store_members_user ON store_members(user_id);

-- Roles indexes
CREATE INDEX idx_roles_store ON roles(store_id);
CREATE INDEX idx_roles_assignee ON roles(assignee_id);
CREATE INDEX idx_roles_status ON roles(status);

-- Tasks indexes
CREATE INDEX idx_tasks_store ON tasks(store_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_deadline ON tasks(deadline);

-- Books indexes
CREATE INDEX idx_books_store ON books(store_id);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_is_borrowed ON books(is_borrowed);
CREATE INDEX idx_books_borrower ON books(borrower_id);

-- Spendings indexes
CREATE INDEX idx_spendings_store ON spendings(store_id);
CREATE INDEX idx_spendings_time ON spendings(time);
CREATE INDEX idx_spendings_categories ON spendings(categories);

-- Events indexes
CREATE INDEX idx_events_store ON events(store_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_start_date_status ON events(start_date, status);

-- Event relationships indexes
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON event_attendees(user_id);
CREATE INDEX idx_event_hosts_event ON event_hosts(event_id);
CREATE INDEX idx_event_hosts_user ON event_hosts(user_id);

-- User book favorites indexes
CREATE INDEX idx_user_favorite_books_user ON user_favorite_books(user_id);
CREATE INDEX idx_user_favorite_books_book ON user_favorite_books(book_id);

-- Invite codes indexes
CREATE INDEX idx_invite_codes_code ON invite_codes(code);
CREATE INDEX idx_invite_codes_is_used ON invite_codes(is_used);
CREATE INDEX idx_invite_codes_created_by ON invite_codes(created_by);
CREATE INDEX idx_invite_codes_store ON invite_codes(store_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to check if user is store owner
CREATE OR REPLACE FUNCTION is_store_owner(store_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM store_owners 
        WHERE store_id = store_uuid AND user_id = user_uuid
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to check if user is store assistant
CREATE OR REPLACE FUNCTION is_store_assistant(store_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM store_assistants 
        WHERE store_id = store_uuid AND user_id = user_uuid
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to check if user is store member
CREATE OR REPLACE FUNCTION is_store_member(store_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM store_members 
        WHERE store_id = store_uuid AND user_id = user_uuid
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to check if user has any role in store (owner, assistant, or member)
CREATE OR REPLACE FUNCTION has_store_access(store_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN is_store_owner(store_uuid, user_uuid) 
        OR is_store_assistant(store_uuid, user_uuid) 
        OR is_store_member(store_uuid, user_uuid);
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spendings_updated_at BEFORE UPDATE ON spendings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE spendings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attended_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hosted_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================

-- Anyone can view users
CREATE POLICY "Users are viewable by everyone"
    ON users FOR SELECT
    USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ============================================
-- STORES POLICIES
-- ============================================

-- Anyone can view stores
CREATE POLICY "Stores are viewable by everyone"
    ON stores FOR SELECT
    USING (true);

-- Authenticated users can create stores
CREATE POLICY "Authenticated users can create stores"
    ON stores FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Only store owners can update stores
CREATE POLICY "Store owners can update stores"
    ON stores FOR UPDATE
    USING (is_store_owner(id, auth.uid()));

-- Only store owners can delete stores
CREATE POLICY "Store owners can delete stores"
    ON stores FOR DELETE
    USING (is_store_owner(id, auth.uid()));

-- ============================================
-- STORE OWNERS POLICIES
-- ============================================

CREATE POLICY "Store owners visible to all"
    ON store_owners FOR SELECT
    USING (true);

CREATE POLICY "Store owners can manage owners"
    ON store_owners FOR ALL
    USING (is_store_owner(store_id, auth.uid()));

-- ============================================
-- STORE ASSISTANTS POLICIES
-- ============================================

CREATE POLICY "Store assistants visible to all"
    ON store_assistants FOR SELECT
    USING (true);

CREATE POLICY "Store owners can manage assistants"
    ON store_assistants FOR ALL
    USING (is_store_owner(store_id, auth.uid()));

-- ============================================
-- STORE MEMBERS POLICIES
-- ============================================

CREATE POLICY "Store members visible to all"
    ON store_members FOR SELECT
    USING (true);

CREATE POLICY "Store owners/assistants can manage members"
    ON store_members FOR ALL
    USING (is_store_owner(store_id, auth.uid()) OR is_store_assistant(store_id, auth.uid()));

-- Users can add themselves as members
CREATE POLICY "Users can join stores as members"
    ON store_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ROLES POLICIES
-- ============================================

CREATE POLICY "Roles are viewable by everyone"
    ON roles FOR SELECT
    USING (true);

-- Only store owners can create roles
CREATE POLICY "Store owners can create roles"
    ON roles FOR INSERT
    WITH CHECK (is_store_owner(store_id, auth.uid()));

-- Only store owners can update/assign roles
CREATE POLICY "Store owners can update roles"
    ON roles FOR UPDATE
    USING (is_store_owner(store_id, auth.uid()));

-- Only store owners can delete roles
CREATE POLICY "Store owners can delete roles"
    ON roles FOR DELETE
    USING (is_store_owner(store_id, auth.uid()));

-- ============================================
-- TASKS POLICIES
-- ============================================

CREATE POLICY "Tasks are viewable by store members"
    ON tasks FOR SELECT
    USING (has_store_access(store_id, auth.uid()));

-- Owners and assistants can create tasks
CREATE POLICY "Owners/assistants can create tasks"
    ON tasks FOR INSERT
    WITH CHECK (is_store_owner(store_id, auth.uid()) OR is_store_assistant(store_id, auth.uid()));

-- Owners, assistants, and assignees can update tasks
CREATE POLICY "Owners/assistants/assignees can update tasks"
    ON tasks FOR UPDATE
    USING (
        is_store_owner(store_id, auth.uid()) 
        OR is_store_assistant(store_id, auth.uid())
        OR assignee_id = auth.uid()
    );

-- Only owners and assistants can delete tasks
CREATE POLICY "Owners/assistants can delete tasks"
    ON tasks FOR DELETE
    USING (is_store_owner(store_id, auth.uid()) OR is_store_assistant(store_id, auth.uid()));

-- ============================================
-- BOOKS POLICIES
-- ============================================

CREATE POLICY "Books are viewable by everyone"
    ON books FOR SELECT
    USING (true);

-- Owners and assistants can add books
CREATE POLICY "Owners/assistants can add books"
    ON books FOR INSERT
    WITH CHECK (is_store_owner(store_id, auth.uid()) OR is_store_assistant(store_id, auth.uid()));

-- Owners and assistants can update books
CREATE POLICY "Owners/assistants can update books"
    ON books FOR UPDATE
    USING (is_store_owner(store_id, auth.uid()) OR is_store_assistant(store_id, auth.uid()));

-- Only owners can delete books
CREATE POLICY "Owners can delete books"
    ON books FOR DELETE
    USING (is_store_owner(store_id, auth.uid()));

-- ============================================
-- USER FAVORITE BOOKS POLICIES
-- ============================================

CREATE POLICY "User favorites viewable by owner"
    ON user_favorite_books FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
    ON user_favorite_books FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- SPENDINGS POLICIES
-- ============================================

CREATE POLICY "Spendings viewable by store staff"
    ON spendings FOR SELECT
    USING (is_store_owner(store_id, auth.uid()) OR is_store_assistant(store_id, auth.uid()));

-- Owners and assistants can add spendings
CREATE POLICY "Owners/assistants can add spendings"
    ON spendings FOR INSERT
    WITH CHECK (is_store_owner(store_id, auth.uid()) OR is_store_assistant(store_id, auth.uid()));

-- Owners and assistants can update spendings
CREATE POLICY "Owners/assistants can update spendings"
    ON spendings FOR UPDATE
    USING (is_store_owner(store_id, auth.uid()) OR is_store_assistant(store_id, auth.uid()));

-- Only owners can delete spendings
CREATE POLICY "Owners can delete spendings"
    ON spendings FOR DELETE
    USING (is_store_owner(store_id, auth.uid()));

-- ============================================
-- EVENTS POLICIES
-- ============================================

CREATE POLICY "Events are viewable by everyone"
    ON events FOR SELECT
    USING (true);

-- Anyone with store access can propose events
CREATE POLICY "Store members can propose events"
    ON events FOR INSERT
    WITH CHECK (has_store_access(store_id, auth.uid()));

-- Owners, assistants, and event hosts can update events
CREATE POLICY "Owners/assistants/hosts can update events"
    ON events FOR UPDATE
    USING (
        is_store_owner(store_id, auth.uid()) 
        OR is_store_assistant(store_id, auth.uid())
        OR EXISTS (
            SELECT 1 FROM event_hosts 
            WHERE event_id = events.id AND user_id = auth.uid()
        )
    );

-- Only owners and assistants can delete events
CREATE POLICY "Owners/assistants can delete events"
    ON events FOR DELETE
    USING (is_store_owner(store_id, auth.uid()) OR is_store_assistant(store_id, auth.uid()));

-- ============================================
-- EVENT ATTENDEES POLICIES
-- ============================================

CREATE POLICY "Event attendees viewable by everyone"
    ON event_attendees FOR SELECT
    USING (true);

-- Users can add themselves as attendees
CREATE POLICY "Users can attend events"
    ON event_attendees FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can remove themselves, owners/assistants can remove anyone
CREATE POLICY "Users can leave events"
    ON event_attendees FOR DELETE
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_id 
            AND (is_store_owner(e.store_id, auth.uid()) OR is_store_assistant(e.store_id, auth.uid()))
        )
    );

-- ============================================
-- EVENT HOSTS POLICIES
-- ============================================

CREATE POLICY "Event hosts viewable by everyone"
    ON event_hosts FOR SELECT
    USING (true);

-- Owners and assistants can manage event hosts
CREATE POLICY "Owners/assistants can manage event hosts"
    ON event_hosts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM events e 
            WHERE e.id = event_id 
            AND (is_store_owner(e.store_id, auth.uid()) OR is_store_assistant(e.store_id, auth.uid()))
        )
    );

-- ============================================
-- USER ATTENDED/HOSTED EVENTS POLICIES
-- ============================================

CREATE POLICY "User attended events viewable by owner"
    ON user_attended_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own attended events"
    ON user_attended_events FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "User hosted events viewable by owner"
    ON user_hosted_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own hosted events"
    ON user_hosted_events FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- INVITE CODES POLICIES
-- ============================================

-- Anyone can check if an invite code exists (for validation during registration)
CREATE POLICY "Anyone can validate invite codes"
    ON invite_codes FOR SELECT
    USING (true);

-- Only owners/assistants can create invite codes
CREATE POLICY "Staff can create invite codes"
    ON invite_codes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND type IN ('Owner', 'Assistant')
        )
    );

-- Service role can update invite codes (for marking as used)
-- Note: This is handled via service role key in API routes

-- Only creators or owners can delete unused invite codes
CREATE POLICY "Creators can delete unused invite codes"
    ON invite_codes FOR DELETE
    USING (
        created_by = auth.uid() 
        AND is_used = false
    );

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to all tables for authenticated users
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- ADDITIONAL FUNCTIONS FOR OPERATIONS
-- ============================================

-- Function to increment book likes
CREATE OR REPLACE FUNCTION increment_book_likes(book_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE books SET likes = likes + 1 WHERE id = book_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to decrement book likes
CREATE OR REPLACE FUNCTION decrement_book_likes(book_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE books SET likes = GREATEST(0, likes - 1) WHERE id = book_id;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to validate an invite code (check if it exists, is unused, and not expired)
CREATE OR REPLACE FUNCTION validate_invite_code(invite_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM invite_codes 
        WHERE code = invite_code 
        AND is_used = false
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to use an invite code (mark as used and record who used it)
CREATE OR REPLACE FUNCTION use_invite_code(invite_code TEXT, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    code_valid BOOLEAN;
BEGIN
    -- Check if code is valid
    SELECT validate_invite_code(invite_code) INTO code_valid;
    
    IF NOT code_valid THEN
        RETURN false;
    END IF;
    
    -- Mark the code as used
    UPDATE invite_codes 
    SET is_used = true, 
        used_by = user_uuid, 
        used_at = NOW()
    WHERE code = invite_code 
    AND is_used = false;
    
    RETURN true;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_book_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_book_likes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_store_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_store_assistant(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_store_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_store_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_invite_code(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION use_invite_code(TEXT, UUID) TO authenticated;
