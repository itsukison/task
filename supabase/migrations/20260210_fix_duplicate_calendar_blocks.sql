-- Fix orphaned and duplicate calendar blocks issue
-- This migration:
-- 1. Cleans up orphaned blocks (blocks whose tasks are soft-deleted)
-- 2. Cleans up duplicate blocks (same task+owner, multiple block IDs)
-- 3. Adds unique constraint to prevent future duplicates

-- Step 1: Delete orphaned blocks (blocks pointing to soft-deleted tasks)
-- These are blocks that remain in the database after their task was soft-deleted
-- They cause "phantom overlaps" where a single visible block displays at half-width
DELETE FROM calendar_blocks cb
WHERE EXISTS (
    SELECT 1
    FROM tasks t
    WHERE t.id = cb.task_id
    AND t.deleted_at IS NOT NULL
);

-- Step 2: Remove duplicate blocks (keep the most recent one by created_at)
-- This finds all (task_id, owner_id) combinations with more than 1 block
-- and deletes all but the most recent block
WITH duplicates AS (
    SELECT
        task_id,
        owner_id,
        MAX(created_at) as latest_created_at
    FROM calendar_blocks
    GROUP BY task_id, owner_id
    HAVING COUNT(*) > 1
)
DELETE FROM calendar_blocks cb
WHERE EXISTS (
    SELECT 1
    FROM duplicates d
    WHERE cb.task_id = d.task_id
    AND cb.owner_id = d.owner_id
    AND cb.created_at < d.latest_created_at
);

-- Step 3: Add unique constraint to prevent future duplicates
-- This ensures only one calendar block per task per owner
ALTER TABLE calendar_blocks
ADD CONSTRAINT calendar_blocks_task_owner_unique
UNIQUE (task_id, owner_id);
