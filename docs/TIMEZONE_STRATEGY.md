# Timezone Handling Strategy

## Overview
This document describes how the TaskOS application handles date and time across different timezones. Consistent timezone handling is critical for calendar blocks, task scheduling, and cross-timezone collaboration.

---

## Storage Format

All dates and times stored in the Supabase database use **UTC timezone** with ISO 8601 format including the 'Z' suffix.

**Example:**
```
2026-02-05T15:00:00Z  (3:00 PM UTC)
```

**Database columns using UTC:**
- `calendar_blocks.start_time`
- `calendar_blocks.end_time`
- `tasks.scheduled_date` (date-only, no timezone)
- All `created_at`, `updated_at` timestamps

---

## Input Formats

### From Frontend to Backend

**Date-only fields** (e.g., `scheduled_date`):
```
"2026-02-05"  (YYYY-MM-DD, no timezone)
```

**DateTime fields** (e.g., calendar blocks):
```
"2026-02-05T15:00:00"  (Local time, NO 'Z' suffix)
```

⚠️ **Important:** When creating calendar blocks from the AI assistant, the `scheduledStartTime` field should be sent as **local time without timezone suffix**. The backend will interpret it as local time and convert to UTC for storage.

---

## Conversion Flow

### Creating a Calendar Block

1. **User Input:** User sees "February 5, 2026 3:00 PM" in their local timezone (e.g., PST, UTC-8)

2. **Frontend Sends:**
   ```json
   {
     "scheduledStartTime": "2026-02-05T15:00:00"
   }
   ```
   (No 'Z' - interpreted as local time)

3. **Backend Processing:**
   ```typescript
   const startTime = new Date("2026-02-05T15:00:00");
   // JavaScript interprets this as local time

   const isoString = startTime.toISOString();
   // Converts to UTC: "2026-02-05T23:00:00Z" (if user is in UTC-8)
   ```

4. **Database Storage:**
   ```sql
   start_time: "2026-02-05T23:00:00Z"  -- Stored in UTC
   ```

5. **Display to User:**
   ```typescript
   const startTime = new Date("2026-02-05T23:00:00Z");  // Parses UTC
   const localTime = startTime.toLocaleTimeString();     // Converts to local
   // Shows: "3:00 PM" in PST
   ```

---

## Key Files and Implementation

### Calendar Block Creation
**File:** `lib/ai/AIContextProvider.tsx` (lines 263-273)

```typescript
if (pendingAction.data.scheduledStartTime && newTask) {
    // Note: scheduledStartTime is expected in ISO 8601 format without timezone
    // (e.g., "2026-02-05T15:00:00"). It will be interpreted as local time,
    // then converted to UTC for database storage via toISOString().
    const startTime = new Date(pendingAction.data.scheduledStartTime);
    const durationMs = (pendingAction.data.durationMinutes ||
                       pendingAction.data.expectedTime ||
                       60) * 60000;
    const endTime = new Date(startTime.getTime() + durationMs);

    await supabase.from('calendar_blocks').insert({
        organization_id: currentOrganization.id,
        task_id: newTask.id,
        start_time: startTime.toISOString(),  // Converts to UTC
        end_time: endTime.toISOString(),      // Converts to UTC
    });
}
```

### AI Orchestrator Date Parsing
**File:** `lib/ai/agents/orchestrator.ts` (line 304)

The system prompt instructs the AI:
```
When users mention times, use their local timezone context.
Return ISO strings without 'Z' suffix for local interpretation.
```

### Workspace Date Formatting
**File:** `app/(dashboard)/workspace/page.tsx` (lines 17-22)

```typescript
const formatDateToLocalISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
```

---

## Display Formatting

### Calendar Times
```typescript
// Format for display in calendar blocks
const start = new Date(block.startTime);  // Parse UTC from DB
const display = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
});
// Shows time in user's local timezone
```

### Task Dates
```typescript
// Format scheduled dates
const date = new Date(task.scheduledDate);
const display = date.toLocaleDateString();
// Shows date in user's local timezone
```

---

## Best Practices

### ✅ DO

- **Store all times in UTC** in the database
- **Send local time without 'Z'** from frontend when creating calendar blocks
- **Use `toISOString()`** to convert to UTC before saving
- **Use `toLocaleTimeString()`** to display times to users
- **Trust JavaScript's automatic timezone handling** for Date objects

### ❌ DON'T

- **Don't store local times** in the database
- **Don't send 'Z' suffix** when you intend local time interpretation
- **Don't manually calculate timezone offsets** - use built-in Date methods
- **Don't assume the server and client are in the same timezone**

---

## Edge Cases

### Daylight Saving Time (DST)
JavaScript's `Date` object automatically handles DST transitions. No special code needed.

**Example:** A calendar block created at "2:00 PM" before DST will still display as "2:00 PM" after DST in the user's local time.

### Cross-Timezone Collaboration
Users in different timezones see the same calendar block at different local times:

| User Location | Database (UTC) | Display to User |
|---------------|----------------|-----------------|
| PST (UTC-8)   | 15:00:00Z      | 7:00 AM PST     |
| EST (UTC-5)   | 15:00:00Z      | 10:00 AM EST    |
| JST (UTC+9)   | 15:00:00Z      | 12:00 AM JST    |

### Midnight Boundaries
A task scheduled for "midnight" (00:00) local time will be stored as the UTC equivalent:
- PST: `2026-02-06T00:00:00` → `2026-02-06T08:00:00Z`
- May appear as "previous day" in UTC

---

## Testing Recommendations

### Manual Testing
1. **Create calendar block** at a specific local time
2. **Check database** - should be stored in UTC (with 'Z')
3. **Refresh page** - time should display correctly in local time
4. **Change system timezone** - time should adjust automatically

### Automated Testing
```typescript
describe('Timezone handling', () => {
    it('converts local time to UTC for storage', () => {
        const localTime = new Date('2026-02-05T15:00:00');
        const utc = localTime.toISOString();
        expect(utc).toMatch(/Z$/);  // Ends with 'Z'
    });

    it('displays UTC times in local timezone', () => {
        const utcTime = new Date('2026-02-05T23:00:00Z');
        const local = utcTime.toLocaleTimeString();
        // Assertions depend on test environment timezone
    });
});
```

---

## Migration Notes

If migrating existing data:
1. Identify all timestamp columns
2. Ensure they're stored in UTC (with 'Z' suffix)
3. Update frontend to remove any manual timezone calculations
4. Test cross-timezone scenarios thoroughly

---

## References

- [ISO 8601 Standard](https://en.wikipedia.org/wiki/ISO_8601)
- [JavaScript Date.toISOString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
- [JavaScript Date.toLocaleTimeString()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toLocaleTimeString)
- [Supabase Timestamp Types](https://supabase.com/docs/guides/database/tables#data-types)

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-02-05 | Initial timezone strategy documentation | Claude Code |
