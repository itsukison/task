# Design Guidelines

> Maintain consistency with the clean, minimal, Notion-style aesthetic.

---

## Design Philosophy

- **Minimalism**: Spacious layouts with ample whitespace
- **Subtle hierarchy**: Typography and color over aggressive contrast  
- **Muted palette**: Warm grays, neutral tones, orange accent
- **Understated interactions**: Smooth, refined transitions

---

## Color Palette

### Text
- `#37352F` - Headings, titles, labels
- `#5F5E5B` - Body text, list items
- `#787774` - Descriptions, metadata
- `#9B9A97` - Placeholders, disabled states

### Backgrounds
- `#FFFFFF` - Page background
- `#F7F7F5` - Sidebar, panels
- `#EFEFED` - Hover state
- `#FAFAFA` - Nested sections

### Borders
- `#E9E9E7` - Default
- `#C8C7C5` - Hover
- `#2383E2` - Focus

### Accent
- `#FF5500` - Primary (CTAs, active states)
- `#FF7F3D` - Hover
- `#F97316` - Toggle active

### Semantic
- `#EB5757` - Error/alert
- Green (`bg-green-100`, `text-green-700`) - Success
- Orange (`bg-orange-100`, `text-orange-700`) - Warning

---

## Typography

**Font**: Geist Sans (`var(--font-geist-sans)`)

**Sizes**: `text-4xl` (titles), `text-3xl` (page headers), `text-xl` (sections), `text-sm` (UI), `text-xs` (metadata)

**Weights**: `font-bold` (titles), `font-semibold` (headers), `font-medium` (selected/active), regular (default)

---

## Spacing

**Padding**: `p-1.5` (icons), `px-2 py-1` (badges), `px-3 py-2` (buttons), `px-8 py-12` (pages)

**Gaps**: `gap-1` (tight), `gap-2` (standard), `gap-4` (sections), `gap-8` (major)

**Max Width**: `max-w-xl` (settings), `max-w-4xl` (modals)

---

## Components

### Buttons
**Ref**: `components/settings/SettingsForm.tsx`, `components/sidebar.tsx`

```tsx
// Primary
"px-4 py-2 bg-white border border-[#E9E9E7] rounded-lg text-sm font-medium text-[#37352F] hover:bg-[#F7F7F5] transition-colors"

// Compact
"px-2 py-1 text-xs font-medium bg-white border border-[#E9E9E7] rounded-md hover:bg-gray-50"

// Icon
"p-1.5 hover:bg-gray-100 rounded text-gray-500 transition-colors"
```

### Inputs
**Ref**: `components/ui/settings-primitives.tsx`, `components/task-modal.tsx`

```tsx
// Text
"px-2 py-1 text-sm text-[#37352F] bg-transparent border border-[#E9E9E7] rounded hover:border-[#C8C7C5] focus:border-[#2383E2] focus:outline-none"

// Textarea
"w-full min-h-[200px] resize-none outline-none text-[#37352F] leading-relaxed placeholder-gray-300 bg-transparent"
```

### Dropdowns
**Ref**: `components/ui/settings-primitives.tsx`, `components/calendar/MemberSelector.tsx`

```tsx
// Trigger
"flex items-center gap-1 px-2 py-1 text-sm text-[#5F5E5B] hover:bg-[#EFEFED] rounded"

// Container
"absolute top-full mt-1 bg-white border border-[#E9E9E7] rounded-lg shadow-lg py-1 min-w-[140px] z-20"

// Item
"w-full px-3 py-1.5 text-sm hover:bg-[#EFEFED] transition-colors"
// Selected: text-[#37352F] font-medium
// Unselected: text-[#5F5E5B]
```

### Member Selector
**Ref**: `components/calendar/MemberSelector.tsx`

```tsx
// Avatar
"w-6 h-6 rounded-full bg-[#f0f0f0] text-[#37352f] flex items-center justify-center text-[10px] font-medium border border-[#e0e0e0]"

// Row
"px-2 py-1.5 rounded-sm flex items-center gap-2 cursor-pointer hover:bg-gray-100"

// Checkmark (selected)
<path d="M10 3L4.5 8.5L2 6" stroke="#FF5500" strokeWidth="1.5" />
```

### Toggle Switch
**Ref**: `components/ui/settings-primitives.tsx`

```tsx
// Container: "relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
// Active: bg-[#F97316], Inactive: bg-[#DCDCDC]
// Knob: "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
// Active: translate-x-[22px], Inactive: translate-x-[2px]
```

### Badges
**Ref**: `components/settings/SettingsForm.tsx`, `components/sidebar.tsx`

```tsx
// Role: "px-2 py-0.5 text-xs font-medium rounded bg-accent/10 text-accent"
// Status: bg-gray-100 text-gray-600 (planned), bg-orange-100 text-orange-700 (in progress)
// Notification: "h-5 min-w-[20px] px-1.5 rounded-full bg-[#EB5757] text-[10px] font-bold text-white"
// New: "px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold"
```

### Modals
**Ref**: `components/task-modal.tsx`

```tsx
// Overlay: "fixed inset-0 bg-black/40 z-[100] flex items-center justify-center backdrop-blur-[2px]"
// Container: "bg-white max-w-4xl h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in"
// Breadcrumb: "px-12 pt-10 pb-2 text-xs text-[#9B9A97] flex items-center gap-1.5"
```

### Sidebar & Navigation
**Ref**: `components/sidebar.tsx`

```tsx
// Container: "h-screen bg-[#F7F7F5] border-r border-[#E9E9E7] flex flex-col w-[270px]"
// Nav item (default): "flex items-center gap-2.5 px-3 py-1 text-sm rounded-md text-[#5F5E5B] hover:bg-[#EFEFED]"
// Nav item (active): "bg-[#EFEFED] text-[#37352F] font-medium"
// Avatar: "w-5 h-5 bg-accent rounded text-white flex items-center justify-center text-[10px] font-bold"
```

### Sections
**Ref**: `components/ui/settings-primitives.tsx`

```tsx
// Header: "text-base font-semibold text-[#37352F] pb-2 border-b border-[#E9E9E7]"
// Row: "flex items-center justify-between py-3"
// Divider: "h-px bg-[#E9E9E7] w-full"
```

---

## Interactions

**Transitions**: `transition-colors`, `duration-200/300`, `ease-[cubic-bezier(0.25,1,0.5,1)]` (sidebar/modals)

**Hover**: Backgrounds → `bg-[#EFEFED]` or `bg-gray-50`, Borders → `border-[#C8C7C5]`

**Focus**: `focus:border-[#2383E2]`, `focus:outline-none`

**Modal Animation**: `@keyframes fadeIn`, `@keyframes zoomIn`, `.animate-in` (see `app/globals.css`)

---

## Scrollbars
**Ref**: `app/globals.css`

```css
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #E9E9E7; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #C8C7C5; }
```

---

## Icons

**Library**: Lucide React  
**Sizes**: `size={16}` (default), `size={14}` (compact), `size={18}` (modal actions)  
**Color**: Match text color

---

## Best Practices

1. **Reference components**: Check existing files before creating new patterns
2. **Extract reusable**: See `settings-primitives.tsx`, `MemberSelector.tsx`
3. **Generous whitespace**: Notion style breathes
4. **Stick to palette**: No new colors without review
5. **Smooth transitions**: 200-300ms for all state changes
6. **Rounded corners**: Use `rounded`, `rounded-md`, `rounded-lg`, `rounded-full`
