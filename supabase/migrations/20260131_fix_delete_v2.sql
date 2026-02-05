-- ============================================================================
-- FIX v2: Properly allow soft delete by removing WITH CHECK restrictions
-- ============================================================================

-- Drop all existing UPDATE policies for documents
DROP POLICY IF EXISTS "Users can update own documents, leaders can update all" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents, leaders can delete all" ON documents;

-- Create a single UPDATE policy that allows both regular updates AND soft deletion
CREATE POLICY "Users can update own documents, leaders can update all"
  ON documents FOR UPDATE
  USING (
    -- Can update if user is creator or leader
    created_by = auth.uid()
    OR is_leader(organization_id, auth.uid())
  )
  WITH CHECK (
    -- Can update if user is creator or leader (no deleted_at restriction!)
    created_by = auth.uid()
    OR is_leader(organization_id, auth.uid())
  );

-- Drop all existing UPDATE policies for folders
DROP POLICY IF EXISTS "Users can update own folders, leaders can update all" ON folders;
DROP POLICY IF EXISTS "Users can delete own folders, leaders can delete all" ON folders;

-- Create a single UPDATE policy that allows both regular updates AND soft deletion
CREATE POLICY "Users can update own folders, leaders can update all"
  ON folders FOR UPDATE
  USING (
    -- Can update if user is creator or leader
    created_by = auth.uid()
    OR is_leader(organization_id, auth.uid())
  )
  WITH CHECK (
    -- Can update if user is creator or leader (no deleted_at restriction!)
    created_by = auth.uid()
    OR is_leader(organization_id, auth.uid())
  );
