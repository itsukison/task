-- Enable RLS (Should already be enabled but ensuring it)
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

-- Workflows: Users can view workflows in their organization
CREATE POLICY "Users can view org workflows" 
ON workflows FOR SELECT 
USING (is_org_member(workspace_id, auth.uid()));

-- Workflows: Users can insert workflows in their organization
CREATE POLICY "Users can insert org workflows" 
ON workflows FOR INSERT 
WITH CHECK (is_org_member(workspace_id, auth.uid()));

-- Workflows: Users can update workflows in their organization
CREATE POLICY "Users can update org workflows" 
ON workflows FOR UPDATE 
USING (is_org_member(workspace_id, auth.uid()))
WITH CHECK (is_org_member(workspace_id, auth.uid()));

-- Workflows: Users can delete workflows in their organization
CREATE POLICY "Users can delete org workflows" 
ON workflows FOR DELETE 
USING (is_org_member(workspace_id, auth.uid()));

-- Workflow Steps: Users can view steps if they can view the workflow
CREATE POLICY "Users can view workflow steps" 
ON workflow_steps FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM workflows 
    WHERE workflows.id = workflow_steps.workflow_id 
    AND is_org_member(workflows.workspace_id, auth.uid())
  )
);

-- Workflow Steps: Users can insert steps if they can insert the workflow
CREATE POLICY "Users can insert workflow steps" 
ON workflow_steps FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workflows 
    WHERE workflows.id = workflow_steps.workflow_id 
    AND is_org_member(workflows.workspace_id, auth.uid())
  )
);

-- Workflow Steps: Users can update steps if they can update the workflow
CREATE POLICY "Users can update workflow steps" 
ON workflow_steps FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM workflows 
    WHERE workflows.id = workflow_steps.workflow_id 
    AND is_org_member(workflows.workspace_id, auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workflows 
    WHERE workflows.id = workflow_steps.workflow_id 
    AND is_org_member(workflows.workspace_id, auth.uid())
  )
);

-- Workflow Steps: Users can delete steps if they can delete the workflow
CREATE POLICY "Users can delete workflow steps" 
ON workflow_steps FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM workflows 
    WHERE workflows.id = workflow_steps.workflow_id 
    AND is_org_member(workflows.workspace_id, auth.uid())
  )
);
