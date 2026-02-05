-- ============================================================================
-- FIX: Add explicit is_org_member check to UPDATE policy WITH CHECK clause
-- ============================================================================
-- Root cause: INSERT policy checks is_org_member in WITH CHECK, but UPDATE 
-- policy doesn't. This inconsistency causes soft delete to fail even when
-- user is creator and leader.

-- Drop existing UPDATE policy for documents
DROP POLICY IF EXISTS "Users can update own documents, leaders can update all" ON documents;

-- Recreate with explicit org membership check in WITH CHECK
-- This matches the pattern used in the INSERT policy
CREATE POLICY "Users can update own documents, leaders can update all"
  ON documents FOR UPDATE
  USING (
    -- Can access if user is creator OR is leader
    created_by = auth.uid()
    OR is_leader(organization_id, auth.uid())
  )
  WITH CHECK (
    -- CRITICAL: Must explicitly check org membership AND (is creator OR is leader)
    -- This matches the INSERT policy pattern
    is_org_member(organization_id, auth.uid())
    AND (
      created_by = auth.uid()
      OR is_leader(organization_id, auth.uid())
    )
  );

-- Do the same for folders to prevent similar issues
DROP POLICY IF EXISTS "Users can update own folders, leaders can update all" ON folders;

CREATE POLICY "Users can update own folders, leaders can update all"
  ON folders FOR UPDATE
  USING (
    created_by = auth.uid()
    OR is_leader(organization_id, auth.uid())
  )
  WITH CHECK (
    is_org_member(organization_id, auth.uid())
    AND (
      created_by = auth.uid()
      OR is_leader(organization_id, auth.uid())
    )
  );
