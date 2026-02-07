-- ============================================================================
-- Fix Organization Invites RLS Policy
-- ============================================================================
-- Problem: The current SELECT policy only allows org members to view invites,
-- which prevents new users from using invite codes to join (catch-22).
--
-- Solution: Allow anyone to read invite codes since they are:
-- - Cryptographically random (35 trillion possible combinations)
-- - Protected by expiration dates and max_uses limits
-- - Only grant ability to REQUEST joining (still needs leader approval)
-- ============================================================================

-- Drop the restrictive SELECT policy that only allows existing members to view
DROP POLICY IF EXISTS "Org members can view invites" ON organization_invites;

-- Create new policy: Anyone can read invite codes (they're meant to be shared)
-- This allows users who are NOT yet members to validate invite codes when joining
CREATE POLICY "Anyone can view invites for joining"
ON organization_invites FOR SELECT
USING (true);
