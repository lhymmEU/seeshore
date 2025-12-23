import { createClient } from '@supabase/supabase-js';
import type { Store, User, Book, Spending, Role, Task, StoreEvent } from '@/types/type';

// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create an authenticated Supabase client using an access token
// This is used for server-side operations that need to respect RLS
export function createAuthenticatedClient(accessToken: string) {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
}

// ============================================
// DATABASE TYPES (matching Supabase schema)
// ============================================

interface DbUser {
    id: string;
    name: string;
    avatar: string | null;
    type: 'Guest' | 'Member' | 'Owner' | 'Assistant';
    location: string | null;
    created_at: string;
    updated_at: string;
}

interface DbStore {
    id: string;
    banner: string | null;
    name: string;
    description: string | null;
    rules: string | null;
    balance: number;
    created_at: string;
    updated_at: string;
}

interface DbRole {
    id: string;
    store_id: string;
    name: string;
    status: 'created' | 'assigned';
    assignee_id: string | null;
    created_at: string;
    updated_at: string;
}

interface DbTask {
    id: string;
    store_id: string;
    name: string;
    description: string | null;
    deadline: string | null;
    status: 'created' | 'assigned' | 'finished';
    assignee_id: string | null;
    created_at: string;
    updated_at: string;
}

interface DbBook {
    id: string;
    store_id: string;
    cover: string | null;
    background: string | null;
    title: string;
    author: string | null;
    publication_date: string | null;
    description: string | null;
    categories: string[];
    likes: number;
    is_borrowed: boolean;
    borrower_id: string | null;
    created_at: string;
    updated_at: string;
}

interface DbSpending {
    id: string;
    store_id: string;
    name: string;
    categories: string | null;
    time: string;
    amount: number;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface DbEvent {
    id: string;
    store_id: string;
    cover: string | null;
    title: string;
    start_date: string | null;
    end_date: string | null;
    status: 'proposed' | 'open' | 'full' | 'cancelled' | 'rejected' | 'finished';
    description: string | null;
    location: string | null;
    created_at: string;
    updated_at: string;
}

interface RelationRow {
    user_id: string;
}

interface BookRelationRow {
    book_id: string;
}

interface EventRelationRow {
    event_id: string;
}

interface IdRow {
    id: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function mapDbUserToUser(dbUser: DbUser): User {
    return {
        id: dbUser.id,
        name: dbUser.name,
        avatar: dbUser.avatar || '',
        type: dbUser.type,
        location: dbUser.location || undefined,
        borrowed: [],
    };
}

function mapDbRoleToRole(dbRole: DbRole): Role {
    return {
        id: dbRole.id,
        name: dbRole.name,
        status: dbRole.status,
        assignee: dbRole.assignee_id || '',
    };
}

function mapDbTaskToTask(dbTask: DbTask): Task {
    return {
        id: dbTask.id,
        name: dbTask.name,
        description: dbTask.description || '',
        deadline: dbTask.deadline || '',
        status: dbTask.status,
        assignee: dbTask.assignee_id || undefined,
    };
}

function mapDbBookToBook(dbBook: DbBook): Book {
    return {
        id: dbBook.id,
        cover: dbBook.cover || '',
        background: dbBook.background || '',
        title: dbBook.title,
        author: dbBook.author || '',
        publicationDate: dbBook.publication_date || '',
        description: dbBook.description || '',
        categories: dbBook.categories || [],
        likes: dbBook.likes,
        isBorrowed: dbBook.is_borrowed,
    };
}

function mapDbSpendingToSpending(dbSpending: DbSpending): Spending {
    return {
        id: dbSpending.id,
        name: dbSpending.name,
        categories: dbSpending.categories || '',
        time: dbSpending.time,
        amount: dbSpending.amount,
        description: dbSpending.description || '',
    };
}

function mapDbEventToStoreEvent(dbEvent: DbEvent, attendees: string[] = [], hosts: string[] = []): StoreEvent {
    return {
        id: dbEvent.id,
        cover: dbEvent.cover || '',
        title: dbEvent.title,
        startDate: dbEvent.start_date || '',
        endDate: dbEvent.end_date || '',
        status: dbEvent.status,
        description: dbEvent.description || '',
        location: dbEvent.location || '',
        attendees,
        hosts,
    };
}

// ============================================
// 1. LOGIN WITH EMAIL - Sign in existing user with email/password
// ============================================

export async function loginWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    // Fetch or return the user profile
    if (data.user) {
        try {
            const userProfile = await fetchUser(data.user.id);
            return { auth: data, user: userProfile };
        } catch {
            // User profile doesn't exist yet, return auth data only
            return { auth: data, user: null };
        }
    }

    return { auth: data, user: null };
}

// ============================================
// 2. REGISTER WITH EMAIL - Create new user with email/password
// ============================================

export async function registerWithEmail(email: string, password: string, name: string) {
    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
            },
        },
    });

    if (authError) {
        throw new Error(authError.message);
    }

    if (!authData.user) {
        throw new Error('Failed to create user');
    }

    // Check if user profile already exists (in case of re-registration)
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

    if (existingUser) {
        // User already exists, just return their data
        const user = await fetchUser(authData.user.id);
        return { auth: authData, user };
    }

    // Create user profile in users table
    const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
            id: authData.user.id,
            name,
            type: 'Guest',
        })
        .select()
        .single();

    if (userError) {
        throw new Error(userError.message);
    }

    return { auth: authData, user: mapDbUserToUser(userData as DbUser) };
}

// ============================================
// 3. RESET PASSWORD - Send password reset email
// ============================================

export async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ============================================
// 4. UPDATE PASSWORD - Update user's password
// ============================================

export async function updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ============================================
// 3. FETCH STORES - Fetch all stores in the db
// ============================================

export async function fetchStores(): Promise<Store[]> {
    const { data: stores, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    // Fetch related data for each store
    const storesWithRelations = await Promise.all(
        (stores as DbStore[]).map(async (store: DbStore) => {
            // Fetch owners
            const { data: ownerRelations } = await supabase
                .from('store_owners')
                .select('user_id')
                .eq('store_id', store.id);

            const ownerIds = (ownerRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || [];
            const owners = ownerIds.length > 0 ? await fetchUsers(ownerIds) : [];

            // Fetch assistants
            const { data: assistantRelations } = await supabase
                .from('store_assistants')
                .select('user_id')
                .eq('store_id', store.id);

            const assistantIds = (assistantRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || [];
            const assistants = assistantIds.length > 0 ? await fetchUsers(assistantIds) : [];

            // Fetch members
            const { data: memberRelations } = await supabase
                .from('store_members')
                .select('user_id')
                .eq('store_id', store.id);

            const memberIds = (memberRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || [];

            // Fetch roles
            const { data: roles } = await supabase
                .from('roles')
                .select('*')
                .eq('store_id', store.id);

            // Fetch task IDs
            const { data: tasks } = await supabase
                .from('tasks')
                .select('id')
                .eq('store_id', store.id);

            // Fetch book IDs
            const { data: books } = await supabase
                .from('books')
                .select('id')
                .eq('store_id', store.id);

            // Fetch event IDs
            const { data: events } = await supabase
                .from('events')
                .select('id')
                .eq('store_id', store.id);

            // Fetch spending IDs
            const { data: spendings } = await supabase
                .from('spendings')
                .select('id')
                .eq('store_id', store.id);

            return {
                id: store.id,
                banner: store.banner || '',
                owners,
                assistants,
                members: memberIds,
                name: store.name,
                description: store.description || '',
                rules: store.rules || '',
                roles: (roles as DbRole[] | null)?.map(mapDbRoleToRole) || [],
                tasks: (tasks as IdRow[] | null)?.map((t: IdRow) => t.id) || [],
                books: (books as IdRow[] | null)?.map((b: IdRow) => b.id) || [],
                events: (events as IdRow[] | null)?.map((e: IdRow) => e.id) || [],
                balance: store.balance,
                spendings: (spendings as IdRow[] | null)?.map((s: IdRow) => s.id) || [],
            } as Store;
        })
    );

    return storesWithRelations;
}

// ============================================
// 4. FETCH ROLES - Fetch all roles
// ============================================

export async function fetchRoles(storeId?: string): Promise<Role[]> {
    let query = supabase.from('roles').select('*');

    if (storeId) {
        query = query.eq('store_id', storeId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data as DbRole[]).map(mapDbRoleToRole);
}

// ============================================
// 5. CREATE ROLE - Owners can create
// ============================================

export async function createRole(storeId: string, name: string): Promise<Role> {
    const { data, error } = await supabase
        .from('roles')
        .insert({
            store_id: storeId,
            name,
            status: 'created',
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return mapDbRoleToRole(data as DbRole);
}

// ============================================
// 6. ASSIGN ROLE - Owners can assign
// ============================================

export async function assignRole(roleId: string, assigneeId: string): Promise<Role> {
    const { data, error } = await supabase
        .from('roles')
        .update({
            assignee_id: assigneeId,
            status: 'assigned',
        })
        .eq('id', roleId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return mapDbRoleToRole(data as DbRole);
}

// ============================================
// 7. FETCH EVENTS - Based on start date and status
// ============================================

export async function fetchEvents(options?: {
    storeId?: string;
    startDate?: string;
    status?: StoreEvent['status'];
    limit?: number;
}): Promise<StoreEvent[]> {
    let query = supabase.from('events').select('*');

    if (options?.storeId) {
        query = query.eq('store_id', options.storeId);
    }

    if (options?.startDate) {
        query = query.gte('start_date', options.startDate);
    }

    if (options?.status) {
        query = query.eq('status', options.status);
    }

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const { data: events, error } = await query.order('start_date', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    // Fetch attendees and hosts for each event
    const eventsWithRelations = await Promise.all(
        (events as DbEvent[]).map(async (event: DbEvent) => {
            const { data: attendeeRelations } = await supabase
                .from('event_attendees')
                .select('user_id')
                .eq('event_id', event.id);

            const { data: hostRelations } = await supabase
                .from('event_hosts')
                .select('user_id')
                .eq('event_id', event.id);

            return mapDbEventToStoreEvent(
                event,
                (attendeeRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || [],
                (hostRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || []
            );
        })
    );

    return eventsWithRelations;
}

// ============================================
// 8. FETCH EVENT - Fetch one specific event
// ============================================

export async function fetchEvent(eventId: string): Promise<StoreEvent> {
    const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Fetch attendees
    const { data: attendeeRelations } = await supabase
        .from('event_attendees')
        .select('user_id')
        .eq('event_id', eventId);

    // Fetch hosts
    const { data: hostRelations } = await supabase
        .from('event_hosts')
        .select('user_id')
        .eq('event_id', eventId);

    return mapDbEventToStoreEvent(
        event as DbEvent,
        (attendeeRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || [],
        (hostRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || []
    );
}

// ============================================
// 9. CREATE EVENT - Set status to "open"
// ============================================

export async function createEvent(
    storeId: string,
    eventData: {
        title: string;
        cover?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
        location?: string;
        hostIds?: string[];
    },
    accessToken?: string
): Promise<StoreEvent> {
    // Use authenticated client if access token is provided (for RLS compliance)
    const client = accessToken ? createAuthenticatedClient(accessToken) : supabase;

    const { data: event, error } = await client
        .from('events')
        .insert({
            store_id: storeId,
            title: eventData.title,
            cover: eventData.cover,
            start_date: eventData.startDate,
            end_date: eventData.endDate,
            description: eventData.description,
            location: eventData.location,
            status: 'open',
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Add hosts if provided (also use authenticated client)
    if (eventData.hostIds && eventData.hostIds.length > 0) {
        const hostInserts = eventData.hostIds.map(hostId => ({
            event_id: (event as DbEvent).id,
            user_id: hostId,
        }));

        await client.from('event_hosts').insert(hostInserts);
    }

    return mapDbEventToStoreEvent(event as DbEvent, [], eventData.hostIds || []);
}

// ============================================
// 10. PROPOSE EVENT - Set status to "proposed"
// ============================================

export async function proposeEvent(
    storeId: string,
    eventData: {
        title: string;
        cover?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
        location?: string;
        hostIds?: string[];
    },
    accessToken?: string
): Promise<StoreEvent> {
    // Use authenticated client if access token is provided (for RLS compliance)
    const client = accessToken ? createAuthenticatedClient(accessToken) : supabase;

    const { data: event, error } = await client
        .from('events')
        .insert({
            store_id: storeId,
            title: eventData.title,
            cover: eventData.cover,
            start_date: eventData.startDate,
            end_date: eventData.endDate,
            description: eventData.description,
            location: eventData.location,
            status: 'proposed',
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Add hosts if provided (also use authenticated client)
    if (eventData.hostIds && eventData.hostIds.length > 0) {
        const hostInserts = eventData.hostIds.map(hostId => ({
            event_id: (event as DbEvent).id,
            user_id: hostId,
        }));

        await client.from('event_hosts').insert(hostInserts);
    }

    return mapDbEventToStoreEvent(event as DbEvent, [], eventData.hostIds || []);
}

// ============================================
// 11. APPROVE EVENT - Set status to "open"
// ============================================

export async function approveEvent(eventId: string): Promise<StoreEvent> {
    const { data: event, error } = await supabase
        .from('events')
        .update({ status: 'open' })
        .eq('id', eventId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Fetch attendees and hosts
    const { data: attendeeRelations } = await supabase
        .from('event_attendees')
        .select('user_id')
        .eq('event_id', eventId);

    const { data: hostRelations } = await supabase
        .from('event_hosts')
        .select('user_id')
        .eq('event_id', eventId);

    return mapDbEventToStoreEvent(
        event as DbEvent,
        (attendeeRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || [],
        (hostRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || []
    );
}

// ============================================
// 12. REJECT EVENT - Set status to "rejected"
// ============================================

export async function rejectEvent(eventId: string): Promise<StoreEvent> {
    const { data: event, error } = await supabase
        .from('events')
        .update({ status: 'rejected' })
        .eq('id', eventId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Fetch attendees and hosts
    const { data: attendeeRelations } = await supabase
        .from('event_attendees')
        .select('user_id')
        .eq('event_id', eventId);

    const { data: hostRelations } = await supabase
        .from('event_hosts')
        .select('user_id')
        .eq('event_id', eventId);

    return mapDbEventToStoreEvent(
        event as DbEvent,
        (attendeeRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || [],
        (hostRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || []
    );
}

// ============================================
// 13. EDIT EVENT
// ============================================

export async function editEvent(
    eventId: string,
    updates: {
        title?: string;
        cover?: string;
        startDate?: string;
        endDate?: string;
        description?: string;
        location?: string;
        status?: StoreEvent['status'];
    }
): Promise<StoreEvent> {
    const updateData: Record<string, unknown> = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.cover !== undefined) updateData.cover = updates.cover;
    if (updates.startDate !== undefined) updateData.start_date = updates.startDate;
    if (updates.endDate !== undefined) updateData.end_date = updates.endDate;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data: event, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', eventId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Fetch attendees and hosts
    const { data: attendeeRelations } = await supabase
        .from('event_attendees')
        .select('user_id')
        .eq('event_id', eventId);

    const { data: hostRelations } = await supabase
        .from('event_hosts')
        .select('user_id')
        .eq('event_id', eventId);

    return mapDbEventToStoreEvent(
        event as DbEvent,
        (attendeeRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || [],
        (hostRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || []
    );
}

// ============================================
// 14. DELETE EVENT
// ============================================

export async function deleteEvent(eventId: string): Promise<void> {
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

    if (error) {
        throw new Error(error.message);
    }
}

// ============================================
// 15. FETCH STORE INFO - Fetch detailed store info
// ============================================

export async function fetchStoreInfo(storeId: string): Promise<Store> {
    const { data: store, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    const dbStore = store as DbStore;

    // Fetch owners
    const { data: ownerRelations } = await supabase
        .from('store_owners')
        .select('user_id')
        .eq('store_id', storeId);

    const ownerIds = (ownerRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || [];
    const owners = ownerIds.length > 0 ? await fetchUsers(ownerIds) : [];

    // Fetch assistants
    const { data: assistantRelations } = await supabase
        .from('store_assistants')
        .select('user_id')
        .eq('store_id', storeId);

    const assistantIds = (assistantRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || [];
    const assistants = assistantIds.length > 0 ? await fetchUsers(assistantIds) : [];

    // Fetch members
    const { data: memberRelations } = await supabase
        .from('store_members')
        .select('user_id')
        .eq('store_id', storeId);

    const memberIds = (memberRelations as RelationRow[] | null)?.map((r: RelationRow) => r.user_id) || [];

    // Fetch roles
    const { data: roles } = await supabase
        .from('roles')
        .select('*')
        .eq('store_id', storeId);

    // Fetch task IDs
    const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('store_id', storeId);

    // Fetch book IDs
    const { data: books } = await supabase
        .from('books')
        .select('id')
        .eq('store_id', storeId);

    // Fetch event IDs
    const { data: events } = await supabase
        .from('events')
        .select('id')
        .eq('store_id', storeId);

    // Fetch spending IDs
    const { data: spendings } = await supabase
        .from('spendings')
        .select('id')
        .eq('store_id', storeId);

    return {
        id: dbStore.id,
        banner: dbStore.banner || '',
        owners,
        assistants,
        members: memberIds,
        name: dbStore.name,
        description: dbStore.description || '',
        rules: dbStore.rules || '',
        roles: (roles as DbRole[] | null)?.map(mapDbRoleToRole) || [],
        tasks: (tasks as IdRow[] | null)?.map((t: IdRow) => t.id) || [],
        books: (books as IdRow[] | null)?.map((b: IdRow) => b.id) || [],
        events: (events as IdRow[] | null)?.map((e: IdRow) => e.id) || [],
        balance: dbStore.balance,
        spendings: (spendings as IdRow[] | null)?.map((s: IdRow) => s.id) || [],
    };
}

// ============================================
// 16. FETCH TASKS - Fetch all tasks
// ============================================

export async function fetchTasks(storeId?: string): Promise<Task[]> {
    let query = supabase.from('tasks').select('*');

    if (storeId) {
        query = query.eq('store_id', storeId);
    }

    const { data, error } = await query.order('deadline', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return (data as DbTask[]).map(mapDbTaskToTask);
}

// ============================================
// 17. CREATE TASK
// ============================================

export async function createTask(
    storeId: string,
    taskData: {
        name: string;
        description?: string;
        deadline?: string;
        assigneeId?: string;
    }
): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .insert({
            store_id: storeId,
            name: taskData.name,
            description: taskData.description,
            deadline: taskData.deadline,
            assignee_id: taskData.assigneeId,
            status: taskData.assigneeId ? 'assigned' : 'created',
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return mapDbTaskToTask(data as DbTask);
}

// ============================================
// 18. COMPLETE TASK - Mark status as "finished"
// ============================================

export async function completeTask(taskId: string): Promise<Task> {
    const { data, error } = await supabase
        .from('tasks')
        .update({ status: 'finished' })
        .eq('id', taskId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return mapDbTaskToTask(data as DbTask);
}

// ============================================
// 19. EXTEND TASK - Extend deadline by 3 days
// ============================================

export async function extendTask(taskId: string): Promise<Task> {
    // First fetch the current task to get its deadline
    const { data: currentTask, error: fetchError } = await supabase
        .from('tasks')
        .select('deadline')
        .eq('id', taskId)
        .single();

    if (fetchError) {
        throw new Error(fetchError.message);
    }

    // Calculate new deadline (extend by 3 days)
    const taskData = currentTask as { deadline: string | null };
    const currentDeadline = taskData.deadline 
        ? new Date(taskData.deadline) 
        : new Date();
    
    const newDeadline = new Date(currentDeadline);
    newDeadline.setDate(newDeadline.getDate() + 3);

    const { data, error } = await supabase
        .from('tasks')
        .update({ deadline: newDeadline.toISOString() })
        .eq('id', taskId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return mapDbTaskToTask(data as DbTask);
}

// ============================================
// 20. DELETE TASK
// ============================================

export async function deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

    if (error) {
        throw new Error(error.message);
    }
}

// ============================================
// 21. REGISTER BOOK
// ============================================

export async function registerBook(
    storeId: string,
    bookData: {
        title: string;
        author?: string;
        cover?: string;
        background?: string;
        publicationDate?: string;
        description?: string;
        categories?: string[];
    }
): Promise<Book> {
    const { data, error } = await supabase
        .from('books')
        .insert({
            store_id: storeId,
            title: bookData.title,
            author: bookData.author,
            cover: bookData.cover,
            background: bookData.background,
            publication_date: bookData.publicationDate,
            description: bookData.description,
            categories: bookData.categories || [],
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return mapDbBookToBook(data as DbBook);
}

// ============================================
// 22. FETCH ALL SPENDINGS
// ============================================

export async function fetchSpendings(storeId?: string): Promise<Spending[]> {
    let query = supabase.from('spendings').select('*');

    if (storeId) {
        query = query.eq('store_id', storeId);
    }

    const { data, error } = await query.order('time', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data as DbSpending[]).map(mapDbSpendingToSpending);
}

// ============================================
// 23. ADD SPENDING
// ============================================

export async function addSpending(
    storeId: string,
    spendingData: {
        name: string;
        categories?: string;
        amount: number;
        description?: string;
        time?: string;
    }
): Promise<Spending> {
    const { data, error } = await supabase
        .from('spendings')
        .insert({
            store_id: storeId,
            name: spendingData.name,
            categories: spendingData.categories,
            amount: spendingData.amount,
            description: spendingData.description,
            time: spendingData.time || new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return mapDbSpendingToSpending(data as DbSpending);
}

// ============================================
// 24. FETCH BOOKS - Fetch all books in the db
// ============================================

export async function fetchBooks(storeId?: string): Promise<Book[]> {
    let query = supabase.from('books').select('*');

    if (storeId) {
        query = query.eq('store_id', storeId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data as DbBook[]).map(mapDbBookToBook);
}

// ============================================
// 25. FETCH BOOK - Fetch one specific book
// ============================================

export async function fetchBook(bookId: string): Promise<Book> {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return mapDbBookToBook(data as DbBook);
}

// ============================================
// 26. FETCH USERS - Fetch based on array of user ids
// ============================================

export async function fetchUsers(userIds: string[]): Promise<User[]> {
    if (userIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);

    if (error) {
        throw new Error(error.message);
    }

    // Fetch borrowed books for each user
    const usersWithBorrowed = await Promise.all(
        (data as DbUser[]).map(async (user: DbUser) => {
            const { data: borrowedBooks } = await supabase
                .from('books')
                .select('id')
                .eq('borrower_id', user.id)
                .eq('is_borrowed', true);

            const { data: favoriteBooks } = await supabase
                .from('user_favorite_books')
                .select('book_id')
                .eq('user_id', user.id);

            const { data: attendedEvents } = await supabase
                .from('user_attended_events')
                .select('event_id')
                .eq('user_id', user.id);

            const { data: hostedEvents } = await supabase
                .from('user_hosted_events')
                .select('event_id')
                .eq('user_id', user.id);

            return {
                ...mapDbUserToUser(user),
                borrowed: (borrowedBooks as IdRow[] | null)?.map((b: IdRow) => b.id) || [],
                favoriteBooks: (favoriteBooks as BookRelationRow[] | null)?.map((f: BookRelationRow) => f.book_id) || [],
                attendedEvents: (attendedEvents as EventRelationRow[] | null)?.map((e: EventRelationRow) => e.event_id) || [],
                hostedEvents: (hostedEvents as EventRelationRow[] | null)?.map((e: EventRelationRow) => e.event_id) || [],
            };
        })
    );

    return usersWithBorrowed;
}

// ============================================
// 27. FETCH USER - Fetch one specific user
// ============================================

export async function fetchUser(userId: string): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Fetch borrowed books
    const { data: borrowedBooks } = await supabase
        .from('books')
        .select('id')
        .eq('borrower_id', userId)
        .eq('is_borrowed', true);

    // Fetch favorite books
    const { data: favoriteBooks } = await supabase
        .from('user_favorite_books')
        .select('book_id')
        .eq('user_id', userId);

    // Fetch attended events
    const { data: attendedEvents } = await supabase
        .from('user_attended_events')
        .select('event_id')
        .eq('user_id', userId);

    // Fetch hosted events
    const { data: hostedEvents } = await supabase
        .from('user_hosted_events')
        .select('event_id')
        .eq('user_id', userId);

    return {
        ...mapDbUserToUser(data as DbUser),
        borrowed: (borrowedBooks as IdRow[] | null)?.map((b: IdRow) => b.id) || [],
        favoriteBooks: (favoriteBooks as BookRelationRow[] | null)?.map((f: BookRelationRow) => f.book_id) || [],
        attendedEvents: (attendedEvents as EventRelationRow[] | null)?.map((e: EventRelationRow) => e.event_id) || [],
        hostedEvents: (hostedEvents as EventRelationRow[] | null)?.map((e: EventRelationRow) => e.event_id) || [],
    };
}

// ============================================
// 28. EDIT PROFILE - Edit a user's profile
// ============================================

export async function editProfile(
    userId: string,
    updates: {
        name?: string;
        avatar?: string;
        location?: string;
        type?: User['type'];
    }
): Promise<User> {
    const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Fetch full user data including relations
    return fetchUser((data as DbUser).id);
}

// ============================================
// ADDITIONAL UTILITY FUNCTIONS
// ============================================

// Get current authenticated user
export async function getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    try {
        return await fetchUser(user.id);
    } catch {
        return null;
    }
}

// Logout
export async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }
}

// Borrow a book
export async function borrowBook(bookId: string, userId: string): Promise<Book> {
    const { data, error } = await supabase
        .from('books')
        .update({
            is_borrowed: true,
            borrower_id: userId,
        })
        .eq('id', bookId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return mapDbBookToBook(data as DbBook);
}

// Return a book
export async function returnBook(bookId: string): Promise<Book> {
    const { data, error } = await supabase
        .from('books')
        .update({
            is_borrowed: false,
            borrower_id: null,
        })
        .eq('id', bookId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return mapDbBookToBook(data as DbBook);
}

// Add book to favorites
export async function addBookToFavorites(userId: string, bookId: string): Promise<void> {
    const { error } = await supabase
        .from('user_favorite_books')
        .insert({
            user_id: userId,
            book_id: bookId,
        });

    if (error) {
        throw new Error(error.message);
    }

    // Increment likes count on the book
    await supabase.rpc('increment_book_likes', { book_id: bookId });
}

// Remove book from favorites
export async function removeBookFromFavorites(userId: string, bookId: string): Promise<void> {
    const { error } = await supabase
        .from('user_favorite_books')
        .delete()
        .eq('user_id', userId)
        .eq('book_id', bookId);

    if (error) {
        throw new Error(error.message);
    }

    // Decrement likes count on the book
    await supabase.rpc('decrement_book_likes', { book_id: bookId });
}

// Attend an event
export async function attendEvent(eventId: string, userId: string): Promise<void> {
    const { error: attendError } = await supabase
        .from('event_attendees')
        .insert({
            event_id: eventId,
            user_id: userId,
        });

    if (attendError) {
        throw new Error(attendError.message);
    }

    // Also add to user's attended events
    await supabase
        .from('user_attended_events')
        .insert({
            user_id: userId,
            event_id: eventId,
        });
}

// Leave an event
export async function leaveEvent(eventId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    // Also remove from user's attended events
    await supabase
        .from('user_attended_events')
        .delete()
        .eq('user_id', userId)
        .eq('event_id', eventId);
}

// Create a store
export async function createStore(
    storeData: {
        name: string;
        banner?: string;
        description?: string;
        rules?: string;
    },
    ownerId: string
): Promise<Store> {
    // Create the store
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
            name: storeData.name,
            banner: storeData.banner,
            description: storeData.description,
            rules: storeData.rules,
        })
        .select()
        .single();

    if (storeError) {
        throw new Error(storeError.message);
    }

    // Add the creator as owner
    const { error: ownerError } = await supabase
        .from('store_owners')
        .insert({
            store_id: (store as DbStore).id,
            user_id: ownerId,
        });

    if (ownerError) {
        throw new Error(ownerError.message);
    }

    // Update user type to Owner
    await supabase
        .from('users')
        .update({ type: 'Owner' })
        .eq('id', ownerId);

    return fetchStoreInfo((store as DbStore).id);
}

// Join a store as member
export async function joinStore(storeId: string, userId: string): Promise<void> {
    const { error } = await supabase
        .from('store_members')
        .insert({
            store_id: storeId,
            user_id: userId,
        });

    if (error) {
        throw new Error(error.message);
    }

    // Update user type to Member
    await supabase
        .from('users')
        .update({ type: 'Member' })
        .eq('id', userId);
}

// Leave a store
export async function leaveStore(storeId: string, userId: string): Promise<void> {
    // Remove from members
    await supabase
        .from('store_members')
        .delete()
        .eq('store_id', storeId)
        .eq('user_id', userId);

    // Remove from assistants
    await supabase
        .from('store_assistants')
        .delete()
        .eq('store_id', storeId)
        .eq('user_id', userId);
}

// Promote member to assistant
export async function promoteToAssistant(storeId: string, userId: string): Promise<void> {
    // Remove from members
    await supabase
        .from('store_members')
        .delete()
        .eq('store_id', storeId)
        .eq('user_id', userId);

    // Add to assistants
    const { error } = await supabase
        .from('store_assistants')
        .insert({
            store_id: storeId,
            user_id: userId,
        });

    if (error) {
        throw new Error(error.message);
    }

    // Update user type to Assistant
    await supabase
        .from('users')
        .update({ type: 'Assistant' })
        .eq('id', userId);
}

// Update a store
export async function updateStore(
    storeId: string,
    updates: {
        name?: string;
        banner?: string;
        description?: string;
        rules?: string;
    },
    accessToken?: string
): Promise<Store> {
    const updateData: Record<string, unknown> = {};

    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.banner !== undefined) updateData.banner = updates.banner;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.rules !== undefined) updateData.rules = updates.rules;
 
    console.log("Update data while updating store:", updateData);
    console.log("Using access token:", accessToken ? "yes" : "no");
    
    // Use authenticated client if access token is provided (for RLS compliance)
    const client = accessToken ? createAuthenticatedClient(accessToken) : supabase;
    
    const { data, error } = await client
        .from('stores')
        .update(updateData)
        .eq('id', storeId)
        .select();
    
    if (error) {
        throw new Error(error.message);
    }
    
    if (!data || data.length === 0) {
        throw new Error("Store update failed - no rows affected. User may not have permission to update this store.");
    }

    return fetchStoreInfo(storeId);
}

// Fetch store by user ID (owner or assistant)
export async function fetchStoreByUserId(userId: string): Promise<Store | null> {
    // First check if user is an owner
    const { data: ownerRelation } = await supabase
        .from('store_owners')
        .select('store_id')
        .eq('user_id', userId)
        .single();

    if (ownerRelation) {
        return fetchStoreInfo(ownerRelation.store_id);
    }

    // Then check if user is an assistant
    const { data: assistantRelation } = await supabase
        .from('store_assistants')
        .select('store_id')
        .eq('user_id', userId)
        .single();

    if (assistantRelation) {
        return fetchStoreInfo(assistantRelation.store_id);
    }

    return null;
}
