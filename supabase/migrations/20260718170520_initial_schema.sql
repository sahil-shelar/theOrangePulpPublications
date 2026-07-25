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
