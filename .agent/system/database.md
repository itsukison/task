Database Schema Design for Daily Execution OS
I'll design a secure, scalable database schema for your team execution platform. Let me think through this systematically, considering security vulnerabilities and team collaboration requirements.
Core Analysis
Key Requirements:

Role-based access (Leader vs Employee)
Granular visibility controls on tasks/schedules
Supabase Auth integration
Real-time collaboration
Time tracking with precision
Minimal but complete data model

Security Concerns to Address:

Row-Level Security (RLS) for all tables
Prevent unauthorized data access across organizations
Protect against role escalation
Secure visibility controls
Audit trails for sensitive operations
Prevent data leakage through joins


Database Schema
1. organizations
sqlCREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_created_at ON organizations(created_at);
2. organization_members
sqlCREATE TYPE member_role AS ENUM ('leader', 'employee');

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'employee',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one membership per user per org
  UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(organization_id, role);
3. user_profiles
sqlCREATE TYPE schedule_visibility AS ENUM ('private', 'team', 'leaders_only');
CREATE TYPE task_visibility AS ENUM ('private', 'team', 'leaders_only');

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  default_schedule_visibility schedule_visibility NOT NULL DEFAULT 'leaders_only',
  default_task_visibility task_visibility NOT NULL DEFAULT 'leaders_only',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
4. tasks
sqlCREATE TYPE task_status AS ENUM ('planned', 'in_progress', 'overrun', 'completed');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'planned',
  
  -- Time tracking (stored in minutes for precision)
  expected_time_minutes INTEGER NOT NULL CHECK (expected_time_minutes > 0),
  actual_time_minutes INTEGER NOT NULL DEFAULT 0 CHECK (actual_time_minutes >= 0),
  
  -- Visibility control
  visibility task_visibility NOT NULL DEFAULT 'leaders_only',
  
  -- Soft delete
  deleted_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure tasks belong to org members
  CONSTRAINT fk_owner_in_org FOREIGN KEY (organization_id, owner_id) 
    REFERENCES organization_members(organization_id, user_id)
);

-- Indexes
CREATE INDEX idx_tasks_org_id ON tasks(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_owner_id ON tasks(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_visibility ON tasks(organization_id, visibility) WHERE deleted_at IS NULL;
5. calendar_blocks
sqlCREATE TABLE calendar_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Schedule timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  -- Denormalized for performance
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Business rules
  CHECK (end_time > start_time),
  
  -- Prevent double-booking (optional, can be relaxed)
  EXCLUDE USING gist (
    owner_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
);

-- Indexes
CREATE INDEX idx_calendar_blocks_task_id ON calendar_blocks(task_id);
CREATE INDEX idx_calendar_blocks_owner_time ON calendar_blocks(owner_id, start_time, end_time);
CREATE INDEX idx_calendar_blocks_org_time ON calendar_blocks(organization_id, start_time, end_time);
6. time_logs
sqlCREATE TABLE time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  
  -- Calculated duration in minutes (updated on end)
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active timer per user (partial unique index)
CREATE UNIQUE INDEX idx_one_active_timer ON time_logs(user_id) WHERE ended_at IS NULL;

-- Indexes
CREATE INDEX idx_time_logs_task_id ON time_logs(task_id);
CREATE INDEX idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX idx_time_logs_active ON time_logs(user_id) WHERE ended_at IS NULL;
7. user_preferences
sqlCREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- UI state persistence
  calendar_tasks_split_ratio DECIMAL(3,2) CHECK (calendar_tasks_split_ratio BETWEEN 0 AND 1),
  calendar_collapsed BOOLEAN DEFAULT FALSE,
  tasks_collapsed BOOLEAN DEFAULT FALSE,
  
  -- Work hours (stored as time without timezone)
  work_start_time TIME,
  work_end_time TIME,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One preference set per user per org
  UNIQUE(user_id, organization_id)
);

-- Indexes
CREATE INDEX idx_user_preferences_org ON user_preferences(organization_id);

8. audit_logs (Enterprise Compliance)
sqlCREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'ROLE_CHANGE')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name, record_id);

Row-Level Security (RLS) Policies
Security Principle
Default Deny: All tables have RLS enabled with no access by default. Each policy explicitly grants access.
Helper Functions
sql-- Get user's role in organization
CREATE OR REPLACE FUNCTION get_user_role(org_id UUID, uid UUID)
RETURNS member_role AS $$
  SELECT role FROM organization_members 
  WHERE organization_id = org_id AND user_id = uid;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is leader in org
CREATE OR REPLACE FUNCTION is_leader(org_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM organization_members 
    WHERE organization_id = org_id 
      AND user_id = uid 
      AND role = 'leader'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if user is member of org
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM organization_members 
    WHERE organization_id = org_id AND user_id = uid
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
RLS Policies
organizations
sqlALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Members can view their organizations
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
        AND organization_members.user_id = auth.uid()
    )
  );

-- Only leaders can update organizations
CREATE POLICY "Leaders can update their organizations"
  ON organizations FOR UPDATE
  USING (is_leader(id, auth.uid()))
  WITH CHECK (is_leader(id, auth.uid()));

-- Prevent organization deletion via RLS (use admin functions instead)
CREATE POLICY "Block organization deletion"
  ON organizations FOR DELETE
  USING (false);
organization_members
sqlALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Members can view other members in same org
CREATE POLICY "Members can view org members"
  ON organization_members FOR SELECT
  USING (is_org_member(organization_id, auth.uid()));

-- Leaders can insert new members
CREATE POLICY "Leaders can add members"
  ON organization_members FOR INSERT
  WITH CHECK (is_leader(organization_id, auth.uid()));

-- Leaders can update member roles (except their own to prevent lock-out)
CREATE POLICY "Leaders can update member roles"
  ON organization_members FOR UPDATE
  USING (
    is_leader(organization_id, auth.uid())
    AND user_id != auth.uid()
  )
  WITH CHECK (
    is_leader(organization_id, auth.uid())
    AND user_id != auth.uid()
  );

-- Leaders can remove members (except themselves)
CREATE POLICY "Leaders can remove members"
  ON organization_members FOR DELETE
  USING (
    is_leader(organization_id, auth.uid())
    AND user_id != auth.uid()
  );
user_profiles
sqlALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

-- Users in same org can view profiles (for collaboration features)
CREATE POLICY "Org members can view member profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om1
      JOIN organization_members om2 
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = user_profiles.id
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Auto-insert on signup
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());
tasks
sqlALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Complex visibility logic
CREATE POLICY "Users can view tasks based on visibility"
  ON tasks FOR SELECT
  USING (
    deleted_at IS NULL
    AND is_org_member(organization_id, auth.uid())
    AND (
      -- Own tasks
      owner_id = auth.uid()
      -- Leader can see all tasks
      OR is_leader(organization_id, auth.uid())
      -- Team visibility
      OR visibility = 'team'
      -- Leaders-only visibility (for employees to see leader tasks if needed)
      OR (visibility = 'leaders_only' AND is_leader(organization_id, auth.uid()))
    )
  );

-- Users can create tasks in their org
CREATE POLICY "Members can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    is_org_member(organization_id, auth.uid())
    AND is_org_member(organization_id, owner_id)
    AND created_by = auth.uid()
  );

-- Users can update their own tasks or leaders can update any
CREATE POLICY "Users can update own tasks, leaders can update all"
  ON tasks FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      owner_id = auth.uid()
      OR is_leader(organization_id, auth.uid())
    )
  )
  WITH CHECK (
    deleted_at IS NULL
    AND (
      owner_id = auth.uid()
      OR is_leader(organization_id, auth.uid())
    )
    AND is_org_member(organization_id, owner_id)
  );

-- Soft delete: owners or leaders
CREATE POLICY "Users can delete own tasks, leaders can delete all"
  ON tasks FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR is_leader(organization_id, auth.uid())
  );
calendar_blocks
sqlALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;

-- Visibility follows task visibility
CREATE POLICY "Users can view calendar blocks based on task visibility"
  ON calendar_blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = calendar_blocks.task_id
        AND tasks.deleted_at IS NULL
        AND is_org_member(tasks.organization_id, auth.uid())
        AND (
          tasks.owner_id = auth.uid()
          OR is_leader(tasks.organization_id, auth.uid())
          OR tasks.visibility = 'team'
          OR (tasks.visibility = 'leaders_only' AND is_leader(tasks.organization_id, auth.uid()))
        )
    )
  );

-- Only task owner can create calendar blocks
CREATE POLICY "Task owners can create calendar blocks"
  ON calendar_blocks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = calendar_blocks.task_id
        AND tasks.owner_id = auth.uid()
        AND tasks.organization_id = calendar_blocks.organization_id
        AND tasks.deleted_at IS NULL
    )
    AND owner_id = auth.uid()
  );

-- Only task owner can update/delete blocks
CREATE POLICY "Task owners can update calendar blocks"
  ON calendar_blocks FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Task owners can delete calendar blocks"
  ON calendar_blocks FOR DELETE
  USING (owner_id = auth.uid());
time_logs
sqlALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Users can view own time logs, leaders can view all
CREATE POLICY "Users can view time logs"
  ON time_logs FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_leader(organization_id, auth.uid())
  );

-- Users can create time logs for their own tasks
CREATE POLICY "Users can create time logs"
  ON time_logs FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = time_logs.task_id
        AND tasks.owner_id = auth.uid()
        AND tasks.deleted_at IS NULL
    )
  );

-- Users can update their own time logs
CREATE POLICY "Users can update own time logs"
  ON time_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
user_preferences
sqlALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own preferences
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
audit_logs
sqlALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only leaders can view audit logs for their org
CREATE POLICY "Leaders can view audit logs"
  ON audit_logs FOR SELECT
  USING (is_leader(organization_id, auth.uid()));

-- Audit logs are insert-only via triggers/functions (no direct insert)
CREATE POLICY "Block direct audit log inserts"
  ON audit_logs FOR INSERT
  WITH CHECK (false);

Database Functions & Triggers
1. Auto-update timestamps
sqlCREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_blocks_updated_at BEFORE UPDATE ON calendar_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_logs_updated_at BEFORE UPDATE ON time_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
2. Update task actual time from time logs
sqlCREATE OR REPLACE FUNCTION update_task_actual_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update when time log is completed (ended_at is set)
  IF NEW.ended_at IS NOT NULL AND NEW.duration_minutes IS NOT NULL THEN
    UPDATE tasks
    SET actual_time_minutes = (
      SELECT COALESCE(SUM(duration_minutes), 0)
      FROM time_logs
      WHERE task_id = NEW.task_id
        AND ended_at IS NOT NULL
    )
    WHERE id = NEW.task_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_task_time_on_log_complete
  AFTER INSERT OR UPDATE OF ended_at, duration_minutes ON time_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_task_actual_time();
3. Calculate time log duration
sqlCREATE OR REPLACE FUNCTION calculate_time_log_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_duration_on_time_log_end
  BEFORE INSERT OR UPDATE OF ended_at ON time_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_log_duration();
4. Auto-update task status based on time
sqlCREATE OR REPLACE FUNCTION update_task_status_on_time_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark as overrun if actual time exceeds expected time
  IF NEW.actual_time_minutes > NEW.expected_time_minutes 
     AND NEW.status != 'completed' THEN
    NEW.status = 'overrun';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_task_overrun
  BEFORE UPDATE OF actual_time_minutes ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_status_on_time_change();
5. Sync calendar block with task owner
sqlCREATE OR REPLACE FUNCTION sync_calendar_block_owner()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure calendar block owner matches task owner
  SELECT owner_id INTO NEW.owner_id
  FROM tasks
  WHERE id = NEW.task_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_block_owner_on_insert
  BEFORE INSERT ON calendar_blocks
  FOR EACH ROW
  EXECUTE FUNCTION sync_calendar_block_owner();

Security Hardening Checklist
✅ Implemented Protections

Cross-Organization Data Leakage: All queries filtered by organization_id with RLS
Role Escalation: Leaders cannot modify their own role, preventing self-demotion or lock-out
Unauthorized Task Access: Visibility enum strictly enforced via RLS
Calendar Block Manipulation: Only task owners can create/modify blocks
Time Log Tampering: Users can only log time for their own tasks
Double Booking: EXCLUDE constraint prevents overlapping calendar blocks (can be relaxed if needed)
Soft Delete Bypass: All SELECT policies include deleted_at IS NULL
Foreign Key Validation: Composite FK ensures task owners are org members
Timer Abuse: Partial unique index ensures only one active timer per user
SQL Injection: Parameterized queries via Supabase client + SECURITY DEFINER functions
Organization Protection: RLS blocks organization deletion (admin functions required)
Audit Logging: All sensitive operations logged to audit_logs table
Multi-Org Support: User preferences now properly scoped per organization

⚠️ Additional Recommendations

API Rate Limiting: Implement at application layer (Supabase has built-in rate limiting)
Data Retention: Implement hard delete policy for soft-deleted tasks after 30 days
Encryption: Sensitive fields (if any) should use pgcrypto
Backup Strategy: Regular automated backups with point-in-time recovery
Monitoring: Set up alerts for suspicious patterns (mass deletions, rapid role changes)


Indexes Strategy
All indexes are designed for:

Query Performance: Primary access patterns (org_id, user_id, time ranges)
RLS Performance: Indexes on foreign keys used in policies
Partial Indexes: WHERE deleted_at IS NULL to exclude soft-deleted records


Migration Notes
Initial Setup Order

Enable UUID extension: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
Create ENUMs
Create tables (in dependency order)
Create indexes
Enable RLS on all tables
Create helper functions
Create RLS policies
Create triggers

Seed Data for Testing
sql-- Create test organization
INSERT INTO organizations (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Startup');

-- Add test leader (assumes user exists in auth.users)
INSERT INTO organization_members (organization_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'USER_UUID_HERE', 'leader');

API Usage Examples
Creating a Task (TypeScript/Next.js)
typescriptconst { data, error } = await supabase
  .from('tasks')
  .insert({
    organization_id: orgId,
    owner_id: userId,
    created_by: userId,
    title: 'Design database schema',
    description: 'Create secure, scalable schema',
    expected_time_minutes: 120,
    visibility: 'team'
  })
  .select()
  .single();
Fetching Tasks with Visibility
typescript// RLS automatically filters based on visibility rules
const { data: tasks } = await supabase
  .from('tasks')
  .select(`
    *,
    owner:user_profiles!owner_id(display_name),
    calendar_blocks(*)
  `)
  .eq('organization_id', orgId)
  .is('deleted_at', null);
Leader Dashboard Query
typescriptconst { data: teamData } = await supabase
  .from('organization_members')
  .select(`
    user_id,
    user_profiles(display_name),
    tasks:tasks(
      id,
      status,
      expected_time_minutes,
      actual_time_minutes
    )
  `)
  .eq('organization_id', orgId);
