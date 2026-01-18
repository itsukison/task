# Performance Guidelines

> Best practices and targets for maintaining optimal performance in TaskOS

---

## Bundle Size Budgets

| Route          | Target    | Critical Threshold | Notes                              |
|----------------|-----------|--------------------|------------------------------------|
| Landing page   | <150 KB   | 200 KB            | Three.js lazy loaded after fold    |
| Dashboard      | <200 KB   | 250 KB            | Includes calendar + task list      |
| Settings       | <100 KB   | 150 KB            | Minimal UI, form-heavy             |

**How to check:**
```bash
npm run build
# Check .next/static/chunks output
```

---

## Core Web Vitals Targets

| Metric                          | Target   | Good      | Needs Improvement |
|---------------------------------|----------|-----------|-------------------|
| **FCP** (First Contentful Paint) | <1.5s    | <1.8s     | >1.8s             |
| **LCP** (Largest Contentful Paint)| <2.5s   | <2.5s     | >2.5s             |
| **CLS** (Cumulative Layout Shift)| <0.1    | <0.1      | >0.1              |
| **FID** (First Input Delay)     | <100ms   | <100ms    | >100ms            |
| **TTI** (Time to Interactive)   | <3.5s    | <3.8s     | >3.8s             |

**How to measure:**
```bash
# Lighthouse in Chrome DevTools (Incognito mode)
# Or use CLI:
npx lighthouse https://your-site.com --view
```

---

## Optimization Strategies

### 1. Code Splitting & Lazy Loading

**Dynamic Imports for Heavy Libraries:**
```typescript
// ✅ Good - Three.js only loads when section is visible
const Dither = dynamic(() => import('./ditherbg'), {
  ssr: false,
  loading: () => <div className="h-full bg-[#050505]" />
});

// Use Intersection Observer for deferred loading
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        setShouldLoadComponent(true);
      }
    },
    { rootMargin: '200px' } // Load 200px before visible
  );
  // ...
}, []);
```

**Route-based Code Splitting:**
- Next.js automatically code-splits by route
- Add `loading.tsx` files for better UX during transitions

---

### 2. Image Optimization

**Always use `next/image`:**
```typescript
// ✅ Good
import Image from 'next/image';

<Image
  src="/capsule.png"
  alt="Visual"
  width={800}
  height={600}
  priority // For above-fold images
  quality={90}
  className="..."
/>

// ❌ Bad
<img src="/capsule.png" alt="Visual" />
```

**Benefits:**
- Automatic WebP/AVIF conversion
- Lazy loading by default
- Responsive sizing
- Prevents layout shift (CLS)

---

### 3. React Performance Optimization

**Memoization Pattern:**
```typescript
// Wrap expensive components in React.memo
const Calendar = React.memo(function Calendar({ tasks, ... }) {
  // Wrap callbacks in useCallback
  const getTaskStyle = useCallback((block, task) => {
    // ... calculation
  }, []); // Empty deps if pure function

  const handleDrop = useCallback((e, dateStr) => {
    // ... handler logic
  }, [dragPreview, tasks, onUpdateBlock]); // List all dependencies

  return (/* JSX */);
});
```

**When to use:**
- Components that re-render frequently (Calendar, TaskList)
- Event handlers passed to child components
- Expensive calculations (filters, sorts, style calculations)

**When NOT to use:**
- Simple components that rarely re-render
- Components with children (breaks prop equality)
- When dependencies change on every render anyway

---

### 4. Data Fetching

**Parallel over Sequential:**
```typescript
// ✅ Good - parallel fetching
const [profile, organizations] = await Promise.all([
  fetchProfile(userId),
  fetchOrganizations(userId)
]);

// ❌ Bad - sequential (2x slower)
const profile = await fetchProfile(userId);
const organizations = await fetchOrganizations(userId);
```

**Use Suspense boundaries:**
```typescript
// app/(dashboard)/workspace/page.tsx
export default function Page() {
  return (
    <Suspense fallback={<WorkspaceLoading />}>
      <WorkspaceContent />
    </Suspense>
  );
}
```

---

### 5. Component Architecture

**Extract sub-components from large files:**
- Improves code organization
- Enables targeted memoization
- Reduces re-render scope

**Example:** `calendar.tsx` (312 lines) → 5 files:
- `calendar.tsx` (200 lines) - main logic
- `calendar/CalendarHeader.tsx` - day headers
- `calendar/CalendarDayColumn.tsx` - day column with drag-drop
- `calendar/CalendarTimeColumn.tsx` - time labels
- `calendar/CalendarContextMenu.tsx` - context menu

---

## Performance Testing Process

### 1. Local Development
```bash
# Build production bundle
npm run build

# Analyze bundle size
npm run build -- --analyze # (if configured)

# Check for unused dependencies
npx depcheck
```

### 2. Lighthouse Audit
```bash
# Run Lighthouse CI
npx lighthouse https://your-staging-site.com \
  --preset=desktop \
  --output=html \
  --output-path=./lighthouse-report.html \
  --view

# Target scores (desktop):
# Performance: >90
# Accessibility: >95
# Best Practices: >95
# SEO: >90
```

### 3. React DevTools Profiler
1. Open React DevTools → Profiler tab
2. Click "Record" (⏺)
3. Interact with the app (drag tasks, change filters, etc.)
4. Stop recording
5. Look for:
   - Components rendering unnecessarily
   - Long render times (>16ms causes jank)
   - "Committed at" time spikes

**What to optimize:**
- Components with >5 renders per interaction
- Renders taking >100ms
- Entire tree re-rendering when only one component changed

---

## Monitoring & Alerts

### Bundle Size Monitoring
```json
// package.json
{
  "scripts": {
    "build:analyze": "ANALYZE=true next build",
    "size-limit": "size-limit"
  }
}
```

### Performance Regression Detection
- Run Lighthouse in CI/CD
- Fail build if:
  - Performance score drops >5 points
  - Bundle size increases >10%
  - FCP/LCP exceeds thresholds

---

## Common Anti-Patterns to Avoid

### ❌ Creating objects/arrays in render
```typescript
// Bad - new object on every render
<Component style={{ width: 100 }} />

// Good - stable reference
const style = { width: 100 };
<Component style={style} />
```

### ❌ Anonymous functions in props
```typescript
// Bad - new function on every render
<Button onClick={() => handleClick(id)} />

// Good - memoized callback
const handleButtonClick = useCallback(() => handleClick(id), [id]);
<Button onClick={handleButtonClick} />
```

### ❌ Missing dependencies in useCallback/useMemo
```typescript
// Bad - stale closure
const handler = useCallback(() => {
  console.log(count); // Always logs initial count
}, []); // Missing 'count' dependency

// Good
const handler = useCallback(() => {
  console.log(count);
}, [count]); // Includes dependency
```

### ❌ Overusing memoization
```typescript
// Bad - premature optimization
const SimpleButton = React.memo(({ label }) => (
  <button>{label}</button>
));

// Good - only for expensive or frequently re-rendered components
const ExpensiveCalendar = React.memo(Calendar);
```

---

## Performance Checklist

Before deploying new features:

- [ ] Bundle size within budget (check with `npm run build`)
- [ ] Images use `next/image` with proper dimensions
- [ ] Heavy libraries (Three.js, etc.) lazy loaded
- [ ] Event handlers memoized with useCallback
- [ ] Expensive components wrapped in React.memo
- [ ] Data fetching is parallel where possible
- [ ] Loading states implemented (loading.tsx files)
- [ ] Lighthouse score >90 (Performance)
- [ ] No unnecessary re-renders in React DevTools Profiler
- [ ] Core Web Vitals meet targets (FCP <1.5s, LCP <2.5s, CLS <0.1)

---

## Resources

- [Next.js Performance Docs](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance Optimization](https://react.dev/learn/render-and-commit#optimizing-performance)
- [Web.dev Core Web Vitals](https://web.dev/vitals/)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
