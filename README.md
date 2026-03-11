# SeeShore

A community bookstore management platform built with Next.js and Supabase. SeeShore enables bookstore owners to manage their inventory, host events, and build a member community — all from a responsive, mobile-first web app with i18n support (English & Chinese) and dark/light theming.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Setup & Usage](#project-setup--usage)
- [Feature List](#feature-list)

---

## Architecture Overview

```
seeshore/
├── app/                              # Next.js App Router (pages & API routes)
│   ├── layout.tsx                    # Root layout — Sidebar, NextIntl provider, font loading
│   ├── page.tsx                      # Welcome/landing page with role-based auto-redirect
│   ├── globals.css                   # Global Tailwind styles and CSS variables
│   │
│   ├── api/                          # Server-side API routes
│   │   ├── login/route.ts            # Auth endpoints: login, register, create_owner, check_user
│   │   ├── books/
│   │   │   ├── route.ts              # GET (list) / POST (register) books
│   │   │   └── [id]/route.ts         # GET / PUT / DELETE a single book
│   │   ├── store/route.ts            # GET / POST / PUT store info
│   │   ├── events/
│   │   │   ├── route.ts              # GET (list) / POST (create) / PUT (edit) events
│   │   │   └── attend/route.ts       # POST attend/leave an event
│   │   ├── users/
│   │   │   ├── route.ts              # GET user(s) by ID
│   │   │   └── display/route.ts      # GET / PUT display-page config
│   │   ├── members/route.ts          # GET store members with optional search
│   │   ├── invite-codes/
│   │   │   ├── route.ts              # GET (list) / POST (generate) invite codes
│   │   │   └── [id]/route.ts         # DELETE (revoke) an invite code
│   │   └── collaborate/
│   │       ├── posts/
│   │       │   ├── route.ts          # GET / POST collaborate posts
│   │       │   └── [id]/route.ts     # GET / PUT / DELETE a single post
│   │       └── replies/
│   │           ├── route.ts          # GET / POST replies on a post
│   │           └── [id]/route.ts     # PUT / DELETE a single reply
│   │
│   ├── manage/                       # Staff dashboard (Owner)
│   │   ├── layout.tsx                # BottomNav wrapper for management pages
│   │   ├── page.tsx                  # Dashboard home — store overview
│   │   ├── bookstore/page.tsx        # Edit store name, banner, description, rules
│   │   ├── events/
│   │   │   ├── page.tsx              # List & manage all events
│   │   │   ├── create/page.tsx       # Create a new event with preview
│   │   │   └── [id]/edit/page.tsx    # Edit an existing event
│   │   ├── items/page.tsx            # View & manage registered books
│   │   ├── featured/page.tsx         # Curate "This Week's Books" (owner only)
│   │   └── invitation-codes/page.tsx # Generate, copy, and revoke invite codes
│   │
│   ├── items/                        # Public book browsing
│   │   ├── page.tsx                  # Browse books with search & category filters
│   │   └── [id]/page.tsx             # Book detail — description, favorite, borrow status
│   │
│   ├── events/                       # Public event browsing
│   │   ├── page.tsx                  # Browse events with search & featured "closest event"
│   │   └── [id]/page.tsx             # Event detail — slide-to-attend, attendee list
│   │
│   ├── profile/                      # Authenticated user profile
│   │   ├── page.tsx                  # Profile — avatar, name, location; tabs for events/books/favorites
│   │   └── display/page.tsx          # Configure public display page (bio, selected items)
│   │
│   ├── collaborate/                  # Community forum
│   │   ├── page.tsx                  # Browse & search posts
│   │   └── [id]/page.tsx             # Post detail with replies
│   │
│   └── members/[id]/page.tsx         # Public member profile page
│
├── components/                       # Reusable React components
│   ├── ui/                           # Shared primitives (Button, Drawer, Sheet, Carousel, etc.)
│   │   ├── button.tsx                # CVA-powered button with variants
│   │   ├── carousel.tsx              # Embla-based image carousel
│   │   ├── drawer.tsx                # Vaul bottom-drawer
│   │   ├── empty-state.tsx           # Placeholder for empty lists
│   │   ├── form-input.tsx            # Styled form input with label
│   │   ├── image-upload.tsx          # Image upload with Supabase Storage
│   │   ├── language-switcher.tsx     # EN/ZH locale toggle
│   │   ├── loading-spinner.tsx       # Loading indicator
│   │   ├── page-header.tsx           # Page title with back button
│   │   ├── rich-text-editor.tsx      # TipTap rich-text editor
│   │   ├── search-input.tsx          # Debounced search input
│   │   ├── sheet.tsx                 # Radix side-sheet
│   │   ├── tab-switcher.tsx          # Segmented tab control
│   │   └── theme-toggle.tsx          # Dark/light mode switch
│   ├── welcome/                      # Welcome page components
│   │   ├── MobileWelcome.tsx         # Mobile welcome layout & login flow
│   │   ├── DesktopWelcome.tsx        # Desktop welcome layout & login flow
│   │   ├── RoleCard.tsx              # Owner / Member role selection card
│   │   ├── RoleSelector.tsx          # Role selection step
│   │   ├── RoleSlideUp.tsx           # Animated slide-up for role actions
│   │   ├── StepsBanner.tsx           # 3-step onboarding instructions
│   │   ├── WelcomeHero.tsx           # Hero section with imagery
│   │   ├── Logo.tsx                  # App logo
│   │   └── Footer.tsx               # Welcome page footer
│   ├── navigation/                   # App navigation
│   │   ├── Sidebar.tsx               # Desktop sidebar with role-based links
│   │   └── BottomNav.tsx             # Mobile bottom tab bar for staff dashboard
│   ├── books/                        # Book-related components
│   │   ├── BookCard.tsx              # Book card with cover, title, status badge
│   │   └── BookDetailsPanel.tsx      # Full book detail panel with actions
│   ├── events/                       # Event-related components
│   │   ├── EventCard.tsx             # Event card with cover, date, status
│   │   ├── EventForm.tsx             # Create/edit event form
│   │   └── EventPreviewEditor.tsx    # Live event preview during editing
│   ├── collaborate/                  # Collaborate feature components
│   │   ├── PostCard.tsx              # Forum post card
│   │   └── CreatePostDrawer.tsx      # Drawer for creating a new post
│   └── manage/                       # Staff management components
│       ├── BorrowDrawer.tsx          # Drawer to process book borrow/return
│       └── ItemRegistrationDrawer.tsx# Drawer to register a new book
│
├── data/
│   └── supabase.ts                   # Supabase client initialization & all data-access functions
│
├── database/
│   └── schema.sql                    # Main database schema (tables, indexes, RLS, functions)
│
├── sql/
│   └── collaborate_tables.sql        # Collaborate feature tables, indexes, RLS
│
├── lib/                              # Utilities
│   ├── utils.ts                      # cn() class-name merge helper
│   ├── session.ts                    # 7-day localStorage session manager
│   ├── date-utils.ts                 # Date formatting & GMT+8 deadline checks
│   └── theme.ts                      # Theme persistence helpers
│
├── hooks/
│   └── use-is-desktop.ts             # Media-query hook for responsive layout switching
│
├── i18n/                             # Internationalization config
│   ├── config.ts                     # Supported locales (en, zh)
│   ├── request.ts                    # Server-side locale resolver
│   └── actions.ts                    # setLocale server action
│
├── messages/                         # Translation files
│   ├── en.json                       # English translations
│   └── zh.json                       # Chinese translations
│
├── types/
│   └── type.ts                       # TypeScript interfaces (Store, User, Book, Event, Post, etc.)
│
├── public/                           # Static assets
│   ├── manifest.json                 # PWA manifest
│   ├── welcome-pic-1/2/3.png        # Welcome page hero images
│   └── *.svg                         # Icons
│
├── package.json                      # Dependencies & scripts
├── next.config.ts                    # Next.js config (next-intl, remote image domains)
├── tsconfig.json                     # TypeScript config
├── postcss.config.mjs                # PostCSS (Tailwind)
├── components.json                   # shadcn/ui config (new-york style)
└── eslint.config.mjs                 # ESLint config
```

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| UI Library | React 19, Tailwind CSS 4, shadcn/ui (new-york) |
| Component Primitives | Radix UI, Vaul (drawer), Embla Carousel |
| Rich Text | TipTap |
| Database | Supabase (PostgreSQL) with Row-Level Security |
| Auth | Supabase Auth (email/password) |
| Storage | Supabase Storage (`images` bucket) |
| i18n | next-intl (English, Chinese) |
| Avatars | DiceBear API (generated avatars) |
| Fonts | Geist, Geist Mono, Newsreader, LXGW WenKai |

### User Roles & Permissions

| Role | Description | Access |
|---|---|---|
| **Owner** | Bookstore owner; full management access | All features: manage store, books, events, invite codes, featured books, collaborate |
| **Member** | Registered via invite code | Browse books, attend events, collaborate, profile, favorites, borrowing |

### Data Flow

1. **Authentication** — Supabase Auth handles email/password sign-up/sign-in. The API route (`/api/login`) uses the service-role key for admin operations (creating owners, auto-confirming emails).
2. **Session** — After login, session data (`accessToken`, `userId`, `userRole`, `storeId`) is persisted in `localStorage` with a 7-day TTL via `lib/session.ts`.
3. **API Layer** — Next.js API routes act as a thin server layer. They pass the user's `accessToken` to Supabase so that RLS policies enforce per-user permissions.
4. **Data Access** — All database queries go through `data/supabase.ts`, which creates authenticated Supabase clients and maps database rows to TypeScript interfaces.

---

## Project Setup & Usage

### Prerequisites

- Node.js 18+
- npm (or yarn / pnpm / bun)
- A Supabase project ([create one free](https://supabase.com/dashboard))

### 1. Clone & Install

```bash
git clone <repo-url>
cd seeshore
npm install
```

### 2. Set Up Supabase

#### 2a. Create Tables

1. Go to your Supabase project dashboard → **SQL Editor**.
2. Paste the contents of `database/schema.sql` and run it. This creates all core tables, indexes, RLS policies, functions, and triggers.
3. Paste the contents of `sql/collaborate_tables.sql` and run it. This adds the collaborate (forum) tables.

#### 2b. Add `featured_books` Column

Run this in the SQL Editor (the column is referenced by the app but not in the base schema file):

```sql
ALTER TABLE stores ADD COLUMN IF NOT EXISTS featured_books TEXT[] DEFAULT '{}';
```

#### 2c. Add Book Fields

Run this in the SQL Editor to add fields used by the app:

```sql
ALTER TABLE books ADD COLUMN IF NOT EXISTS isbn TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('available', 'borrowed')) DEFAULT 'available';
ALTER TABLE books ADD COLUMN IF NOT EXISTS borrowed_date TIMESTAMPTZ;
ALTER TABLE books ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
```

#### 2d. Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard.
2. Create a new bucket named `images`.
3. Set the bucket to **Public** (so uploaded images are accessible via URL).
4. Under bucket policies, add a policy allowing authenticated users to upload.

#### 2e. Enable Email Auth

1. Go to **Authentication** → **Providers**.
2. Ensure **Email** provider is enabled.
3. Optionally disable "Confirm email" to simplify testing (or leave it on — the `create_owner` API auto-confirms via the admin API).

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find these values in your Supabase dashboard → **Settings** → **API**.

### 4. Update Remote Image Domains

In `next.config.ts`, update the Supabase hostname to match your project:

```typescript
{
  protocol: "https",
  hostname: "your-project-ref.supabase.co",  // replace with your project ref
  pathname: "/storage/v1/object/public/**",
},
```

### 5. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the welcome page.

### 6. Creating Test Accounts

#### Create an Owner Account

1. Open the welcome page at `http://localhost:3000`.
2. Select the **"I'm a store owner"** role.
3. Fill in your name, email, and password, then submit.
4. You'll be prompted to **create a new store** — enter a store name and optionally a description/rules.
5. After store creation, you'll be redirected to the `/manage` dashboard. Your role is now **Owner**.

Alternatively, you can call the API directly:

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"action":"create_owner","email":"owner@test.com","password":"password123","name":"Test Owner"}'
```

Then log in via the welcome page with those credentials. You will still need to create a store through the UI.

#### Create a Member Account

1. **First, generate an invite code** as the Owner:
   - Log in as the Owner.
   - Navigate to **Manage** → **Invitation Codes** (via sidebar or bottom nav).
   - Click **Generate Code** to create a new invite code.
   - Copy the generated code.
2. **Then, register as a Member:**
   - Open the welcome page in a different browser or incognito window.
   - Select **"I'm a member"**.
   - Choose the store from the list (stores are visible to all).
   - Paste the invite code, fill in name/email/password, and submit.
   - You'll be redirected to `/items` as a **Member**.

#### Quick Role Reference

| To test as... | Do this |
|---|---|
| **Owner** | Register via "I'm a store owner" → create a store |
| **Member** | Get an invite code from an Owner → register via "I'm a member" |

---

## Feature List

| # | Feature | Key Files | How to Test |
|---|---|---|---|
| **Welcome & Onboarding** | | | |
| 1 | **Responsive Welcome Page** — Mobile and desktop layouts with hero images, role selection, and animated transitions | `app/page.tsx`, `components/welcome/MobileWelcome.tsx`, `components/welcome/DesktopWelcome.tsx`, `components/welcome/WelcomeHero.tsx` | 1. Open `http://localhost:3000` on a desktop browser. 2. Resize the window below 1024px to see the mobile layout. 3. Resize back above 1024px for the desktop layout. |
| 2 | **Role Selection** — Choose between "I'm a store owner" and "I'm a member" with distinct registration flows | `components/welcome/RoleSelector.tsx`, `components/welcome/RoleCard.tsx`, `components/welcome/RoleSlideUp.tsx` | 1. On the welcome page, click "I'm a store owner" to see the owner registration form. 2. Click "I'm a member" to see the member flow with invite code input. |
| 3 | **Owner Registration & Store Creation** — Register as owner, then create a new store with name/description/rules | `app/api/login/route.ts` (action: `create_owner`), `components/welcome/MobileWelcome.tsx`, `data/supabase.ts` (`createStore`) | 1. Select "I'm a store owner". 2. Fill in name, email, password → submit. 3. Enter store name and optional details → create store. 4. Verify redirect to `/manage`. |
| 4 | **Member Registration with Invite Code** — Validate invite code, register, and auto-join the store | `data/supabase.ts` (`registerWithInviteCode`, `validateInviteCode`, `consumeInviteCode`), `components/welcome/MobileWelcome.tsx` | 1. As Owner, generate an invite code (see feature #18). 2. In incognito, select "I'm a member" → choose store → paste invite code → fill in details → submit. 3. Verify redirect to `/items`. |
| 5 | **Login** — Returning users log in with email/password; session persists for 7 days | `app/api/login/route.ts` (action: `login`), `data/supabase.ts` (`loginWithEmail`), `lib/session.ts` | 1. On the welcome page, click the login tab (if available) or select your role. 2. Enter existing email/password → submit. 3. Close the browser, reopen — verify you're still logged in. |
| **Books** | | | |
| 6 | **Browse Books** — Search by title and filter by category; responsive grid layout | `app/items/page.tsx`, `components/books/BookCard.tsx`, `components/ui/search-input.tsx` | 1. Log in as a Member or Owner. 2. Navigate to **Items** via the sidebar. 3. Type a search query in the search bar. 4. Click category tags to filter. |
| 7 | **Book Details** — View cover, description, author, categories, location, borrow status, and like count | `app/items/[id]/page.tsx`, `components/books/BookDetailsPanel.tsx` | 1. From the items list, click on any book card. 2. View the full detail page with all book information. |
| 8 | **Favorite / Unfavorite Books** — Toggle a book as a favorite; increments/decrements like count | `data/supabase.ts` (`addBookToFavorites`, `removeBookFromFavorites`, `increment_book_likes`, `decrement_book_likes`) | 1. Open a book detail page as a Member. 2. Click the heart/favorite button. 3. Verify the like count increases. 4. Click again to unfavorite; verify count decreases. |
| 9 | **Featured "This Week's Books"** — Owner curates up to 10 featured books displayed in a carousel | `app/manage/featured/page.tsx`, `app/items/page.tsx`, `components/ui/carousel.tsx`, `data/supabase.ts` (`updateStore` with `featuredBooks`) | 1. Log in as Owner → navigate to **Manage** → **Featured**. 2. Select books to feature (up to 10) → save. 3. As a Member, go to **Items** → verify the featured carousel at the top. |
| 10 | **Register a Book** (Staff) — Add a new book with title, ISBN, author, cover image, categories, and location | `app/manage/items/page.tsx`, `components/manage/ItemRegistrationDrawer.tsx`, `data/supabase.ts` (`registerBook`) | 1. Log in as Owner → navigate to **Manage** → **Items**. 2. Click the "+" or "Register" button. 3. Fill in book details, upload a cover image → submit. 4. Verify the book appears in the list. |
| 11 | **Edit / Delete a Book** (Staff) — Modify book details or remove a book entirely | `app/api/books/[id]/route.ts`, `data/supabase.ts` (`updateBook`, `deregisterBook`) | 1. As Owner, go to **Manage** → **Items**. 2. Click on a book → edit details → save. 3. Or click delete → confirm → verify removal. |
| 12 | **Borrow / Return a Book** (Staff) — Staff processes borrow and return for members; 30-day borrowing period with countdown | `components/manage/BorrowDrawer.tsx`, `data/supabase.ts` (`borrowBook`, `returnBook`) | 1. As Owner, go to **Manage** → **Items**. 2. Click on an available book → "Borrow" → select a member → confirm. 3. Verify the book shows as "Borrowed" with a countdown. 4. Click "Return" on a borrowed book → confirm → verify it's available again. |
| **Events** | | | |
| 13 | **Browse Events** — View all events with search; featured "closest upcoming event" at top | `app/events/page.tsx`, `components/events/EventCard.tsx` | 1. Log in as any role. 2. Navigate to **Events** via sidebar. 3. See the closest upcoming event highlighted. 4. Use the search bar to filter events. |
| 14 | **Event Details & Slide-to-Attend** — View event info (cover, dates, hosts, attendees); swipe to attend | `app/events/[id]/page.tsx`, `data/supabase.ts` (`attendEvent`, `leaveEvent`) | 1. Click on an event card to open the detail page. 2. Use the slide-to-attend control to register attendance. 3. View the attendees list — click an attendee to see their member profile. |
| 15 | **Create an Event** (Staff) — Form with title, cover image, dates, description, location, and host selection; live preview | `app/manage/events/create/page.tsx`, `components/events/EventForm.tsx`, `components/events/EventPreviewEditor.tsx` | 1. As Owner, go to **Manage** → **Events** → **Create**. 2. Fill in all fields, upload a cover image. 3. Preview the event on the right pane. 4. Submit → verify it appears in the events list. |
| 16 | **Edit / Delete an Event** (Staff) — Modify event details or remove an event; update status (open/cancelled/etc.) | `app/manage/events/[id]/edit/page.tsx`, `app/manage/events/page.tsx`, `data/supabase.ts` (`editEvent`, `deleteEvent`) | 1. As Owner, go to **Manage** → **Events**. 2. Click edit on an event → modify fields → save. 3. Or change the status to cancelled/finished. 4. Delete an event → confirm. |
| 17 | **Auto-finish Past Events** — Events with end dates past the deadline (GMT+8) are auto-marked as "finished" | `data/supabase.ts` (`fetchEvents`, `fetchEvent`), `lib/date-utils.ts` (`isEventPastDeadline`) | 1. Create an event with an end date in the past. 2. Browse the events list → verify the event shows as "finished". |
| **Invitation Codes** | | | |
| 18 | **Generate Invite Codes** (Owner) — Create one-time-use codes for member registration | `app/manage/invitation-codes/page.tsx`, `app/api/invite-codes/route.ts` | 1. As Owner, go to **Manage** → **Invitation Codes**. 2. Click **Generate Code**. 3. See the new code appear in the list. |
| 19 | **Copy Invite Code** — One-click copy to clipboard | `app/manage/invitation-codes/page.tsx` | 1. On the invite codes page, click the copy icon next to a code. 2. Paste somewhere to verify. |
| 20 | **Revoke Invite Code** (Owner) — Delete unused invite codes | `app/api/invite-codes/[id]/route.ts` | 1. On the invite codes page, click delete on an unused code → confirm. 2. Verify it disappears from the list. |
| **Store Management** | | | |
| 21 | **Edit Store Info** — Update store name, banner image, description, and rules | `app/manage/bookstore/page.tsx`, `data/supabase.ts` (`updateStore`) | 1. As Owner, go to **Manage** → **Bookstore**. 2. Edit the name, upload a new banner, modify description/rules → save. 3. Verify changes reflect on the public-facing pages. |
| 22 | **Dashboard Overview** — Staff landing page showing store stats | `app/manage/page.tsx` | 1. Log in as Owner. 2. You land on the **Manage** dashboard. 3. View store overview information. |
| **Collaborate (Forum)** | | | |
| 23 | **Browse Posts** — View community posts with search | `app/collaborate/page.tsx`, `components/collaborate/PostCard.tsx` | 1. Navigate to **Collaborate** via sidebar. 2. Browse the list of posts. 3. Use search to filter by title. |
| 24 | **Create a Post** — Create a post with title, description, and optional photos | `components/collaborate/CreatePostDrawer.tsx`, `data/supabase.ts` (`createCollaboratePost`) | 1. On the collaborate page, click the "+" button to open the create drawer. 2. Enter a title, description, and optionally upload photos. 3. Submit → verify the post appears in the list. |
| 25 | **Post Detail & Replies** — View post with all replies; add or delete replies | `app/collaborate/[id]/page.tsx`, `data/supabase.ts` (`fetchCollaborateReplies`, `createCollaborateReply`, `deleteCollaborateReply`) | 1. Click on a post card to open its detail page. 2. Read existing replies. 3. Type a reply in the input → submit. 4. Delete your own reply by clicking the delete button. |
| 26 | **Delete Own Post** — Authors can delete their own posts (cascade-deletes replies) | `data/supabase.ts` (`deleteCollaboratePost`) | 1. On a post you authored, click the delete button. 2. Confirm → verify the post and its replies are removed. |
| **Profile** | | | |
| 27 | **View & Edit Profile** — Edit name, avatar (upload or DiceBear), and location | `app/profile/page.tsx`, `data/supabase.ts` (`updateUserProfile`, `uploadImage`) | 1. Navigate to **Profile** via sidebar. 2. Click the edit icon. 3. Change your name, upload a new avatar, update location → save. |
| 28 | **Profile Tabs** — "My Events", "Borrowed", and "Favorites" tabs showing user's activity | `app/profile/page.tsx` | 1. On your profile page, switch between tabs. 2. "My Events" shows events you've attended. 3. "Borrowed" shows currently borrowed books. 4. "Favorites" shows your favorited books. |
| 29 | **Display Page Configuration** — Enable/disable a public display page; set a bio and select which events/books/favorites to showcase | `app/profile/display/page.tsx`, `data/supabase.ts` (`updateDisplayConfig`) | 1. Go to **Profile** → **Display**. 2. Toggle the display page on. 3. Write a bio, select events and books to display → save. |
| 30 | **Public Member Profile** — Accessible at `/members/[id]`; shows display-page content if enabled | `app/members/[id]/page.tsx`, `data/supabase.ts` (`fetchUserDisplayConfig`) | 1. Get a member's profile link (shown on event attendee lists, etc.). 2. Open `/members/<user-id>` in a browser. 3. If their display page is enabled, see their bio, selected events, and books. |
| **Navigation & UI** | | | |
| 31 | **Responsive Sidebar (Desktop)** — Role-based navigation links; visible on screens ≥ 1024px | `components/navigation/Sidebar.tsx`, `app/layout.tsx` | 1. Open the app in a desktop browser (≥ 1024px wide). 2. See the sidebar with links based on your role (Owner sees "Manage", Member sees "Profile", etc.). |
| 32 | **Bottom Nav (Mobile)** — Tab bar for staff management pages on mobile | `components/navigation/BottomNav.tsx`, `app/manage/layout.tsx` | 1. Open the app in mobile view (< 1024px). 2. As Owner, navigate to any `/manage` page. 3. See the bottom tab bar for switching between management sections. |
| 33 | **Dark / Light Theme** — Toggle between dark and light modes; persisted across sessions | `components/ui/theme-toggle.tsx`, `lib/theme.ts` | 1. Click the theme toggle in the sidebar or navigation. 2. Verify the UI switches between dark and light. 3. Refresh the page — verify the theme persists. |
| 34 | **Internationalization (i18n)** — Switch between English and Chinese; all UI strings are translated | `components/ui/language-switcher.tsx`, `i18n/config.ts`, `messages/en.json`, `messages/zh.json` | 1. Click the language switcher (EN/ZH). 2. Verify all UI text changes to the selected language. 3. Navigate between pages — verify translations persist. |
| 35 | **Image Upload** — Upload images to Supabase Storage for avatars, book covers, event covers, and post photos | `components/ui/image-upload.tsx`, `data/supabase.ts` (`uploadImage`) | 1. In any form with an image field (event creation, book registration, profile), click the upload area. 2. Select an image file. 3. Verify it uploads and displays correctly. |
| 36 | **PWA Support** — Web app manifest for add-to-home-screen on mobile devices | `public/manifest.json` | 1. Open the app on a mobile device. 2. Use "Add to Home Screen" in the browser menu. 3. Open from the home screen — verify it launches like a native app. |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create an optimized production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
