# Phase 5: Polish & Settings

## Overview

Complete the Settings page, ensure UI state persistence, loading states, error handling, and perform final security/UX polish following the design system.

---

## Settings Page Design

### Page Container

```css
.settings-container {
  padding: 32px 48px
  max-width: 800px
  margin: 0 auto
}

.settings-header {
  margin-bottom: 48px

  h1 {
    font-size: var(--font-size-3xl)
    font-weight: var(--font-weight-semibold)
    color: var(--text-primary)
    margin-bottom: 8px
  }

  p {
    font-size: var(--font-size-base)
    color: var(--text-tertiary)
  }
}
```

---

## Settings Section Design

```css
.settings-section {
  background: var(--bg-elevated)
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-lg)
  padding: 24px
  margin-bottom: 24px
}

.section-header {
  font-size: var(--font-size-lg)
  font-weight: var(--font-weight-semibold)
  color: var(--text-primary)
  margin-bottom: 20px
  padding-bottom: 12px
  border-bottom: 1px solid var(--border-secondary)
}

.form-group {
  display: flex
  flex-direction: column
  gap: 8px
  margin-bottom: 20px

  &:last-child {
    margin-bottom: 0
  }
}

.form-label {
  font-size: 14px
  font-weight: var(--font-weight-medium)
  color: var(--text-secondary)
}

.form-help {
  font-size: 13px
  color: var(--text-tertiary)
  margin-top: 4px
}

/* Read-only field */
.form-input-readonly {
  height: 40px
  padding: 12px 16px
  background: var(--bg-tertiary)
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-sm)
  color: var(--text-quaternary)
  font-size: var(--font-size-base)
  cursor: not-allowed
}
```

---

## Work Hours Selector Design

```css
.time-range-group {
  display: flex
  gap: 16px
  align-items: center
}

.time-input-group {
  flex: 1
  display: flex
  flex-direction: column
  gap: 8px
}

.time-select {
  height: 40px
  padding: 0 12px
  background: var(--bg-primary)
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-sm)
  color: var(--text-primary)
  font-size: var(--font-size-base)
  font-family: var(--font-family-mono)
  cursor: pointer
  transition: all 150ms ease-out

  &:hover {
    border-color: var(--border-hover)
  }

  &:focus {
    border-color: var(--border-focus)
    outline: 2px solid var(--border-focus)
    outline-offset: 2px
  }
}

.time-separator {
  font-size: var(--font-size-lg)
  color: var(--text-tertiary)
  margin-top: 28px  /* Align with inputs */
}
```

---

## Visibility Radio Group Design

```css
.visibility-group {
  display: flex
  flex-direction: column
  gap: 12px
}

.radio-option {
  display: flex
  align-items: flex-start
  gap: 12px
  padding: 12px
  border-radius: var(--radius-sm)
  cursor: pointer
  transition: background 150ms ease-out

  &:hover {
    background: var(--bg-hover)
  }
}

.radio-input {
  margin-top: 2px
  width: 18px
  height: 18px
  accent-color: var(--orange-600)
  cursor: pointer
}

.radio-label-group {
  flex: 1
}

.radio-label {
  font-size: 14px
  font-weight: var(--font-weight-medium)
  color: var(--text-primary)
  cursor: pointer
  display: block
  margin-bottom: 4px
}

.radio-description {
  font-size: 13px
  color: var(--text-tertiary)
}
```

---

## Organization Section (Leader Only)

```css
.org-section {
  /* Only shown to leaders */
}

.invite-code-group {
  display: flex
  gap: 8px
  align-items: center
}

.invite-code-display {
  flex: 1
  height: 40px
  padding: 12px 16px
  background: var(--bg-secondary)
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-sm)
  font-family: var(--font-family-mono)
  font-size: var(--font-size-lg)
  font-weight: var(--font-weight-semibold)
  color: var(--orange-600)
  letter-spacing: 0.1em
}

.icon-button {
  width: 40px
  height: 40px
  display: flex
  align-items: center
  justify-content: center
  background: transparent
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-sm)
  color: var(--text-secondary)
  cursor: pointer
  transition: all 150ms ease-out

  svg {
    width: 18px
    height: 18px
  }

  &:hover {
    background: var(--bg-hover)
    border-color: var(--border-hover)
    color: var(--text-primary)
  }
}
```

---

## Member List Design

```css
.member-list {
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-md)
  overflow: hidden
  margin-top: 16px
}

.member-item {
  display: flex
  align-items: center
  gap: 12px
  padding: 12px 16px
  border-bottom: 1px solid var(--border-secondary)
  transition: background 150ms ease-out

  &:last-child {
    border-bottom: none
  }

  &:hover {
    background: var(--bg-hover)
  }
}

.member-avatar {
  width: 36px
  height: 36px
  border-radius: var(--radius-full)
  background: var(--orange-100)
  color: var(--orange-700)
  display: flex
  align-items: center
  justify-content: center
  font-size: 14px
  font-weight: var(--font-weight-semibold)
  flex-shrink: 0
}

.member-info {
  flex: 1
  min-width: 0

  .member-name {
    font-size: 14px
    font-weight: var(--font-weight-medium)
    color: var(--text-primary)
  }

  .member-email {
    font-size: 13px
    color: var(--text-tertiary)
  }
}

.member-role {
  display: inline-flex
  padding: 4px 8px
  background: var(--bg-secondary)
  border-radius: var(--radius-sm)
  font-size: 12px
  font-weight: var(--font-weight-medium)
  color: var(--text-secondary)
}

.member-actions {
  display: flex
  gap: 8px
}

.member-action-button {
  height: 32px
  padding: 6px 12px
  background: transparent
  border: 1px solid var(--border-primary)
  border-radius: var(--radius-sm)
  font-size: 13px
  color: var(--text-secondary)
  cursor: pointer
  transition: all 150ms ease-out

  &:hover {
    background: var(--bg-hover)
    border-color: var(--border-hover)
    color: var(--text-primary)
  }

  &.danger:hover {
    background: var(--error-bg)
    border-color: var(--error-border)
    color: var(--error-solid)
  }
}
```

---

## Danger Zone Design

```css
.danger-zone {
  background: var(--error-bg)
  border: 1px solid var(--error-border)
  border-radius: var(--radius-lg)
  padding: 24px
  margin-top: 48px
}

.danger-zone-header {
  font-size: var(--font-size-lg)
  font-weight: var(--font-weight-semibold)
  color: var(--error-solid)
  margin-bottom: 16px
}

.danger-zone-description {
  font-size: 14px
  color: var(--error-text)
  margin-bottom: 20px
}

.danger-actions {
  display: flex
  gap: 12px
}

.danger-button {
  height: 40px
  padding: 12px 20px
  background: transparent
  border: 1px solid var(--error-solid)
  border-radius: var(--radius-sm)
  color: var(--error-solid)
  font-size: 14px
  font-weight: var(--font-weight-semibold)
  cursor: pointer
  transition: all 150ms ease-out

  &:hover {
    background: var(--error-solid)
    color: white
  }
}
```

---

## Save Button (Footer)

```css
.settings-footer {
  position: sticky
  bottom: 0
  left: 0
  right: 0
  padding: 16px 48px
  background: var(--bg-elevated)
  border-top: 1px solid var(--border-primary)
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05)
  display: flex
  justify-content: flex-end
  gap: 12px
  z-index: 10
}

.save-button {
  height: 40px
  padding: 12px 24px
  background: var(--orange-600)
  color: white
  border: none
  border-radius: var(--radius-sm)
  font-size: 14px
  font-weight: var(--font-weight-semibold)
  cursor: pointer
  transition: all 150ms ease-out

  &:hover {
    background: var(--orange-700)
    box-shadow: var(--shadow-sm)
  }

  &:disabled {
    opacity: 0.5
    cursor: not-allowed
  }

  /* Loading state */
  &.loading {
    position: relative
    color: transparent

    &::after {
      content: ''
      position: absolute
      top: 50%
      left: 50%
      transform: translate(-50%, -50%)
      width: 16px
      height: 16px
      border: 2px solid white
      border-radius: 50%
      border-top-color: transparent
      animation: spin 600ms linear infinite
    }
  }
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg)
  }
}
```

---

## Loading States (Skeleton)

```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--bg-hover) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-sm);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Skeleton variants */
.skeleton-text {
  height: 16px;
  margin-bottom: 8px;
}

.skeleton-input {
  height: 40px;
  border-radius: var(--radius-sm);
}

.skeleton-button {
  height: 40px;
  width: 120px;
  border-radius: var(--radius-sm);
}

.skeleton-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
}
```

---

## Confirmation Dialog Design

```css
.confirm-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 200ms ease-out;
}

.confirm-dialog {
  max-width: 480px;
  width: 90%;
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  animation: scaleIn 200ms ease-out;
}

.confirm-dialog-header {
  padding: 24px 24px 16px;

  h3 {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
  }
}

.confirm-dialog-body {
  padding: 0 24px 24px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.confirm-dialog-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-primary);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.confirm-cancel {
  height: 40px;
  padding: 12px 20px;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 150ms ease-out;

  &:hover {
    background: var(--bg-hover);
    border-color: var(--border-hover);
  }
}

.confirm-action {
  height: 40px;
  padding: 12px 20px;
  background: var(--error-solid);
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 150ms ease-out;

  &:hover {
    background: var(--error-text);
    box-shadow: var(--shadow-sm);
  }
}
```

---

## Audit Log Viewer Design

```css
.audit-log-modal {
  max-width: 1000px;
}

.audit-log-table {
  width: 100%;
  font-size: 13px;
}

.audit-log-row {
  border-bottom: 1px solid var(--border-secondary);

  &:hover {
    background: var(--bg-hover);
  }
}

.audit-time {
  font-family: var(--font-family-mono);
  color: var(--text-tertiary);
  white-space: nowrap;
}

.audit-action {
  font-family: var(--font-family-mono);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.audit-details {
  font-family: var(--font-family-mono);
  color: var(--text-tertiary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.load-more-button {
  width: 100%;
  padding: 12px;
  margin-top: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 150ms ease-out;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
}
```

---

## Error Handling

### Global Error Boundary

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset
}: {
  error: Error;
  reset: () => void
}) {
  return (
    <div className="error-page">
      <div className="error-container">
        <h1>Something went wrong</h1>
        <p>{error.message}</p>
        <button onClick={reset}>Try again</button>
      </div>
    </div>
  );
}
```

```css
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.error-container {
  max-width: 480px;
  text-align: center;

  h1 {
    font-size: var(--font-size-3xl);
    color: var(--error-solid);
    margin-bottom: 16px;
  }

  p {
    font-size: var(--font-size-base);
    color: var(--text-secondary);
    margin-bottom: 24px;
  }

  button {
    height: 40px;
    padding: 12px 24px;
    background: var(--orange-600);
    color: white;
    border: none;
    border-radius: var(--radius-sm);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    cursor: pointer;
    transition: all 150ms ease-out;

    &:hover {
      background: var(--orange-700);
    }
  }
}
```

---

## Components

```
components/
├── settings/
│   ├── SettingsPage.tsx
│   ├── ProfileSection.tsx
│   ├── WorkHoursSection.tsx
│   ├── VisibilitySection.tsx
│   ├── OrgSection.tsx          # Leader only
│   ├── MemberList.tsx          # Leader only
│   ├── AuditLogModal.tsx       # Leader only
│   └── DangerZone.tsx
└── ui/
    ├── Skeleton.tsx
    ├── Toast.tsx
    ├── ConfirmDialog.tsx
    ├── LoadingSpinner.tsx
    └── ErrorBoundary.tsx
```

---

## Acceptance Checklist

- [ ] Settings page loads user's current preferences correctly
- [ ] Profile updates save and persist
- [ ] Work hours affect calendar display (dimmed outside hours)
- [ ] Default visibility applies to new tasks
- [ ] Split panel state persists across sessions
- [ ] Collapsed states persist correctly
- [ ] Leader can view audit logs with pagination
- [ ] Leader can manage org members (role changes, removal)
- [ ] Invite code can be copied with visual feedback
- [ ] Leave organization works with confirmation dialog
- [ ] Delete account works with double confirmation
- [ ] All loading states show skeletons
- [ ] All errors show friendly messages (not raw errors)
- [ ] Security headers configured in next.config
- [ ] RLS verified for all tables
- [ ] All forms have proper validation
- [ ] All buttons have loading states
- [ ] Typography follows design system
- [ ] All animations are smooth (200-250ms)
- [ ] Dark mode works correctly for all components
