# TaskOS Architecture Rules

> Concise guidelines for maintainable code. Keep this file under 100 lines.

---

## 1. Layer Structure

```
lib/           → Types, utilities, configs
                 ✅ Exception: lib/hooks/ and lib/auth/ may use React
                 Rationale: Hooks are framework utilities, infrastructure layer
components/ui/ → Primitive UI (Button, Input, Card) - no business logic
components/    → Feature components (Calendar, TaskList) - can compose ui/
app/           → Pages & layouts only - minimal logic, delegate to components
```

**Rules:**
- Lower layers CANNOT import from higher layers
- `lib/` → pure TypeScript, no React dependencies (except lib/hooks/ and lib/auth/)
- `components/ui/` → generic, reusable, no app-specific types

---

## 2. File Size Limits

| Layer          | Max Lines | Action if Exceeded                    |
|----------------|-----------|---------------------------------------|
| `components/`  | 200       | Split into smaller components         |
| `app/` pages   | 150       | Extract logic to components or hooks  |
| `lib/`         | 300       | Split by domain (types, utils, api)   |

---

## 3. Import Rules

```typescript
// ✅ Correct
import { Task } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ❌ Wrong - component importing from app/
import { something } from '@/app/page';
```

---

## 4. Shared Types (`lib/types.ts`)

All shared interfaces live here. Components import, never redefine:

```typescript
export type TaskStatus = 'planned' | 'in_progress' | 'overrun' | 'complete';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  expectedTime: number;
  actualTime: number;
  owner: string;
}

export interface CalendarBlock {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string;
}
```

---

## 5. Styling Standards

### Design Tokens (CSS Variables)
```css
:root {
  --primary: #EA580C;           /* Orange accent (buttons, active) */
  --background: #FFFFFF;        /* Main background */
  --muted: #F7F7F5;             /* Sidebar, cards */
  --border: #E9E9E7;            /* All borders */
  --text: #37352F;              /* Primary text */
  --text-muted: #5F5E5B;        /* Secondary text */
}
```

### Tailwind Patterns
```typescript
// Use cn() for conditional classes
import { cn } from '@/lib/utils';

<button className={cn(
  "px-3 py-1.5 rounded-md text-sm font-medium",
  "transition-colors focus-visible:outline-none",
  isActive ? "bg-[#EFEFED] text-[#37352F]" : "text-[#5F5E5B] hover:bg-[#EFEFED]"
)} />
```

### Component Patterns (shadcn-style)
```typescript
// components/ui/button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />
  )
);
```

---

## 6. Routing (Next.js App Router)

```
app/
├── layout.tsx              # Root layout
├── (dashboard)/
│   ├── layout.tsx          # Shared sidebar layout
│   ├── workspace/page.tsx  # /workspace
│   ├── progress/page.tsx   # /progress
│   └── settings/page.tsx   # /settings
└── page.tsx                # Redirect to /workspace
```

**Rules:**
- Use `<Link>` for navigation, never `onClick` + state
- Use `usePathname()` for active state detection
- Route groups `(dashboard)` for shared layouts

---

## 7. Quick Reference

| Pattern                | Do                                    | Don't                           |
|------------------------|---------------------------------------|---------------------------------|
| Types                  | Import from `@/lib/types`             | Redefine in each component      |
| Class merging          | `cn("base", conditional)`             | Template literals               |
| Navigation             | `<Link href="/path">`                 | `onClick={() => setState()}`    |
| Colors                 | CSS variables or design tokens        | Hardcoded hex everywhere        |
| Large components       | Split into smaller files              | 400+ line files                 |
