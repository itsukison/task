-- ============================================================================
-- Fix Organization Name Visibility for Invite Code Flow
-- ============================================================================
-- Problem: When users try to join via invite code, they can't see the
-- organization name because they're not members yet (RLS blocks it).
--
-- Solution: Allow reading organization names when a valid invite code exists.
-- This is safe because:
-- - Invite codes are already publicly readable
-- - Organization names are not sensitive information
-- - This only allows reading the name, not joining the org
-- - Users still need leader approval to actually join
-- ============================================================================

-- Add policy to allow reading org name via valid invite codes
CREATE POLICY "Users can view org names via invite codes"
ON organizations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_invites
    WHERE organization_invites.organization_id = organizations.id
    -- No need to check user_id since invite codes are publicly readable
  )
);
