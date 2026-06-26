# Supabase multi-user data model plan

## Goal

Make the app store collection data in Supabase so it is shared across logins and tied to the correct user:

- The organiser can create a collection. 
- The organiser can add other users as participants by phone number or email.
- When a participant later signs in, they see the expense/collection entries that were created for them.
- The data is no longer stored only in the local React context.

---

## What the current UI does today

The current app already has the right UI structure for this model:

- [src/CreateCollection.js](src/CreateCollection.js) collects:
  - collection title
  - category
  - target amount
  - a list of participant phone numbers
- [src/OrganiserDashboard.js](src/OrganiserDashboard.js) is the organiser view.
- [src/ParticipantDashboard.js](src/ParticipantDashboard.js) is the participant view.
- [src/AppContext.js](src/AppContext.js) currently keeps collections and the active user in local React state.

That means the app is ready conceptually, but the data needs to move from local memory into Supabase tables.

---

## Recommended data model

### 1) profiles
This table represents each signed-in person in the app.

Why it exists:
- Supabase auth gives you a user identity, but your app needs app-specific fields such as email, phone, role, and display name.
- This is the anchor table for all organiser and participant data.

Suggested columns:
- id: uuid, primary key
- auth_user_id: uuid, unique, nullable at first but should be filled after login
- full_name: text
- email: text, unique
- phone: text, unique
- role: text, values like organiser / participant
- created_at: timestamptz
- updated_at: timestamptz

### 2) collections
This table stores a collection created by an organiser.

Suggested columns:
- id: uuid, primary key
- organiser_profile_id: uuid, foreign key to profiles.id
- title: text
- category: text
- target_amount: numeric
- collection_date: date
- created_at: timestamptz
- updated_at: timestamptz

### 3) collection_participants
This is the most important table for your requirement.

It stores the fact that a specific user is part of a specific collection, and how much they owe or have paid.

Suggested columns:
- id: uuid, primary key
- collection_id: uuid, foreign key to collections.id
- participant_profile_id: uuid, foreign key to profiles.id
- participant_phone: text
- amount_due: numeric
- amount_paid: numeric default 0
- status: text default pending
- created_at: timestamptz
- updated_at: timestamptz

Why this works:
- The organiser creates a collection once.
- Each participant gets one record in this table.
- When the participant signs in, the app can fetch all rows where participant_profile_id = their profile id.
- This is the simplest way to make the participant dashboard show expense entries that belong to that person.

### 4) payments (optional but recommended)
If you later want to track payment events or reconcile payments, add this table.

Suggested columns:
- id: uuid, primary key
- collection_participant_id: uuid, foreign key to collection_participants.id
- amount: numeric
- payment_method: text
- notes: text
- paid_at: timestamptz

---

## How the data should flow in the app

### A. On login / auth success
When a user signs in using Supabase auth:

1. Read the auth user id and email.
2. Check if a profile already exists for that auth user.
3. If it does not exist, create one.
4. Store the phone number as well if it is provided during signup.
5. Save the role (organiser or participant) to the profile.

This means the app should no longer rely only on the temporary local user object from [src/AppContext.js](src/AppContext.js).

### B. When the organiser creates a collection
From [src/CreateCollection.js](src/CreateCollection.js):

1. Insert a row into collections.
2. For each participant phone entered in the UI:
   - look for a profile that matches that phone number
   - if not found, create a lightweight profile for that phone (for example, name = phone, role = participant)
   - insert a row into collection_participants for that profile
3. Split the amount across participants and store it in amount_due.

Example logic:
- If the collection amount is 1000 and there are 4 participants, each gets 250 as amount_due.
- The UI already calculates an approximate per-person amount, so the same logic can be used in the database layer.

### C. When the participant opens their dashboard
From [src/ParticipantDashboard.js](src/ParticipantDashboard.js):

1. Load the current logged-in profile.
2. Query collection_participants where participant_profile_id = current profile id.
3. Join that with collections to show the data on the participant screen.

This will make the participant see only the collections/expenses that were assigned to them.

---

## Important matching rule for participants

Because the organiser adds participants using phone numbers, you should implement a profile resolution rule:

- First try to match the participant using phone number.
- If a profile exists with the same phone, reuse it.
- If no profile exists, create a placeholder participant profile.
- Later, when that user signs in, update that profile with their real auth_user_id and email.

This is the best way to connect the organiser-created record to the real participant account later.

---

## Recommended implementation phases

### Phase 1: Database setup
Create the tables and indexes in Supabase.

### Phase 2: Profile creation on login
Create or update the profile row after auth.

### Phase 3: Replace local collection state
Remove the current local collection storage logic from [src/AppContext.js](src/AppContext.js) and replace it with Supabase fetches.

### Phase 4: Create collections from the organiser UI
When the organiser presses Create collection:
- insert collection
- insert participant rows
- navigate back to the organiser dashboard

### Phase 5: Load participant-specific data
Update [src/ParticipantDashboard.js](src/ParticipantDashboard.js) to fetch the participant’s assigned rows from Supabase.

### Phase 6: Optional payment tracking
Add payment/payment history later if you want reconciliation and paid/remaining breakdowns.

---

## Supabase SQL script to create the tables

Run this in the Supabase SQL editor.

```sql
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text,
  email text unique,
  phone text unique,
  role text not null default 'participant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  organiser_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  target_amount numeric not null default 0,
  collection_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_participants (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  participant_profile_id uuid not null references public.profiles(id) on delete cascade,
  participant_phone text not null,
  amount_due numeric not null default 0,
  amount_paid numeric not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(collection_id, participant_profile_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  collection_participant_id uuid not null references public.collection_participants(id) on delete cascade,
  amount numeric not null default 0,
  payment_method text,
  notes text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_auth_user_id on public.profiles(auth_user_id);
create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_collections_organiser_profile_id on public.collections(organiser_profile_id);
create index if not exists idx_collection_participants_collection_id on public.collection_participants(collection_id);
create index if not exists idx_collection_participants_profile_id on public.collection_participants(participant_profile_id);
create index if not exists idx_payments_collection_participant_id on public.payments(collection_participant_id);
```

---

## Optional RLS policies

If you want the data to be secure, enable Row Level Security and add policies.

Example policy ideas:

- Users can read and update only their own profile.
- Organisers can read and insert collections they own.
- Participants can read only their own collection_participants rows.
- Organisers can insert participant rows for their own collections.

---

## Recommended app-side helper functions

### 1) create or fetch profile
After auth, call a helper that:
- checks for an existing profile by auth_user_id
- creates one if missing
- updates the email and phone when available

### 2) create collection with participants
Use a single server-side function or a transaction-safe service layer to:
- insert the collection
- resolve/create each participant profile
- insert each collection_participant row

This prevents partial inserts if one participant insert fails.

---

## Summary

The cleanest implementation is:

- keep one profile per user
- keep one collection per organiser-created group
- keep one collection_participant row per user per collection
- use the participant_profile_id to show the correct data to each participant

That aligns well with the current UI and will make the participant dashboard work correctly once it reads from Supabase instead of the local React state.
