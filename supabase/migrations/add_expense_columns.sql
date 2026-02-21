-- Add expense-related columns to transactions table
-- Run this migration when Supabase project is active

-- Type column to distinguish setoran vs pengeluaran
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS type text DEFAULT 'setoran';

-- Category for expenses (Pembelian Hewan, Operasional, Lainnya)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category text;

-- Description for expense details
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description text;

-- Group ID for expenses (since expense is not tied to participant)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE CASCADE;

-- Make participant_id nullable (expenses don't have participant)
ALTER TABLE transactions ALTER COLUMN participant_id DROP NOT NULL;
