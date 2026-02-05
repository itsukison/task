-- ============================================================================
-- ADD DELETE POLICY for Documents and Folders
-- ============================================================================
-- The UPDATE policy WITH CHECK is failing even though all conditions are met
-- This is a workaround: switch to hard delete instead of soft delete

-- Add DELETE policy for documents
CREATE POLICY "Users can delete own documents, leaders can delete all"
  ON documents FOR DELETE
  USING (
    is_org_member(organization_id, auth.uid())
    AND (
      created_by = auth.uid()
      OR is_leader(organization_id, auth.uid())
    )
  );

-- Add DELETE policy for folders
CREATE POLICY "Users can delete own folders, leaders can delete all"
  ON folders FOR DELETE
  USING (
    is_org_member(organization_id, auth.uid())
    AND (
      created_by = auth.uid()
      OR is_leader(organization_id, auth.uid())
    )
  );
