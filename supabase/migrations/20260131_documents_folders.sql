-- ============================================================================
-- Documents and Folders Tables Migration
-- ============================================================================
-- This migration adds support for a documents canvas feature where users can
-- create, organize, and manage documents and folders within their organization.

-- ============================================================================
-- 1. FOLDERS TABLE
-- ============================================================================

CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'New Folder',
  parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  
  -- Canvas positioning (null if inside another folder)
  position_x DECIMAL(10, 2),
  position_y DECIMAL(10, 2),
  width INT DEFAULT 280,
  height INT DEFAULT 180,
  is_open BOOLEAN DEFAULT FALSE,
  
  -- Visibility control (reuse existing task_visibility enum)
  visibility task_visibility NOT NULL DEFAULT 'team',
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent circular folder references
  CHECK (parent_folder_id != id)
);

-- Indexes for folders
CREATE INDEX idx_folders_org ON folders(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_folders_parent ON folders(parent_folder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_folders_created_by ON folders(created_by);
CREATE INDEX idx_folders_visibility ON folders(organization_id, visibility) WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. DOCUMENTS TABLE
-- ============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB, -- Rich text content (Tiptap JSON format)
  type TEXT NOT NULL DEFAULT 'document', -- 'document', 'uploaded_file', 'link'
  
  -- For uploaded files
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  
  -- For external links
  link_url TEXT,
  preview_image_url TEXT,
  preview_metadata JSONB, -- {title, description, favicon, etc}
  
  -- Canvas positioning
  position_x DECIMAL(10, 2),
  position_y DECIMAL(10, 2),
  width INT DEFAULT 280,
  height INT DEFAULT 320,
  
  -- Visibility control
  visibility task_visibility NOT NULL DEFAULT 'team',
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure type is valid
  CHECK (type IN ('document', 'uploaded_file', 'link'))
);

-- Indexes for documents
CREATE INDEX idx_documents_org ON documents(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_folder ON documents(folder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_type ON documents(type) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_visibility ON documents(organization_id, visibility) WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- FOLDERS RLS POLICIES
-- ----------------------------------------------------------------------------

-- Users can view folders based on visibility rules
CREATE POLICY "Users can view folders based on visibility"
  ON folders FOR SELECT
  USING (
    deleted_at IS NULL
    AND is_org_member(organization_id, auth.uid())
    AND (
      -- Own folders
      created_by = auth.uid()
      -- Leader can see all folders
      OR is_leader(organization_id, auth.uid())
      -- Team visibility
      OR visibility = 'team'
      -- Leaders-only visibility
      OR (visibility = 'leaders_only' AND is_leader(organization_id, auth.uid()))
    )
  );

-- Members can create folders in their org
CREATE POLICY "Members can create folders"
  ON folders FOR INSERT
  WITH CHECK (
    is_org_member(organization_id, auth.uid())
    AND created_by = auth.uid()
  );

-- Users can update their own folders or leaders can update any
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

-- ----------------------------------------------------------------------------
-- DOCUMENTS RLS POLICIES
-- ----------------------------------------------------------------------------

-- Users can view documents based on visibility rules
CREATE POLICY "Users can view documents based on visibility"
  ON documents FOR SELECT
  USING (
    deleted_at IS NULL
    AND is_org_member(organization_id, auth.uid())
    AND (
      -- Own documents
      created_by = auth.uid()
      -- Leader can see all documents
      OR is_leader(organization_id, auth.uid())
      -- Team visibility
      OR visibility = 'team'
      -- Leaders-only visibility
      OR (visibility = 'leaders_only' AND is_leader(organization_id, auth.uid()))
    )
  );

-- Members can create documents in their org
CREATE POLICY "Members can create documents"
  ON documents FOR INSERT
  WITH CHECK (
    is_org_member(organization_id, auth.uid())
    AND created_by = auth.uid()
  );

-- Users can update their own documents or leaders can update any
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

-- ============================================================================
-- 4. TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE TRIGGER update_folders_updated_at 
  BEFORE UPDATE ON folders
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at 
  BEFORE UPDATE ON documents
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. STORAGE BUCKET SETUP (Execute separately or via Supabase Dashboard)
-- ============================================================================

-- Create storage bucket for document files
-- This needs to be run with admin privileges or via Supabase Dashboard
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-files', 'document-files', false);

-- Storage RLS policies
CREATE POLICY "Users can upload files to their org folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'document-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view files in their org"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'document-files'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'document-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'document-files'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
*/
