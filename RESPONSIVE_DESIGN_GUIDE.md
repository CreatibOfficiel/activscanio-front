# ActivScanIO - Responsive Design Guide

**Last Updated:** December 25, 2024

This document outlines responsive design best practices and implementation patterns for the ActivScanIO frontend.

---

## Tailwind Breakpoints

ActivScanIO uses Tailwind CSS's default breakpoints:

| Breakpoint | Min Width | Devices |
|------------|-----------|---------|
| `sm:` | 640px | Small tablets, large phones (landscape) |
| `md:` | 768px | Tablets (portrait) |
| `lg:` | 1024px | Tablets (landscape), small laptops |
| `xl:` | 1280px | Laptops, small desktops |
| `2xl:` | 1536px | Large desktops |

### Mobile-First Approach

All styles are **mobile-first** by default. Apply breakpoint prefixes for larger screens.

```tsx
// ✅ CORRECT: Mobile styles first, then larger screens
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// ❌ WRONG: Desktop-first approach
<div className="grid-cols-3 md:grid-cols-2 grid-cols-1">
```

---

## Common Responsive Patterns

### 1. Grid Layouts

```tsx
// Achievement cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {achievements.map(...)}
</div>

// Stats dashboard
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <StatsCard />
  <StatsCard />
  <StatsCard />
</div>
```

### 2. Flexbox Layouts

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Left</div>
  <div className="w-full md:w-1/2">Right</div>
</div>

// Reverse order on mobile
<div className="flex flex-col-reverse md:flex-row">
  <div>Shows second on mobile, first on desktop</div>
  <div>Shows first on mobile, second on desktop</div>
</div>
```

### 3. Typography

```tsx
// Headings
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">

// Body text
<p className="text-sm md:text-base lg:text-lg">

// Truncate long text on mobile
<p className="truncate md:whitespace-normal">
```

### 4. Spacing

```tsx
// Padding
<div className="p-4 md:p-6 lg:p-8">

// Margins
<div className="my-4 md:my-6 lg:my-8">

// Gaps
<div className="flex gap-2 md:gap-4 lg:gap-6">
```

### 5. Show/Hide Elements

```tsx
// Hide on mobile
<div className="hidden md:block">Desktop only</div>

// Hide on desktop
<div className="block md:hidden">Mobile only</div>

// Different components per screen size
<div>
  <MobileNav className="md:hidden" />
  <DesktopNav className="hidden md:block" />
</div>
```

---

## Component-Specific Guidelines

### Achievement Cards

```tsx
<div className="
  bg-neutral-900
  rounded-lg
  p-4 md:p-6
  border border-neutral-800
  hover:border-neutral-700
  transition-all

  // Stack icon and content on mobile, row on desktop
  flex flex-col md:flex-row
  items-center md:items-start
  gap-4
">
  <div className="text-4xl md:text-5xl">{icon}</div>
  <div className="text-center md:text-left flex-1">
    <h3 className="text-lg md:text-xl font-bold">{name}</h3>
    <p className="text-sm md:text-base text-neutral-400">{description}</p>
  </div>
</div>
```

### Modal Dialogs

```tsx
<div className="
  fixed inset-0 z-50
  flex items-end sm:items-center justify-center
  p-0 sm:p-4
">
  <div className="
    bg-neutral-900
    rounded-t-xl sm:rounded-xl
    w-full sm:max-w-md
    max-h-[90vh] sm:max-h-[80vh]
    overflow-y-auto
    p-6
  ">
    {/* Mobile: Full width, slides up from bottom */}
    {/* Desktop: Centered modal with max-width */}
  </div>
</div>
```

### Forms

```tsx
<form className="space-y-4">
  {/* Full width inputs on mobile */}
  <input className="w-full px-4 py-3 rounded-lg text-base md:text-sm" />

  {/* Buttons: Full width on mobile, auto on desktop */}
  <button className="w-full md:w-auto px-6 py-3 rounded-lg">
    Submit
  </button>
</form>
```

### Tables

```tsx
// Mobile: Card layout
// Desktop: Traditional table
<div className="space-y-2 md:space-y-0">
  {/* Mobile cards */}
  <div className="md:hidden">
    {data.map(item => (
      <div key={item.id} className="bg-neutral-800 rounded-lg p-4 space-y-2">
        <div className="font-bold">{item.name}</div>
        <div className="text-sm text-neutral-400">{item.value}</div>
      </div>
    ))}
  </div>

  {/* Desktop table */}
  <table className="hidden md:table w-full">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

### Charts (Recharts)

```tsx
import { ResponsiveContainer, LineChart, ... } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    {/* Charts automatically resize */}
  </LineChart>
</ResponsiveContainer>

// Adjust height based on screen size
<div className="h-64 md:h-80 lg:h-96">
  <ResponsiveContainer width="100%" height="100%">
    ...
  </ResponsiveContainer>
</div>
```

---

## Touch-Friendly Interactions

### Minimum Touch Target: 44x44px

```tsx
// ✅ CORRECT: Large enough for touch
<button className="min-w-[44px] min-h-[44px] p-3">

// ❌ WRONG: Too small for touch
<button className="p-1">
```

### Hover States

```tsx
// Disable hover on touch devices
<button className="
  bg-blue-600
  hover:bg-blue-700
  md:hover:scale-105
  active:scale-95
  transition-all
">
```

### Swipeable Components

Consider using libraries like `react-swipeable` for:
- Image galleries
- Card dismissals
- Drawer navigation

---

## Performance Optimizations

### 1. Lazy Loading Images

```tsx
import LazyImage from '@/app/components/ui/LazyImage';

<LazyImage
  src="/path/to/image.jpg"
  alt="Description"
  className="w-full h-auto"
  rootMargin="100px" // Start loading 100px before entering viewport
/>
```

### 2. Debounced Inputs

```tsx
import { useDebounce } from '@/app/hooks/useDebounce';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  if (debouncedSearch) {
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);
```

### 3. React.memo for Heavy Components

```tsx
import { memo } from 'react';

const AchievementCard = memo(({ achievement }: Props) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.achievement.id === nextProps.achievement.id;
});
```

### 4. Virtual Scrolling (for long lists)

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// For lists with 100+ items
```

---

## Animations & Transitions

### CSS Animations

```tsx
// Use custom animations from animations.css
<div className="animate-fade-in-up">
<div className="animate-slide-in-right">
<div className="animate-bounce-once">
<div className="animate-glow"> // For legendary achievements
```

### Mobile Performance

```tsx
// Reduce animations on mobile (already handled in animations.css)
@media (max-width: 768px) {
  .animate-glow {
    animation: none; // Disable complex animations
  }
}
```

### Respect User Preferences

```css
/* animations.css already includes: */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Accessibility (a11y)

### Skip to Main Content

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

<main id="main-content">
  {children}
</main>
```

### Screen Reader Only Text

```tsx
<span className="sr-only">Loading...</span>
<Spinner aria-hidden="true" />
```

### Focus States

```tsx
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-blue-500
  focus:ring-offset-2
  focus:ring-offset-neutral-900
">
```

---

## Testing Checklist

### Devices to Test

- [ ] iPhone 13/14 (390x844)
- [ ] iPhone 13 Pro Max (428x926)
- [ ] Samsung Galaxy S21 (360x800)
- [ ] iPad (768x1024)
- [ ] iPad Pro (1024x1366)
- [ ] Desktop (1920x1080)

### Browser Testing

- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet
- [ ] Firefox Mobile
- [ ] Desktop browsers (Chrome, Firefox, Safari, Edge)

### Orientation Testing

- [ ] Portrait mode
- [ ] Landscape mode
- [ ] Rotation handling

### Performance Metrics

- [ ] Lighthouse mobile score >80
- [ ] First Contentful Paint <2s
- [ ] Time to Interactive <3.5s
- [ ] Cumulative Layout Shift <0.1

---

## Common Pitfalls to Avoid

### ❌ Don't Do This

```tsx
// Using fixed widths
<div className="w-[300px]"> // Breaks on small screens

// Using px values for responsive elements
<div className="w-[500px] md:w-[700px]"> // Use relative units

// Not testing on real devices
// Emulators don't capture touch interactions accurately

// Ignoring landscape orientation
<div className="h-screen"> // May be too tall in landscape
```

### ✅ Do This Instead

```tsx
// Use percentage or flex
<div className="w-full max-w-md mx-auto">

// Use Tailwind's responsive classes
<div className="w-full md:w-2/3 lg:w-1/2">

// Test on real devices when possible
// Or use Chrome DevTools device mode

// Account for landscape
<div className="h-screen max-h-[600px]">
```

---

## Component Templates

### Responsive Card

```tsx
export function ResponsiveCard({ children }: { children: ReactNode }) {
  return (
    <div className="
      bg-neutral-900
      rounded-lg md:rounded-xl
      p-4 md:p-6 lg:p-8
      border border-neutral-800
      hover:border-neutral-700
      transition-all duration-200
      shadow-sm hover:shadow-md
      w-full
    ">
      {children}
    </div>
  );
}
```

### Responsive Container

```tsx
export function Container({ children }: { children: ReactNode }) {
  return (
    <div className="
      container
      mx-auto
      px-4 sm:px-6 lg:px-8
      max-w-7xl
    ">
      {children}
    </div>
  );
}
```

### Responsive Grid

```tsx
export function ResponsiveGrid({ children }: { children: ReactNode }) {
  return (
    <div className="
      grid
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-3
      xl:grid-cols-4
      gap-4 md:gap-6
      auto-rows-fr
    ">
      {children}
    </div>
  );
}
```

---

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Web.dev Mobile Performance](https://web.dev/mobile/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)

---

## Quick Reference

```bash
# Test responsive layout in Chrome DevTools
Cmd+Shift+M (Mac) / Ctrl+Shift+M (Windows)

# Common Tailwind responsive patterns
sm:  # 640px+  (tablet portrait)
md:  # 768px+  (tablet landscape)
lg:  # 1024px+ (laptop)
xl:  # 1280px+ (desktop)
2xl: # 1536px+ (large desktop)

# Touch target minimum
min-w-[44px] min-h-[44px]

# Responsive text
text-sm md:text-base lg:text-lg

# Responsive spacing
p-4 md:p-6 lg:p-8
gap-2 md:gap-4 lg:gap-6

# Show/hide
hidden md:block    # Hide mobile, show desktop
block md:hidden    # Show mobile, hide desktop
```

---

**Remember:** Always test on real devices when possible. Emulators don't capture the full mobile experience, especially touch interactions and performance on lower-end devices.
