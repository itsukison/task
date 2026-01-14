# Phase 1: Foundation & Auth

## Overview

Establish the authentication layer, organization structure, and base layout shell following the TaskOS design system principles of Swiss minimalism.

---

## Pages & Components

### 1. `/login` — Authentication Page

```
┌─────────────────────────────────────┐
│           Daily Execution OS        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Email                        │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Password                     │  │
│  └───────────────────────────────┘  │
│                                     │
│  [ Sign In ]  [ Sign Up ]           │
│                                     │
│  ─────── or continue with ───────   │
│  [ Google ]                         │
└─────────────────────────────────────┘
```

#### Component Guidelines

**IMPORTANT**: Use shadcn/ui components for all form elements:
- Import: `import { Button } from '@/components/ui/button'`
- Import: `import { Input } from '@/components/ui/input'`
- Import: `import { Label } from '@/components/ui/label'`
- Use `flex flex-col gap-4` instead of `space-y-4` for consistent spacing
- Wrap form fields in `<div className="space-y-2">` for label/input pairs

#### Design Specifications

**Container**:
```css
max-width: 400px
margin: auto
padding: 48px 24px
min-height: 100vh
display: flex
align-items: center
justify-content: center
background: var(--bg-primary)
```

**Title**:
```css
font-size: var(--font-size-3xl)      /* 32px */
font-weight: var(--font-weight-semibold)  /* 600 */
color: var(--text-primary)
text-align: center
margin-bottom: 48px
letter-spacing: var(--letter-spacing-snug)
```

**Input Fields**:
```css
height: 40px
padding: 12px 16px
background: var(--bg-primary)
border: 1px solid var(--border-primary)
border-radius: var(--radius-sm)  /* 4px */
font-size: var(--font-size-base)  /* 15px */
color: var(--text-primary)
transition: border-color 150ms ease-out

&::placeholder {
  color: var(--text-tertiary)
}

&:hover {
  border-color: var(--border-hover)
}

&:focus {
  border-color: var(--border-focus)  /* orange-600 */
  outline: 2px solid var(--border-focus)
  outline-offset: 2px
}

&:disabled {
  background: var(--bg-tertiary)
  color: var(--text-quaternary)
  cursor: not-allowed
}
```

**Primary Button (Sign In)**:
```css
height: 40px
padding: 12px 20px
background: var(--orange-600)
color: white
font-size: 14px
font-weight: var(--font-weight-semibold)
border: none
border-radius: var(--radius-sm)
cursor: pointer
transition: all 150ms ease-out

&:hover {
  background: var(--orange-700)
  box-shadow: var(--shadow-sm)
}

&:active {
  background: var(--orange-800)
}

&:focus-visible {
  outline: 2px solid var(--orange-600)
  outline-offset: 2px
}

&:disabled {
  opacity: 0.5
  cursor: not-allowed
}
```

**Secondary Button (Sign Up)**:
```css
height: 40px
padding: 12px 20px
background: transparent
color: var(--text-secondary)
font-size: 14px
font-weight: var(--font-weight-semibold)
border: 1px solid var(--border-primary)
border-radius: var(--radius-sm)
cursor: pointer
transition: all 150ms ease-out

&:hover {
  background: var(--bg-hover)
  border-color: var(--border-hover)
}

&:active {
  background: var(--bg-active)
}
```

**Divider Text**:
```css
color: var(--text-tertiary)
font-size: var(--font-size-sm)  /* 14px */
text-align: center
margin: 24px 0
position: relative

&::before, &::after {
  content: ''
  position: absolute
  top: 50%
  width: 40%
  height: 1px
  background: var(--border-secondary)
}
```

**Spacing**:
- Form gap: 16px between inputs
- Button gap: 12px between buttons
- Section margin: 24px between major sections

**Supabase Integration**:
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email, password,
  options: { data: { display_name: name } }
});

// Trigger: auto-create user_profile on signup
```

---

### 2. `/onboarding` — Organization Setup

**Flow**:
1. Create new org OR enter invite code
2. Set display name
3. (Creator becomes `leader`, invitees become `employee`)

#### Design Specifications

**Card Container**:
```css
max-width: 520px
margin: auto
padding: 32px
background: var(--bg-elevated)
border: 1px solid var(--border-primary)
border-radius: var(--radius-lg)  /* 8px */
box-shadow: var(--shadow-md)
```

**Step Indicator**:
```css
display: flex
gap: 8px
margin-bottom: 32px
justify-content: center

.step {
  width: 8px
  height: 8px
  border-radius: var(--radius-full)
  background: var(--border-primary)
  transition: background 200ms ease-out
}

.step.active {
  background: var(--orange-600)
}

.step.completed {
  background: var(--success-solid)
}
```

**Form Labels**:
```css
color: var(--text-secondary)
font-size: 14px
font-weight: var(--font-weight-medium)
margin-bottom: 8px
display: block
```

**Helper Text**:
```css
color: var(--text-tertiary)
font-size: 13px
margin-top: 6px
```

```typescript
// Create org + add self as leader
const { data: org } = await supabase
  .from('organizations')
  .insert({ name: orgName })
  .select()
  .single();

await supabase.from('organization_members').insert({
  organization_id: org.id,
  user_id: userId,
  role: 'leader'
});
```

---

### 3. Global Layout — `app/layout.tsx`

```
┌──┬────────────────────────────────────┐
│≡ │  Page Content                      │
│  │                                    │
│  │                                    │
│  │                                    │
│  │                                    │
└──┴────────────────────────────────────┘
     ↑ Hamburger (closed = 0 width)
```

#### Sidebar Design Specifications

**Closed State**:
```css
width: 0
overflow: hidden
transition: width 250ms ease-out
```

**Hamburger Button (Fixed Position)**:
```css
position: fixed
top: 16px
left: 16px
width: 40px
height: 40px
display: flex
align-items: center
justify-content: center
background: var(--bg-secondary)
border: 1px solid var(--border-primary)
border-radius: var(--radius-sm)
cursor: pointer
z-index: 100
transition: all 150ms ease-out

svg {
  width: 24px
  height: 24px
  color: var(--text-secondary)
}

&:hover {
  background: var(--bg-hover)
  border-color: var(--border-hover)

  svg {
    color: var(--text-primary)
  }
}
```

**Open State**:
```css
width: 280px
background: var(--bg-secondary)
border-right: 1px solid var(--border-primary)
padding: 16px
height: 100vh
position: fixed
left: 0
top: 0
z-index: 50
overflow-y: auto
transition: width 250ms ease-out
box-shadow: var(--shadow-md) /* optional */
```

**Section Header**:
```css
color: var(--text-tertiary)
font-size: var(--font-size-xs)  /* 12px */
font-weight: var(--font-weight-semibold)
text-transform: uppercase
letter-spacing: var(--letter-spacing-wide)  /* 0.05em */
margin-bottom: 8px
margin-top: 24px

&:first-child {
  margin-top: 60px  /* Space for close button */
}
```

**Nav Item**:
```css
display: flex
align-items: center
gap: 12px
padding: 8px 12px
border-radius: var(--radius-sm)
color: var(--text-primary)
font-size: var(--font-size-base)  /* 15px */
text-decoration: none
transition: all 150ms ease-out
cursor: pointer

svg {
  width: 20px
  height: 20px
  color: var(--text-secondary)
}

&:hover {
  background: var(--bg-hover)

  svg {
    color: var(--text-primary)
  }
}

&.active {
  background: var(--orange-600)
  color: white

  svg {
    color: white
  }
}
```

**Sidebar Items** (when open):
- Calendar & Tasks → `/dashboard`
- Progress Tracking → `/progress` (leader-only, hide if employee)
- Settings → `/settings`

**Components**:
- `<Sidebar />` — collapsible navigation
- `<AuthProvider />` — context for user/org/role
- `<ProtectedRoute />` — redirect if unauthenticated

---

## Database Interactions

### Auto-create Profile on Signup

```sql
-- Supabase trigger (runs after auth.users insert)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Fetch User Context

```typescript
// hooks/useAuth.ts
export function useAuth() {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(name)')
        .eq('user_id', user.id)
        .single();

      setUser(user);
      setOrg(membership?.organizations);
      setRole(membership?.role);
    };
    fetchContext();
  }, []);

  return { user, org, role, isLeader: role === 'leader' };
}
```

---

## Animation Specifications

**Page Transitions**:
```css
transition-duration: 200ms
transition-timing-function: ease-out
```

**Modal Enter**:
```css
/* Overlay */
animation: fadeIn 200ms ease-out

/* Panel */
animation: scaleIn 200ms ease-out
transform: scale(0.95) → scale(1)
```

**Sidebar Slide**:
```css
animation: slideIn 250ms ease-out
transform: translateX(-280px) → translateX(0)
```

---

## File Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── onboarding/page.tsx
├── (protected)/
│   ├── layout.tsx          # Sidebar + auth check
│   ├── dashboard/page.tsx  # Empty shell for Phase 2
│   ├── progress/page.tsx   # Leader-only placeholder
│   └── settings/page.tsx   # Placeholder
├── layout.tsx              # Root layout
└── page.tsx                # Redirect to /login or /dashboard

components/
├── Sidebar.tsx
├── AuthProvider.tsx
└── ProtectedRoute.tsx

lib/
├── supabase/
│   ├── client.ts           # Browser client
│   └── server.ts           # Server client
└── hooks/
    └── useAuth.ts
```

---

## Toast Notifications Design

```css
.toast {
  position: fixed
  bottom: 24px
  right: 24px
  max-width: 400px
  background: var(--bg-elevated)
  border: 1px solid var(--border-primary)
  border-left: 4px solid var(--orange-600)  /* or semantic color */
  border-radius: var(--radius-md)
  box-shadow: var(--shadow-lg)
  padding: 16px
  display: flex
  gap: 12px
  animation: slideInRight 300ms ease-out
}

.toast-icon {
  width: 20px
  height: 20px
}

.toast-title {
  font-size: var(--font-size-base)
  font-weight: var(--font-weight-semibold)
  color: var(--text-primary)
}

.toast-message {
  font-size: var(--font-size-sm)
  color: var(--text-secondary)
  margin-top: 4px
}
```

---

## Acceptance Checklist

- [ ] User can sign up with email/password
- [ ] User can sign in and is redirected to dashboard
- [ ] New user is prompted to create/join organization
- [ ] Organization creator is assigned `leader` role
- [ ] Sidebar shows/hides correctly with smooth animation
- [ ] `/progress` is hidden for employees
- [ ] Session persists across page refresh
- [ ] Logout clears session and redirects to login
- [ ] All inputs have proper focus states (orange ring)
- [ ] Buttons have proper hover/active states
- [ ] Design system colors are applied consistently
- [ ] Typography matches design specifications
- [ ] All transitions are 150-250ms ease-out
