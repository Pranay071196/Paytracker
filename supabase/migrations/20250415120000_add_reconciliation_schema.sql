-- Migration: Add reconciliation schema
-- Description: Creates import_batches, import_transactions tables, extends
-- collection_participants with reconciliation columns, adds indexes and RLS
-- policies for the bank statement reconciliation workflow.
--
-- Migration order (enforced):
--   1. import_batches (CREATE TABLE, no FK deps)
--   2. import_transactions (CREATE TABLE, FK → import_batches)
--   3. collection_participants (ALTER TABLE ADD COLUMNs + ADD CHECK)
--   4. indexes on import_transactions
--   5. RLS policies
--
-- Dependencies: existing profiles, collections, collection_participants tables.
--
-- Key design decisions:
--   - TEXT + CHECK constraints (no PG enums) — matches existing pattern
--   - 'paid' included in status CHECK — PR #3's markAsPaid sets this value
--   - All new columns nullable — avoids breaking existing rows
--   - auth.uid() maps to profiles.auth_user_id, not profiles.id
--     (verified in supabaseHelpers.js createOrFetchProfile)
--     RLS policies join through profiles to bridge this gap

-- ============================================================
-- 1. import_batches — CREATE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.import_batches (
    id BIGSERIAL PRIMARY KEY,
    organiser_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    filename TEXT,
    row_count INT DEFAULT 0,
    matched_count INT DEFAULT 0,
    settled_count INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'partially_settled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. import_transactions — CREATE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.import_transactions (
    id BIGSERIAL PRIMARY KEY,
    import_batch_id BIGINT REFERENCES public.import_batches(id) ON DELETE CASCADE,
    raw_date TEXT,
    raw_description TEXT,
    raw_amount TEXT,
    raw_utr TEXT,
    parsed_date DATE,
    parsed_amount NUMERIC,
    parsed_utr TEXT,
    matched_participant_id UUID REFERENCES public.collection_participants(id) ON DELETE SET NULL,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    status TEXT NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched', 'matched', 'confirmed', 'skipped', 'settled')),
    settled_at TIMESTAMPTZ
);

-- ============================================================
-- 3. collection_participants — ALTER TABLE
-- ============================================================

-- 3a. Pre-migration data cleanup: normalise any existing status values
-- that fall outside the new CHECK constraint to 'pending'.
-- This is a defensive measure per PRD §6 (existing data risk).
UPDATE public.collection_participants
SET status = 'pending'
WHERE status IS NULL OR status NOT IN ('pending', 'paid', 'matched', 'settled');

-- 3b. Add reconciliation columns (all nullable — no NOT NULL, no DEFAULT)
ALTER TABLE public.collection_participants
ADD COLUMN IF NOT EXISTS utr TEXT;

ALTER TABLE public.collection_participants
ADD COLUMN IF NOT EXISTS settled_at TIMESTAMPTZ;

ALTER TABLE public.collection_participants
ADD COLUMN IF NOT EXISTS settled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.collection_participants
ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ;

ALTER TABLE public.collection_participants
ADD COLUMN IF NOT EXISTS import_transaction_id BIGINT REFERENCES public.import_transactions(id) ON DELETE SET NULL;

-- 3c. Add status CHECK constraint
-- Safe after §3a cleanup. DROP + ADD pattern ensures idempotency.
ALTER TABLE public.collection_participants
DROP CONSTRAINT IF EXISTS collection_participants_status_check;

ALTER TABLE public.collection_participants
ADD CONSTRAINT collection_participants_status_check
CHECK (status IN ('pending', 'paid', 'matched', 'settled'));

-- ============================================================
-- 4. Indexes on import_transactions
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_import_transactions_batch_id
ON public.import_transactions(import_batch_id);

CREATE INDEX IF NOT EXISTS idx_import_transactions_parsed_utr
ON public.import_transactions(parsed_utr);

CREATE INDEX IF NOT EXISTS idx_import_transactions_matched_participant_id
ON public.import_transactions(matched_participant_id);

-- ============================================================
-- 5. RLS Policies
-- ============================================================
--
-- NOTE: auth.uid() returns the Supabase Auth UUID (auth.users.id), but
-- all profile FK columns (organiser_profile_id, participant_profile_id,
-- settled_by) reference profiles.id which is a separate UUID. The bridge
-- is profiles.auth_user_id which stores the Auth UUID.
-- Verified in: src/lib/supabaseHelpers.js L49-L55 (createOrFetchProfile).
-- All policies below join through profiles to resolve this mismatch.

-- 5a. import_batches: RLS
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY import_batches_select ON public.import_batches
    FOR SELECT
    USING (
        organiser_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY import_batches_insert ON public.import_batches
    FOR INSERT
    WITH CHECK (
        organiser_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY import_batches_update ON public.import_batches
    FOR UPDATE
    USING (
        organiser_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    )
    WITH CHECK (
        organiser_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

CREATE POLICY import_batches_delete ON public.import_batches
    FOR DELETE
    USING (
        organiser_profile_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid())
    );

-- 5b. import_transactions: RLS
ALTER TABLE public.import_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY import_transactions_select ON public.import_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.import_batches
            WHERE id = import_transactions.import_batch_id
            AND organiser_profile_id IN (
                SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY import_transactions_insert ON public.import_transactions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.import_batches
            WHERE id = import_transactions.import_batch_id
            AND organiser_profile_id IN (
                SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY import_transactions_update ON public.import_transactions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.import_batches
            WHERE id = import_transactions.import_batch_id
            AND organiser_profile_id IN (
                SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.import_batches
            WHERE id = import_transactions.import_batch_id
            AND organiser_profile_id IN (
                SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY import_transactions_delete ON public.import_transactions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.import_batches
            WHERE id = import_transactions.import_batch_id
            AND organiser_profile_id IN (
                SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

-- 5c. collection_participants: RLS
-- WARNING: ENABLE RLS on collection_participants will affect existing
-- queries (AppContext.js L28). The policies below cover the two legitimate
-- access patterns (organiser SELECT/UPDATE via collection ownership,
-- participant SELECT via their own profile).
ALTER TABLE public.collection_participants ENABLE ROW LEVEL SECURITY;

-- Organiser SELECT: allows organisers to see participants of their collections
CREATE POLICY collection_participants_organiser_select ON public.collection_participants
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE id = collection_participants.collection_id
            AND organiser_profile_id IN (
                SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Organiser UPDATE: allows organisers to update participant records
-- (e.g. mark as settled, set UTR, match to imported transactions)
CREATE POLICY collection_participants_organiser_update ON public.collection_participants
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE id = collection_participants.collection_id
            AND organiser_profile_id IN (
                SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.collections
            WHERE id = collection_participants.collection_id
            AND organiser_profile_id IN (
                SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Participant SELECT: allows a participant to see their own participant rows
-- (used by fetchParticipantCollections in supabaseHelpers.js)
CREATE POLICY collection_participants_participant_select ON public.collection_participants
    FOR SELECT
    USING (
        participant_profile_id IN (
            SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
    );
