-- Add Editorial Workflow & Assignment Columns to Articles

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'idea',
  ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES authors(id),
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES authors(id),
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_articles_workflow_status ON articles(workflow_status);
CREATE INDEX IF NOT EXISTS idx_articles_assignee_id ON articles(assignee_id);
CREATE INDEX IF NOT EXISTS idx_articles_due_date ON articles(due_date);

-- Update existing articles to have a workflow status mapped from the basic 'status'
UPDATE articles SET workflow_status = 'published' WHERE status = 'published' AND workflow_status = 'idea';
UPDATE articles SET workflow_status = 'draft' WHERE status = 'draft' AND workflow_status = 'idea';
UPDATE articles SET workflow_status = 'archived' WHERE status = 'archived' AND workflow_status = 'idea';
