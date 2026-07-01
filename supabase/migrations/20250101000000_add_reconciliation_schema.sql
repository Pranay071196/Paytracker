-- Adds columns for UTR tracking and creates reconciliation tables
-- Idempotent: uses IF NOT EXISTS / DO $$ blocks

-- Add utr column to collection_participants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collection_participants' AND column_name = 'utr'
  ) THEN
    ALTER TABLE collection_participants ADD COLUMN utr text;
  END IF;
END $$;

-- Add paid_at column to collection_participants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collection_participants' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE collection_participants ADD COLUMN paid_at timestamptz;
  END IF;
END $$;

-- Add raw_note column to collection_participants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'collection_participants' AND column_name = 'raw_note'
  ) THEN
    ALTER TABLE collection_participants ADD COLUMN raw_note text;
  END IF;
END $$;

-- Create reconciliation_transactions table
CREATE TABLE IF NOT EXISTS reconciliation_transactions (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  collection_id bigint NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  transaction_date date NOT NULL,
  description text,
  amount numeric(12,2) NOT NULL,
  utr text,
  sender_name text,
  sender_account text,
  raw_line text,
  created_at timestamptz DEFAULT now()
);

-- Create reconciliation_matches table
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  transaction_id bigint NOT NULL REFERENCES reconciliation_transactions(id) ON DELETE CASCADE,
  participant_id bigint NOT NULL REFERENCES collection_participants(id) ON DELETE CASCADE,
  confidence decimal(5,2) NOT NULL DEFAULT 0,
  matched_by text NOT NULL DEFAULT 'auto',
  status text NOT NULL DEFAULT 'pending',
  matched_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reconciliation_transactions_collection
  ON reconciliation_transactions(collection_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_transaction
  ON reconciliation_matches(transaction_id);

CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_participant
  ON reconciliation_matches(participant_id);
