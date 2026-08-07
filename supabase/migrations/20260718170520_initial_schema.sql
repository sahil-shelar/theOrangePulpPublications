-- MISNAMED. This is NOT a second initial schema.
--
-- The real one is 20260718000000_initial_schema.sql, which creates the enums and
-- every base table. This file is a same-day follow-up: extra `movies` columns
-- and the `jobs` / `job_logs` tables. Reading the directory chronologically, two
-- files called "initial_schema" suggests a duplicate or a rewrite; it is neither.
--
-- The filename is deliberately left alone — it is already applied, and Supabase
-- keys migration history on it, so renaming would make this look unapplied and
-- re-run it.

-- Add missing columns to movies
ALTER TABLE movies 
  ADD COLUMN IF NOT EXISTS runtime INTEGER,
  ADD COLUMN IF NOT EXISTS genres JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cast_list JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS crew_list JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS streaming_platforms JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS box_office_gross BIGINT,
  ADD COLUMN IF NOT EXISTS imdb_id VARCHAR(50);

-- Create Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(255) NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'Pending',
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    scheduled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_at ON jobs(scheduled_at);
