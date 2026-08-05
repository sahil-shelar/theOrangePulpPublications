-- logJob() in src/lib/jobs/engine.ts writes to job_logs on every job
-- transition (start, completion, failure), and src/lib/jobs/types.ts declares a
-- matching JobLog interface — but the table was never created. Every one of
-- those writes was silently failing; the error was never surfaced because
-- logJob ignores the result and engine.ts had @ts-nocheck.

CREATE TABLE IF NOT EXISTS job_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  level      VARCHAR(20) NOT NULL DEFAULT 'info',  -- info | warning | error
  message    TEXT NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON job_logs(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_logs_level ON job_logs(level);

ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;

-- Operational data — authenticated staff only, matching the jobs table itself.
CREATE POLICY "Authenticated manage job_logs" ON job_logs
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
