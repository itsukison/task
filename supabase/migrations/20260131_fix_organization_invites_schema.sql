-- ============================================================================
-- Fix Organization Invites Table Schema
-- ============================================================================
-- This migration replaces the email-based invitation system with a reusable
-- invite code system as designed in the codebase.
--
-- The existing table has: email, token, invited_by, role, status
-- The code expects: invite_code, created_by, max_uses, used_count
-- ============================================================================

-- Drop the existing email-based organization_invites table
DROP TABLE IF EXISTS organization_invites CASCADE;

-- Create the reusable invite code table with the correct schema
CREATE TABLE organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT NULL, -- NULL means unlimited
  used_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_invite_code ON organization_invites(invite_code);
CREATE INDEX idx_org_invites_org_id ON organization_invites(organization_id);

-- Enable Row Level Security
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Org members can view invites
CREATE POLICY "Org members can view invites"
ON organization_invites FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organization_invites.organization_id
    AND user_id = auth.uid()
  )
);

-- RLS Policy: Leaders can create invites
CREATE POLICY "Leaders can create invites"
ON organization_invites FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organization_invites.organization_id
    AND user_id = auth.uid()
    AND role = 'leader'
  )
);

-- RLS Policy: Leaders can delete/revoke invites
CREATE POLICY "Leaders can delete invites"
ON organization_invites FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = organization_invites.organization_id
    AND user_id = auth.uid()
    AND role = 'leader'
  )
);

-- RLS Policy: System can update used_count when invite is used
CREATE POLICY "System can update invite usage"
ON organization_invites FOR UPDATE
USING (true)
WITH CHECK (true);
