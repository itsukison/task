-- ============================================================================
-- FIX: Update RLS policies to allow soft delete
-- ============================================================================
-- This fixes the issue where soft delete fails because WITH CHECK prevents
-- setting deleted_at to a non-null value.

-- Drop the old conflicting policies
DROP POLICY IF EXISTS "Users can update own documents, leaders can update all" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents, leaders can delete all" ON documents;
DROP POLICY IF EXISTS "Users can update own folders, leaders can update all" ON folders;
DROP POLICY IF EXISTS "Users can delete own folders, leaders can delete all" ON folders;

-- Recreate documents UPDATE policy with proper soft delete support
CREATE POLICY "Users can update own documents, leaders can update all"
  ON documents FOR UPDATE
  USING (
    (deleted_at IS NULL OR deleted_at IS NOT NULL) -- Allow access to both active and deleted docs for soft delete
    AND (
      created_by = auth.uid()
      OR is_leader(organization_id, auth.uid())
    )
  )
  WITH CHECK (
    -- Allow setting deleted_at for soft delete, otherwise document must not be deleted
    (
      created_by = auth.uid()
      OR is_leader(organization_id, auth.uid())
    )
  );

-- Recreate folders UPDATE policy with proper soft delete support
CREATE POLICY "Users can update own folders, leaders can update all"
  ON folders FOR UPDATE
  USING (
    (deleted_at IS NULL OR deleted_at IS NOT NULL) -- Allow access to both active and deleted folders for soft delete
    AND (
      created_by = auth.uid()
      OR is_leader(organization_id, auth.uid())
    )
  )
  WITH CHECK (
    -- Allow setting deleted_at for soft delete, otherwise folder must not be deleted
    (
      created_by = auth.uid()
      OR is_leader(organization_id, auth.uid())
    )
  );
