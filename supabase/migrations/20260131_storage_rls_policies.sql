-- ============================================================================
-- STORAGE RLS POLICIES FOR DOCUMENT-FILES BUCKET
-- ============================================================================
-- This migration creates RLS policies for the document-files storage bucket.
-- The bucket must be created manually in Supabase Dashboard first.
--
-- Upload path structure: {organizationId}/{userId}/{fileName}
-- - [1] = organizationId (first folder)
-- - [2] = userId (second folder)
-- - [3] = fileName
-- ============================================================================

-- SELECT Policy: Users can view files in their organization
-- Users can view any file in their organization (not just their own files)
CREATE POLICY "Users can view org files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'document-files'
    AND auth.uid() IS NOT NULL
    AND is_org_member(
      (storage.foldername(name))[1]::uuid,  -- organizationId from path
      auth.uid()
    )
  );

-- INSERT Policy: Users can upload to their org folder
-- Users can only upload files to paths matching their org and user ID
CREATE POLICY "Users can upload to org folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'document-files'
    AND auth.uid() IS NOT NULL
    AND is_org_member(
      (storage.foldername(name))[1]::uuid,  -- organizationId
      auth.uid()
    )
    AND auth.uid()::text = (storage.foldername(name))[2]  -- userId matches second folder
  );

-- UPDATE Policy: Users can update their own files
-- Users can only update files they uploaded (userId in path matches auth.uid)
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'document-files'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[2]  -- userId matches second folder
  );

-- DELETE Policy: Users can delete their own files
-- Users can only delete files they uploaded (userId in path matches auth.uid)
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'document-files'
    AND auth.uid() IS NOT NULL
    AND auth.uid()::text = (storage.foldername(name))[2]  -- userId matches second folder
  );
