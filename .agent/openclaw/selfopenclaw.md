# Chrono MVP – Technical Implementation Guide
## AI Task Execution via Stagehand + Browserbase

---

## Architecture Overview

```
User (Chat UI)
    ↓ task + @workflow mention
Chrono Backend (Next.js API Route)
    ↓ creates session with user's saved Context
Browserbase (Cloud Chrome Instance)
    ↑ controlled by
Stagehand SDK (runs on your backend)
    ↓ streams status updates back
User (Chat UI)
```

**Browserbase** = the cloud browser infrastructure. Spins up a real Chrome instance on their servers. Handles stealth, anti-bot, and persistent login sessions via Contexts.
→ Docs: https://docs.browserbase.com/introduction
→ Contexts (persistent sessions): https://docs.browserbase.com/features/sessions

**Stagehand** = the AI automation SDK that connects to Browserbase and controls the browser with natural language.
→ Docs: https://docs.stagehand.dev/first-steps/introduction
*Note: We will be using the Kimi API as our LLM provider for Stagehand to consolidate our AI usage and optimize costs.*
→ `act()`: https://docs.stagehand.dev/basics/act
→ `extract()`: https://docs.stagehand.dev/basics/extract
→ `observe()`: https://docs.stagehand.dev/basics/observe
→ Caching actions: https://docs.stagehand.dev/best-practices/caching

---

## Page Structure

### 1. `/workflows` — Workflow Library Page
Where users create and manage reusable workflows. Separate from chat.

### 2. `/chat` — Task Assignment Chat Page
Where users assign tasks to the AI. Workflows are referenced via `@mention`.

---

## Part 1: Workflow Library (`/workflows`)

### What a Workflow Is

A workflow is a saved sequence of natural language steps scoped to a specific tool/site. It is stored in your database and injected as context when the AI executes a task.

### Data Model

```typescript
// schema.prisma or equivalent

model Workflow {
  id          String   @id @default(cuid())
  workspaceId String
  name        String                    // e.g. "Create Zoom Meeting"
  description String                    // shown in @mention picker
  site        String                    // e.g. "zoom.us"
  steps       WorkflowStep[]
  cachedActions Json?                   // stores hardened DOM selectors after runs
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorkflowStep {
  id           String   @id @default(cuid())
  workflowId   String
  order        Int
  instruction  String   // natural language, e.g. "click Schedule a Meeting"
  cachedSelector String? // hardened after first successful run
}
```

### Workflow Creation UI

Build a simple form page at `/workflows/new`:
- **Natural Language Input**: A single text area where the user describes the entire goal and provides necessary URLs.
  - *Example*: "Go to zoom.us/meeting/schedule and create a 30-minute meeting with the topic {topic} and invite {invitees}."
- **Generate Plan** button
- **Plan Review UI**: Shows the AI-generated step-by-step plan based on the input for the user to confirm or edit.
- **Save** → POST to `/api/workflows`

No manual step-by-step coding needed from the user initially. The AI generates the plain English steps behind the scenes:
```
1. Go to zoom.us/meeting/schedule
2. Set the meeting topic to {topic}
3. Set the date to {date}
4. Set the start time to {time}
5. Add invitees: {invitees}
6. Click Save
7. Extract the meeting link
```

Note the `{variable}` syntax — these are slots the AI fills from the chat context at runtime. The AI will automatically identify and insert these variables during the planning phase.

### API Route: Generate and Save Workflow

```typescript
// /app/api/workflows/route.ts
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { name, site, description, steps, workspaceId } = await req.json();

  const workflow = await prisma.workflow.create({
    data: {
      name: generatedName, // AI generates a concise name based on the prompt
      site: extractedSite, // AI extracts the base URL
      description: generatedDescription,
      workspaceId,
      steps: {
        create: generatedSteps.map((instruction: string, i: number) => ({
          order: i,
          instruction,
        })),
      },
    },
    include: { steps: true },
  });

  return Response.json(workflow);
}
```

---

## Part 2: One-Time Auth Setup (Browserbase Contexts)

Before a user can run any workflow, they must connect the relevant service once. This saves their login session to a Browserbase Context so future runs start pre-authenticated.

### Create a Context for Each User

```typescript
// /app/api/auth/connect-service/route.ts
// Call this during onboarding when user clicks "Connect Zoom"
import Browserbase from "@browserbase-ai/sdk";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });

export async function POST(req: Request) {
  const { userId, service } = await req.json(); // service = "zoom", "notion", etc.

  // Create a new persistent context for this user+service
  const context = await bb.contexts.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
  });

  // Save context ID to your DB
  await prisma.userServiceContext.create({
    data: { userId, service, contextId: context.id },
  });

  // Return a live session URL so the user can log in inside an iframe/popup
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    browserSettings: {
      context: { id: context.id, persist: true },
    },
  });

  // session.connectUrl is a URL you can embed in an iframe for the user to log in
  return Response.json({ connectUrl: session.connectUrl, sessionId: session.id });
}
```

Show the `connectUrl` in a modal iframe. The user logs in normally. When they close it, the session is saved to their Context. Done — they never log in again.

→ Browserbase Sessions API: https://docs.browserbase.com/reference/api/create-a-session

---

## Part 3: Chat Page with @Workflow Mentions (`/chat`)

### @Mention Picker

When the user types `@` in the chat input, show an autocomplete dropdown of their saved workflows (fetched from `/api/workflows?workspaceId=...`). Selecting one embeds it as a structured reference in the message:

```typescript
// Message structure sent to backend
{
  text: "Create a meeting for the Q3 launch sync",
  workflowRef: {
    id: "clx_abc123",
    name: "Create Zoom Meeting"
  }
}
```

### Chat API Route — The Orchestrator

This is the brain. It receives the message, extracts variable values via LLM, asks follow-up questions if needed, then triggers execution.

```typescript
// /app/api/chat/route.ts
// Note: Replace Anthropic implementation with Kimi API SDK
import { KimiClient } from "kimi-sdk"; // Replace with actual Kimi SDK import
import { executeWorkflow } from "@/lib/executeWorkflow";
import { prisma } from "@/lib/prisma";

const kimi = new KimiClient({ apiKey: process.env.KIMI_API_KEY }); // Example Kimi initialization

export async function POST(req: Request) {
  const { message, workflowRef, workspaceId, userId } = await req.json();

  // 1. Fetch the workflow and its steps
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowRef.id },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  // 2. Use LLM to extract variable values from the message
  // and identify any missing info that needs to be asked
  const extractionPrompt = `
    The user wants to run this workflow: "${workflow.name}"
    Steps: ${workflow.steps.map(s => s.instruction).join("\n")}
    User message: "${message}"
    
    Extract all variable values (like {topic}, {date}, {time}, {invitees}) from the message.
    If any required variable is missing or ambiguous, list what needs to be asked.
    
    Respond in JSON: { variables: {...}, missingInfo: string[] }
  `;

  // Use Kimi to extract variables
  const extraction = await kimi.chat.completions.create({
    model: "kimi-latest", // Replace with appropriate Kimi model
    messages: [{ role: "user", content: extractionPrompt }],
    response_format: { type: "json_object" } // Assuming Kimi supports JSON output
  });

  const { variables, missingInfo } = JSON.parse(
    extraction.choices[0].message.content || "{}"
  );

  // 3. If missing info, return a follow-up question to the chat UI
  if (missingInfo.length > 0) {
    return Response.json({
      type: "follow_up",
      message: `Before I start, I need a few things: ${missingInfo.join(", ")}`,
    });
  }

  // 4. All info collected — trigger execution (non-blocking, stream updates via SSE)
  executeWorkflow({ workflow, variables, userId, workspaceId });

  return Response.json({
    type: "started",
    message: `Got it. Starting "${workflow.name}" now...`,
  });
}
```

---

## Part 4: Workflow Execution Engine

This is the core. It runs on your backend, connects to Browserbase, and uses Stagehand to execute each step.

```typescript
// /lib/executeWorkflow.ts
import { Stagehand } from "@browserbasehq/stagehand";
import Browserbase from "@browserbase-ai/sdk";
import { sendChatUpdate } from "@/lib/chatStream"; // your SSE/WebSocket helper
import { prisma } from "@/lib/prisma";

const bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });

export async function executeWorkflow({ workflow, variables, userId, workspaceId }) {
  // 1. Get user's saved Browserbase context for this service
  const userContext = await prisma.userServiceContext.findFirst({
    where: { userId, service: workflow.site },
  });

  if (!userContext) {
    sendChatUpdate(userId, {
      type: "error",
      message: `You haven't connected ${workflow.site} yet. Please connect it first in Settings.`,
    });
    return;
  }

  // 2. Create a Browserbase session using the user's persistent context
  const session = await bb.sessions.create({
    projectId: process.env.BROWSERBASE_PROJECT_ID!,
    browserSettings: {
      context: { id: userContext.contextId, persist: true }, // loads their cookies
    },
  });

  // 3. Init Stagehand connected to that session
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    browserbaseSessionID: session.id,
    modelName: "custom", // Configure Stagehand to use Kimi
    modelClientOptions: {
      client: kimi, // Pass the initialized Kimi client if Stagehand supports custom providers, otherwise a custom adapter might be needed
    },
  });

  await stagehand.init();
  const page = stagehand.page;
  const executionLog = []; // track results for workflow improvement

  try {
    for (const step of workflow.steps) {
      // Fill in variables: "Set topic to {topic}" → "Set topic to Q3 Launch Sync"
      const instruction = interpolateVariables(step.instruction, variables);

      sendChatUpdate(userId, { type: "progress", message: `→ ${instruction}` });

      // Use cached selector if available (faster, no AI lookup needed)
      // https://docs.stagehand.dev/best-practices/caching
      if (step.cachedSelector) {
        await page.locator(step.cachedSelector).click(); // deterministic
        executionLog.push({ stepId: step.id, usedCache: true });
      } else {
        // Let Stagehand figure out the DOM action via AI
        // https://docs.stagehand.dev/basics/act
        const result = await stagehand.act({ action: instruction });
        executionLog.push({
          stepId: step.id,
          usedCache: false,
          resolvedSelector: result?.selector, // save this for caching
        });
      }
    }

    // Extract final result if last step is an extraction
    // https://docs.stagehand.dev/basics/extract
    const finalStep = workflow.steps.at(-1);
    if (finalStep?.instruction.toLowerCase().startsWith("extract")) {
      const extracted = await stagehand.extract(finalStep.instruction);
      sendChatUpdate(userId, { type: "done", message: `✓ Done!`, data: extracted });
    } else {
      sendChatUpdate(userId, { type: "done", message: `✓ Workflow completed successfully.` });
    }

    // Auto-harden: save resolved selectors back to DB for future runs
    await hardenWorkflowSteps(executionLog);

    // Prompt user to update the workflow based on this run
    sendChatUpdate(userId, {
      type: "update_prompt",
      message: `Workflow ran successfully. Want me to save the optimized steps for faster future runs?`,
      workflowId: workflow.id,
    });

  } catch (error) {
    sendChatUpdate(userId, {
      type: "error",
      message: `Something went wrong on step: "${error.step}". ${error.message}`,
      workflowId: workflow.id,
      failedStep: error.step,
    });

    // Prompt user to fix it
    sendChatUpdate(userId, {
      type: "update_prompt",
      message: `Want to update this workflow to fix the issue?`,
      workflowId: workflow.id,
    });
  } finally {
    await stagehand.close();
  }
}

function interpolateVariables(instruction: string, variables: Record<string, string>) {
  return instruction.replace(/\{(\w+)\}/g, (_, key) => variables[key] ?? `{${key}}`);
}

async function hardenWorkflowSteps(log: { stepId: string; resolvedSelector?: string }[]) {
  for (const entry of log) {
    if (entry.resolvedSelector) {
      await prisma.workflowStep.update({
        where: { id: entry.stepId },
        data: { cachedSelector: entry.resolvedSelector },
      });
    }
  }
}
```

---

## Part 5: Self-Improving Workflows

### How it works

After every run — successful or failed — the system can update the workflow in two ways:

**A) Automatic hardening (silent)**
Resolved DOM selectors from `act()` are cached back onto each step. Next run uses the exact selector instead of re-asking the AI. This is Stagehand's recommended caching pattern and makes subsequent runs dramatically faster and cheaper.
→ https://docs.stagehand.dev/best-practices/caching

**B) Human feedback (prompted)**
After a run, the chat UI shows:
- On success: *"Workflow ran successfully. Want me to save optimized steps?"* → user clicks Yes → `hardenWorkflowSteps()` commits the cache
- On failure: *"Step 3 failed. Describe what went wrong or how to fix it"* → user types in plain English → LLM rewrites the affected step → saved back to DB

### Feedback Handler

```typescript
// /app/api/workflows/improve/route.ts
export async function POST(req: Request) {
  const { workflowId, stepId, userFeedback } = await req.json();

  const step = await prisma.workflowStep.findUnique({ where: { id: stepId } });

  // Use Kimi LLM to rewrite the step based on feedback
  const response = await kimi.chat.completions.create({
    model: "kimi-latest",
    messages: [{
      role: "user",
      content: `
        Current workflow step: "${step.instruction}"
        User feedback: "${userFeedback}"
        Rewrite the step instruction to be clearer and more precise.
        Return only the new instruction string, nothing else.
      `,
    }],
  });

  const newInstruction = response.choices[0].message.content?.trim() || step.instruction;

  await prisma.workflowStep.update({
    where: { id: stepId },
    data: {
      instruction: newInstruction,
      cachedSelector: null, // clear cache so it re-resolves with new instruction
    },
  });

  return Response.json({ updated: newInstruction });
}
```

---

## Environment Variables

```bash
BROWSERBASE_API_KEY=...
BROWSERBASE_PROJECT_ID=...
KIMI_API_KEY=...              # Replaced Anthropic/Gemini with Kimi
DATABASE_URL=...
```

---

## Summary Flow

```
/workflows page
  → user creates workflow with named steps + {variables}
  → saved to DB

/chat page
  → user types task + @CreateZoomMeeting
  → backend LLM extracts variables from message
  → if missing info → chat asks follow-up question
  → once complete → executeWorkflow() fires
      → Browserbase session created with user's saved Context (pre-logged-in)
      → Stagehand executes each step (cached selector or AI-resolved)
      → streams progress back to chat UI via SSE
      → on done → result posted to chat
      → resolved selectors auto-saved (hardening)
      → user prompted: update workflow? yes/no
```