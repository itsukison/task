# TaskOS Design System

**Version:** 1.0
**Design Philosophy:** Swiss minimalism inspired by Notion
**Aesthetic:** Clean, premium, execution-focused

---

## Design Principles

1. **Functional Minimalism**: Every element serves a purpose. No decoration for decoration's sake.
2. **Generous Whitespace**: Let content breathe. Space creates hierarchy and reduces cognitive load.
3. **Typography-First**: Clear hierarchy through type scale, weight, and spacing rather than color.
4. **Subtle Depth**: Use shadows and borders sparingly. Prefer subtle elevation over dramatic effects.
5. **Execution-Focused**: UI should never compete with content. The work is the hero.

---

## Color System

### Philosophy
Wide range of grays (10+ shades) for nuanced hierarchy. Orange accent used sparingly for primary actions and focus states. Both light and dark modes with careful attention to contrast ratios.

### Light Mode

#### Backgrounds
```
--bg-primary:           #FFFFFF     /* Main canvas */
--bg-secondary:         #FAFAFA     /* Subtle contrast areas */
--bg-tertiary:          #F5F5F5     /* Hover states, table headers */
--bg-elevated:          #FFFFFF     /* Modals, popovers (with shadow) */
--bg-hover:             #F5F5F5     /* Interactive element hover */
--bg-active:            #F0F0F0     /* Interactive element active/pressed */
```

#### Foregrounds (Text)
```
--text-primary:         #171717     /* Headings, primary content */
--text-secondary:       #525252     /* Body text, descriptions */
--text-tertiary:        #A3A3A3     /* Muted text, placeholders */
--text-quaternary:      #D4D4D4     /* Disabled text, subtle labels */
```

#### Borders & Dividers
```
--border-primary:       #E5E5E5     /* Default borders, dividers */
--border-secondary:     #F0F0F0     /* Subtle dividers, table rows */
--border-hover:         #D4D4D4     /* Border on hover */
--border-focus:         #EA580C     /* Focus rings (orange) */
```

### Dark Mode

#### Backgrounds
```
--bg-primary:           #0A0A0A     /* Main canvas */
--bg-secondary:         #141414     /* Subtle contrast areas */
--bg-tertiary:          #1A1A1A     /* Hover states, table headers */
--bg-elevated:          #1F1F1F     /* Modals, popovers (with shadow) */
--bg-hover:             #1F1F1F     /* Interactive element hover */
--bg-active:            #262626     /* Interactive element active/pressed */
```

#### Foregrounds (Text)
```
--text-primary:         #EDEDED     /* Headings, primary content */
--text-secondary:       #A3A3A3     /* Body text, descriptions */
--text-tertiary:        #737373     /* Muted text, placeholders */
--text-quaternary:      #525252     /* Disabled text, subtle labels */
```

#### Borders & Dividers
```
--border-primary:       #262626     /* Default borders, dividers */
--border-secondary:     #1A1A1A     /* Subtle dividers, table rows */
--border-hover:         #404040     /* Border on hover */
--border-focus:         #EA580C     /* Focus rings (orange) */
```

### Accent Color (Orange)

Primary brand color inspired by Claude. Used sparingly for:
- Primary action buttons
- Links
- Active/selected states
- Focus indicators
- Progress indicators

```
--orange-50:            #FFF7ED     /* Light: subtle backgrounds */
--orange-100:           #FFEDD5     /* Light: hover backgrounds */
--orange-200:           #FED7AA     /* Light borders */
--orange-300:           #FDBA74     /* */
--orange-400:           #FB923C     /* */
--orange-500:           #F97316     /* Secondary buttons */
--orange-600:           #EA580C     /* PRIMARY - Main accent color */
--orange-700:           #C2410C     /* Hover states on orange */
--orange-800:           #9A3412     /* Active/pressed states */
--orange-900:           #7C2D12     /* Dark: text on light orange bg */
```

**Primary Usage:**
- Buttons: `bg-orange-600` with `hover:bg-orange-700`
- Links: `text-orange-600` with `hover:text-orange-700`
- Focus rings: `ring-orange-600`

### Semantic Colors

#### Success (Green)
For completed tasks, success states, confirmations.

```
Light Mode:
--success-bg:           #DCFCE7     /* Background */
--success-border:       #86EFAC     /* Border */
--success-text:         #166534     /* Text on light bg */
--success-solid:        #16A34A     /* Solid backgrounds */

Dark Mode:
--success-bg:           #14532D     /* Background */
--success-border:       #166534     /* Border */
--success-text:         #86EFAC     /* Text on dark bg */
--success-solid:        #22C55E     /* Solid backgrounds */
```

#### Warning (Amber/Yellow)
For medium priority, pending states, caution.

```
Light Mode:
--warning-bg:           #FEF3C7     /* Background */
--warning-border:       #FCD34D     /* Border */
--warning-text:         #92400E     /* Text on light bg */
--warning-solid:        #F59E0B     /* Solid backgrounds */

Dark Mode:
--warning-bg:           #78350F     /* Background */
--warning-border:       #92400E     /* Border */
--warning-text:         #FCD34D     /* Text on dark bg */
--warning-solid:        #FBBF24     /* Solid backgrounds */
```

#### Error (Red)
For high priority, errors, destructive actions, overrun tasks.

```
Light Mode:
--error-bg:             #FEE2E2     /* Background */
--error-border:         #FCA5A5     /* Border */
--error-text:           #991B1B     /* Text on light bg */
--error-solid:          #DC2626     /* Solid backgrounds */

Dark Mode:
--error-bg:             #7F1D1D     /* Background */
--error-border:         #991B1B     /* Border */
--error-text:           #FCA5A5     /* Text on dark bg */
--error-solid:          #EF4444     /* Solid backgrounds */
```

#### Info (Blue)
For informational states, in-progress tasks, neutral highlights.

```
Light Mode:
--info-bg:              #DBEAFE     /* Background */
--info-border:          #93C5FD     /* Border */
--info-text:            #1E40AF     /* Text on light bg */
--info-solid:           #3B82F6     /* Solid backgrounds */

Dark Mode:
--info-bg:              #1E3A8A     /* Background */
--info-border:          #1E40AF     /* Border */
--info-text:            #93C5FD     /* Text on dark bg */
--info-solid:           #60A5FA     /* Solid backgrounds */
```

### Task Status Colors

Specific colors for task states in the calendar and task views.

```
Planned:        Gray/Neutral    (--text-tertiary, --bg-tertiary)
In Progress:    Blue            (--info-solid, --info-bg)
Completed:      Green           (--success-solid, --success-bg)
Overrun:        Red             (--error-solid, --error-bg)
```

---

## Typography

### Font Families

```
--font-sans:    'Geist Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
--font-mono:    'Geist Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace
```

### Type Scale

Based on modular scale with 1.125 ratio (major second) for harmony.

```css
/* Display - Page titles, hero sections */
--text-5xl:     48px / 56px     font-weight: 600    letter-spacing: -0.02em
--text-4xl:     40px / 48px     font-weight: 600    letter-spacing: -0.02em

/* Headings */
--text-3xl:     32px / 40px     font-weight: 600    letter-spacing: -0.01em
--text-2xl:     24px / 32px     font-weight: 600    letter-spacing: -0.01em
--text-xl:      20px / 28px     font-weight: 600    letter-spacing: 0
--text-lg:      18px / 28px     font-weight: 600    letter-spacing: 0

/* Body */
--text-base:    15px / 24px     font-weight: 400    letter-spacing: 0        /* Primary body */
--text-sm:      14px / 20px     font-weight: 400    letter-spacing: 0        /* Secondary text */
--text-xs:      12px / 16px     font-weight: 400    letter-spacing: 0        /* Labels, captions */

/* Mono (code, time, metrics) */
--text-mono-sm: 13px / 20px     font-weight: 400    letter-spacing: 0
```

### Font Weights

```
--font-normal:      400     /* Body text, descriptions */
--font-medium:      500     /* Emphasis, semi-bold labels */
--font-semibold:    600     /* Headings, buttons, table headers */
--font-bold:        700     /* Strong emphasis (rare) */
```

### Usage Guidelines

- **Headings**: Always semibold (600), use size for hierarchy
- **Body text**: Normal weight (400), 15px for optimal readability
- **Labels**: Medium weight (500) at 14px or 12px
- **Buttons**: Semibold (600) at 14px
- **Table headers**: Medium or semibold (500-600) at 12px
- **Monospace**: Use for time values, durations, numeric metrics

---

## Spacing System

Based on 4px base unit. Use 8px (0.5rem) as the smallest common spacing.

```
--space-0:      0px
--space-1:      4px       /* Tight spacing (icon-text gaps) */
--space-2:      8px       /* Small gaps (form field internal padding) */
--space-3:      12px      /* Default gaps (button padding) */
--space-4:      16px      /* Medium spacing (card padding, section gaps) */
--space-5:      20px      /* */
--space-6:      24px      /* Large spacing (section headers) */
--space-8:      32px      /* Extra large (page sections) */
--space-10:     40px      /* */
--space-12:     48px      /* Major sections */
--space-16:     64px      /* Page-level spacing */
--space-20:     80px      /* Hero sections */
```

### Layout Guidelines

- **Page padding**: 24px (mobile) to 48px (desktop)
- **Card padding**: 16px to 24px
- **Form field padding**: 12px vertical, 16px horizontal
- **Button padding**: 12px vertical, 20px horizontal (base size)
- **Section gaps**: 32px to 48px
- **Table row height**: 40px to 48px
- **Modal padding**: 24px to 32px

---

## Shadows & Elevation

Subtle shadows for depth. Avoid heavy drop shadows.

### Light Mode

```css
--shadow-none:      none
--shadow-xs:        0 1px 2px 0 rgba(0, 0, 0, 0.05)                    /* Subtle lift */
--shadow-sm:        0 1px 3px 0 rgba(0, 0, 0, 0.1),
                    0 1px 2px -1px rgba(0, 0, 0, 0.1)                  /* Buttons, dropdowns */
--shadow-md:        0 4px 6px -1px rgba(0, 0, 0, 0.1),
                    0 2px 4px -2px rgba(0, 0, 0, 0.1)                  /* Cards, popovers */
--shadow-lg:        0 10px 15px -3px rgba(0, 0, 0, 0.1),
                    0 4px 6px -4px rgba(0, 0, 0, 0.1)                  /* Modals */
--shadow-xl:        0 20px 25px -5px rgba(0, 0, 0, 0.1),
                    0 8px 10px -6px rgba(0, 0, 0, 0.1)                 /* Large modals */
```

### Dark Mode

```css
--shadow-xs:        0 1px 2px 0 rgba(0, 0, 0, 0.3)
--shadow-sm:        0 1px 3px 0 rgba(0, 0, 0, 0.4),
                    0 1px 2px -1px rgba(0, 0, 0, 0.4)
--shadow-md:        0 4px 6px -1px rgba(0, 0, 0, 0.5),
                    0 2px 4px -2px rgba(0, 0, 0, 0.5)
--shadow-lg:        0 10px 15px -3px rgba(0, 0, 0, 0.6),
                    0 4px 6px -4px rgba(0, 0, 0, 0.6)
--shadow-xl:        0 20px 25px -5px rgba(0, 0, 0, 0.7),
                    0 8px 10px -6px rgba(0, 0, 0, 0.7)
```

### Usage

- **Buttons**: shadow-sm on hover
- **Dropdowns/Popovers**: shadow-md
- **Modals**: shadow-lg to shadow-xl
- **Cards**: shadow-xs (subtle) or shadow-sm
- **Elevated panels**: shadow-md

---

## Border Radius

Subtle, modern radii. Avoid pill shapes except for badges.

```
--radius-none:      0px
--radius-sm:        4px       /* Buttons, inputs, small UI */
--radius-md:        6px       /* Cards, larger buttons */
--radius-lg:        8px       /* Modals, panels */
--radius-xl:        12px      /* Large cards, hero sections */
--radius-full:      9999px    /* Avatars, badges, pills */
```

---

## Component Specifications

### Buttons

#### Primary (Orange)
The main call-to-action. Use sparingly.

```
Size: height 40px (base), padding 12px 20px
Background: orange-600
Text: white, 14px, semibold (600)
Border radius: 4px
Hover: orange-700, shadow-sm
Active: orange-800
Focus: ring-2 ring-orange-600 ring-offset-2
Disabled: opacity-50, cursor-not-allowed
```

#### Secondary (Ghost)
Subtle, less prominent actions.

```
Size: height 40px, padding 12px 20px
Background: transparent
Text: text-secondary, 14px, semibold
Border: 1px solid border-primary
Border radius: 4px
Hover: bg-hover, border-hover
Active: bg-active
Focus: ring-2 ring-orange-600 ring-offset-2
```

#### Tertiary (Text-only)
Minimal, inline actions.

```
Size: padding 8px 12px
Background: transparent
Text: orange-600, 14px, medium (500)
Hover: bg-orange-50 (light) / bg-orange-950/10 (dark)
Active: bg-orange-100 (light) / bg-orange-950/20 (dark)
```

#### Sizes

```
Small:      height 32px, padding 8px 16px, text 13px
Base:       height 40px, padding 12px 20px, text 14px
Large:      height 48px, padding 16px 24px, text 15px
```

### Inputs & Form Fields

#### Text Input

```
Size: height 40px, padding 12px 16px
Background: bg-primary
Border: 1px solid border-primary
Border radius: 4px
Text: text-primary, 15px
Placeholder: text-tertiary, 15px

States:
  Hover: border-hover
  Focus: ring-2 ring-orange-600, border-orange-600
  Error: border-error-solid, ring-error-solid
  Disabled: bg-tertiary, text-quaternary, cursor-not-allowed
```

#### Labels

```
Text: text-secondary, 14px, medium (500)
Margin bottom: 8px
Required indicator: orange-600, " *"
```

#### Helper Text

```
Text: text-tertiary, 13px
Margin top: 6px
Error text: error-text, 13px
```

### Table

Inspired by Notion's clean table design.

#### Structure

```
Container: bg-primary, border border-primary, radius-md
Header row: bg-tertiary, border-b border-primary
Header cell: text-secondary, 12px, semibold (600), padding 12px 16px, text-left
Body row: border-b border-secondary, hover:bg-hover, transition-colors
Body cell: text-primary, 14px, padding 12px 16px
Zebra striping: Optional, use bg-secondary on odd rows (subtle)
```

#### Row Height

```
Compact:    40px    /* Dense data tables */
Base:       48px    /* Default */
Relaxed:    56px    /* More breathing room */
```

#### Column Alignments

```
Text columns: left-aligned
Numeric columns: right-aligned
Centered: Icons, checkboxes, badges
```

### Badges & Pills

Small status indicators.

#### Pill Badge (Status)

```
Size: inline-flex, padding 4px 10px, height 24px
Background: Semantic color bg (e.g., info-bg for "In Progress")
Text: Semantic color text, 12px, medium (500)
Border: Optional 1px solid semantic border
Border radius: full (pill shape)

Examples:
  In Progress:  bg-info-bg, text-info-text, border-info-border
  Completed:    bg-success-bg, text-success-text
  Overrun:      bg-error-bg, text-error-text
  Not Started:  bg-tertiary, text-secondary
```

#### Dot Indicator

Minimal status indicator, just a colored dot.

```
Size: 6px or 8px diameter circle
Colors: Match semantic colors
Usage: Inline with text, calendar events
```

### Modals

Full-screen overlay with centered content panel.

#### Structure

```
Overlay: fixed inset-0, bg-black/50 (light) or bg-black/80 (dark), backdrop-blur-sm
Panel: max-width 640px (base) or 800px (large), bg-elevated, shadow-xl, radius-lg
Padding: 32px
Header: text-2xl, semibold, margin-bottom 24px
Content: text-base, text-secondary
Footer: margin-top 32px, flex justify-end, gap 12px (for buttons)
```

#### Animation

```
Enter: fade in overlay + scale up panel (from 95% to 100%)
Exit: fade out overlay + scale down panel
Duration: 200ms, ease-out
```

#### Header Actions

```
Close button: top-right corner, 32px x 32px, text-tertiary
Icon: X or close icon, 20px
Hover: bg-hover, text-primary
```

### Cards

Contained content blocks.

```
Background: bg-elevated (with shadow-sm) or bg-secondary
Border: Optional 1px border-primary
Border radius: radius-md (6px) to radius-lg (8px)
Padding: 16px (small) to 24px (base)
Shadow: shadow-xs to shadow-sm
Hover: Optional shadow-md, transition-shadow
```

### Sidebar (Hamburger Navigation)

Notion-style collapsible sidebar.

#### Closed State

```
Width: 0px (zero width, fully collapsed)
Trigger: Hamburger icon (≡) in top-left, 40px x 40px, position fixed
Icon: 24px, text-secondary
Hover: bg-hover, text-primary
```

#### Open State

```
Width: 280px
Background: bg-secondary
Border right: 1px border-primary
Shadow: shadow-md (optional)
Padding: 16px
Animation: slide in from left, 250ms ease-out
```

#### Sidebar Content

```
Section header: text-xs, uppercase, semibold, text-tertiary, margin-bottom 8px, letter-spacing 0.05em
Nav item: padding 8px 12px, radius-sm, text-base, text-primary
Nav item hover: bg-hover
Nav item active: bg-orange-600, text-white
Icon + text: gap 12px, icon 20px
```

### Divider (Draggable Split View)

Vertical divider between task and calendar views.

#### Structure

```
Width: 1px (base) or 4px (when hovering for drag handle)
Background: border-primary
Hover: bg-orange-600/20, cursor-col-resize
Active (dragging): bg-orange-600, cursor-col-resize
```

#### Hover Actions

On hover, show close buttons:

```
Close-left button: position absolute, left side, 24px x 24px, bg-hover, radius-sm
Close-right button: position absolute, right side, 24px x 24px, bg-hover, radius-sm
Icons: ChevronLeft / ChevronRight, 16px
```

#### Collapsed State

When one side is collapsed:

```
Restore button: Fixed position in corner, 32px x 32px, bg-tertiary, shadow-sm, radius-md
Icon: ChevronRight (if left collapsed) or ChevronLeft (if right collapsed)
Hover: bg-hover, shadow-md
```

### Calendar Components

#### Week Grid (Vertical Time-Based)

```
Container: border border-primary, radius-md, bg-primary
Header row: Days of week, text-sm, semibold, text-secondary, padding 12px
Time axis (Y): Text-xs, mono, text-tertiary, right-aligned, width 60px
Grid lines: border-secondary, 1px, every hour or 30min
Cell hover: bg-hover
```

#### Calendar Task Block

Task blocks placed on calendar with height = duration.

```
Background: Semantic color based on status (info-bg, success-bg, error-bg)
Border left: 3px solid semantic color
Padding: 8px
Text: task name, 13px, semibold, text-primary
Subtext: time range, 11px, mono, text-secondary
Border radius: radius-sm (4px)
Hover: shadow-sm, slightly darker bg, cursor-pointer
Drag handle: cursor-move when hovering near edges
```

#### Month Grid (Optional)

```
Container: border border-primary, radius-md
Header: Month name + year, text-lg, semibold
Day headers: Sun-Sat, text-xs, text-tertiary, uppercase
Grid cells: aspect-square or min-height 100px, border border-secondary
Current day: bg-orange-50 (light) or bg-orange-950/20 (dark), text-orange-600, font-semibold
Other month days: text-quaternary
Event items: truncated text, dot indicator, text-xs
```

### Dropdowns & Popovers

```
Container: bg-elevated, shadow-md, radius-md, border border-primary
Padding: 8px
Menu item: padding 8px 12px, radius-sm, text-sm, text-primary
Menu item hover: bg-hover
Menu item active: bg-orange-600, text-white
Divider: border-t border-secondary, margin 8px 0
```

### Toast Notifications

```
Container: fixed bottom-right, max-width 400px, bg-elevated, shadow-lg, radius-md, border-l-4
Border colors: success-solid, error-solid, warning-solid, info-solid
Padding: 16px
Icon: 20px, semantic color
Title: text-base, semibold, text-primary
Message: text-sm, text-secondary, margin-top 4px
Close button: top-right, 20px x 20px, text-tertiary
Animation: slide in from right + fade in, 300ms
```

---

## Iconography

### Style

- **Line icons** preferred over filled
- **Stroke width**: 1.5px to 2px
- **Size**: 16px, 20px, 24px (most common)
- **Color**: Inherit from parent text color
- **Sources**: Heroicons, Lucide, or Phosphor Icons

### Common Icons

```
Hamburger menu:     ≡ (three horizontal lines)
Close:              X or ×
Add:                + or plus icon
Calendar:           Calendar outline
Task:               CheckSquare or List
User:               User circle or avatar
Settings:           Gear or sliders
Chevrons:           < > for navigation
Arrow:              → for CTAs, links
Drag handle:        ⋮⋮ (six dots) or ☰ (handle bars)
Timer:              Clock or stopwatch
Status dot:         • (filled circle)
```

---

## Animation & Transitions

Subtle, fast animations. Avoid distracting motion.

### Timing

```
Fast:       100ms - 150ms      /* Hover states, highlights */
Base:       200ms - 250ms      /* Modals, dropdowns, page transitions */
Slow:       300ms - 400ms      /* Complex animations, large movements */
```

### Easing

```
ease-out:       Preferred for entering elements (0, 0, 0.2, 1)
ease-in:        For exiting elements (0.4, 0, 1, 1)
ease-in-out:    For smooth both-way transitions (0.4, 0, 0.2, 1)
```

### Common Transitions

```
color, background-color, border-color:  150ms ease-out
opacity:                                200ms ease-out
transform (scale, translate):           200ms ease-out
box-shadow:                             200ms ease-out
height, width (layout):                 250ms ease-in-out (use sparingly)
```

### Hover States

Always add subtle feedback:
- Background color change
- Border color change
- Shadow increase
- Slight scale (1.02 or 1.05 max)
- Never more than 2 properties changing at once

---

## Accessibility

### Contrast Ratios

All text must meet WCAG 2.1 AA standards:

```
Normal text (< 18px):       4.5:1 minimum
Large text (≥ 18px):        3:1 minimum
UI components & icons:      3:1 minimum
```

### Focus States

All interactive elements must have visible focus indicators:

```
Focus ring: 2px solid orange-600, offset 2px
Never: outline: none without alternative focus style
Keyboard navigation: Ensure logical tab order
```

### Interactive Targets

Minimum touch target size:

```
Buttons, links, icons:      40px x 40px minimum (mobile)
Clickable table rows:       40px height minimum
Form inputs:                40px height minimum
```

### Screen Reader Support

- Semantic HTML (button, nav, main, aside, etc.)
- ARIA labels for icon-only buttons
- ARIA live regions for dynamic content (toasts, notifications)
- Skip to main content link

### Keyboard Navigation

- Full keyboard support for all interactions
- ESC to close modals, dropdowns
- Arrow keys for menu navigation
- Enter/Space to activate buttons
- Tab order follows visual flow

---

## Responsive Breakpoints

Mobile-first approach.

```
sm:     640px       /* Small tablets, large phones landscape */
md:     768px       /* Tablets */
lg:     1024px      /* Laptops, small desktops */
xl:     1280px      /* Desktops */
2xl:    1536px      /* Large desktops */
```

### Layout Adaptations

```
Mobile (< 768px):
  - Sidebar: Full-screen overlay when open
  - Split view: Stack vertically or tabs
  - Table: Horizontal scroll or card view
  - Padding: 16px to 24px

Tablet (768px - 1024px):
  - Sidebar: 240px width
  - Split view: 50/50 or collapsible
  - Padding: 24px to 32px

Desktop (> 1024px):
  - Sidebar: 280px width
  - Split view: Draggable divider, 40/60 or 50/50
  - Maximum content width: 1400px to 1600px
  - Padding: 32px to 48px
```

---

## Design Tokens Summary

### Tailwind CSS Configuration

The design system maps directly to Tailwind CSS v4 with custom theme tokens:

```css
@theme {
  /* Colors */
  --color-orange-*: /* Orange scale 50-900 */
  --color-gray-*:   /* Neutral gray scale 50-950 */

  /* Spacing uses default Tailwind scale (4px base) */

  /* Typography */
  --font-family-sans: 'Geist Sans', sans-serif;
  --font-family-mono: 'Geist Mono', monospace;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* Shadows - see shadow definitions above */
}
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Set up Tailwind config with custom orange and gray scales
- [ ] Define CSS custom properties for light/dark mode
- [ ] Configure Geist fonts
- [ ] Create base typography styles
- [ ] Set up spacing and layout utilities

### Phase 2: Core Components
- [ ] Button variants (primary, secondary, tertiary)
- [ ] Input fields and form elements
- [ ] Table component with row states
- [ ] Badge/pill status indicators
- [ ] Modal component with overlay

### Phase 3: Layout Components
- [ ] Hamburger sidebar with collapse/expand
- [ ] Draggable divider for split view
- [ ] Responsive container and grid system
- [ ] Card component

### Phase 4: Advanced Components
- [ ] Calendar grid (week view, month view)
- [ ] Calendar task blocks with drag-drop
- [ ] Dropdown menus and popovers
- [ ] Toast notifications
- [ ] Loading states and skeletons

### Phase 5: Refinement
- [ ] Dark mode polish
- [ ] Animation and transition refinement
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Responsive behavior testing
- [ ] Performance optimization (CSS bundle size)

---

## References

**Inspiration:**
- Notion (primary reference for layout, tables, modals, sidebar)
- Linear (clean minimalism, subtle interactions)
- Stripe Dashboard (premium feel, restrained color)
- Apple Human Interface Guidelines (clarity, depth, deference)

**Design Systems:**
- Tailwind CSS v4 (utility framework)
- Radix UI (unstyled primitives for accessibility)
- Headless UI (accessible components)

**Typography:**
- Vercel Geist Font Family
- Swiss Design Typography Principles
- Modular Scale (1.125 ratio)

---

**End of Design System**

This document should be treated as the single source of truth for all design decisions in the TaskOS application. Consistency is key to achieving the premium, minimal aesthetic we're aiming for.
