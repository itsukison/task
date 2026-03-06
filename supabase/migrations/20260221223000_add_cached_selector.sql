-- Add cached_selector to workflow_steps table
ALTER TABLE workflow_steps ADD COLUMN cached_selector TEXT;
