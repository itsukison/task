# Stagehand Implementation Technical Status

## 1. Workflow Creation: The "Kimi" Orchestrator
When a user provides a broad goal (e.g., "@OpenClaw create a meeting for tomorrow at 2pm"), the system uses the **Kimi (Moonshot) model** to architect a plan. 

### The Strategy (Kimi Prompt)
The orchestrator is guided by a specialized system prompt that enforces:
- **Atomicity**: Every step must be a single, non-ambiguous action (Navigation, Click, Type, Extract).
- **Variable Injection**: Automatic detection of dynamic parameters using the `{variable_name}` syntax.
- **Deterministic First Step**: Ensuring execution begins with a valid starting URL target.
- **Schema Enforcement**: Kimi outputs a strict JSON payload containing the workflow name, description, target site, and an ordered list of instructions.

## 2. Execution Engine: Deterministic Step Loop
Instead of relying on a black-box autonomous agent, `executeWorkflow.ts` implements a transparent execution loop. For each step:
- **Navigation Routing**: Instructions like "Go to..." are routed to Playwright's native `page.goto()`.
- **Extraction Routing**: Instructions like "Extract..." or "Get..." use `stagehand.extract()`.
- **Interaction Routing**: All other DOM manipulations use `stagehand.act()` as a fallback string-based instruction.
- **Selector Caching**: Successful AI-generated selectors (e.g., `#main-cta-button`) are persisted back to the database. Subsequent runs attempt to click these directly via `page.locator()`, bypassing the expensive and slow AI grounding phase when the UI remains stable.

## 3. Reactive Auth & Resume Flow
The system handles authentication walls (Login, 2FA, Captchas) through a sophisticated pause-and-resume mechanism.

### Auth Detection
The loop performs a **URL-first check** (targeting `accounts.google.com` or `/login` patterns) followed by a **DOM-fallback check** (looking for password inputs). If an auth wall is identified:
1. **Execution Paused**: The browser session is kept ALIVE for a 10-minute window.
2. **State Persistence**: A record is created in `workflow_executions` containing the session ID, variables, and the specific `paused_at_step` index.
3. **Structured Notification**: The chat UI interrupts with a tailored `AuthRequiredCard`.

### Resumption
The user logs in directly via the Browserbase `connectUrl` (browser-in-browser). Once they click "I'm logged in":
- The `/api/workflows/resume` endpoint re-triggers the loop.
- It reconnects to the *same* session and slices the steps array starting from `paused_at_step`.
- Upon successful completion, the resulting **Browserbase Context (cookies)** is persisted to the database for future runs.

## 4. Real-time Observability
Every action is streamed back to the chat interface via a `logToChat` helper, providing the user with immediate feedback on which step is running, what was extracted, and providing a direct link to watch the live video stream of the automation.
