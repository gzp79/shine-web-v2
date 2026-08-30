---
name: css
description: Tailwind 4 configuration and semantic color system. Use when writing styles, choosing colors, or working with Tailwind utilities. Covers custom color tokens, responsive breakpoints, and when to use classes vs component props.
---

# CSS & Tailwind Guide

## Semantic Color System

This project uses **custom semantic color tokens** instead of standard Tailwind colors. Always use these semantic names:

### Theme Colors

**Surface & Containers:**

- `bg-surface` / `text-on-surface` - Main background and text
- `bg-container` / `text-on-container` - Container background
- `bg-sub-container` / `text-on-sub-container` - Nested containers

**Action Colors:**

- `bg-primary` / `text-on-primary` - Primary actions (3 shades: `primary`, `primary-1`, `primary-2`)
- `bg-secondary` / `text-on-secondary` - Secondary actions (3 shades)
- `bg-info` / `text-on-info` - Informational (3 shades)
- `bg-warning` / `text-on-warning` - Warnings (3 shades)
- `bg-danger` / `text-on-danger` - Destructive actions (3 shades)
- `bg-success` / `text-on-success` - Success states (3 shades)

**Data / Categorical Colors:**

- `bg-data-1` / `text-on-data-1` through `bg-data-8` / `text-on-data-8` — eight meaning-free
  "heat" buckets (warm → cool) for distinguishing series, users, tags, etc. Each has the same
  shape as an action color: base, `-1` (lighter), `-2` (darker/accent), plus a single `on-` foreground.
- Use these — not the action colors — whenever the color only needs to be _distinct_, not to
  _signal_ meaning (danger/success carry meaning; a user's color does not).
- `dataColor(key)` (`@lib/ui/utils`) deterministically maps any string (e.g. a user id) to a bucket.

### Usage Examples

```svelte
<!-- ✅ CORRECT: Use semantic colors -->
<div class="bg-surface text-on-surface">
    <div class="bg-container text-on-container p-4">
        <button class="bg-primary text-on-primary">Click</button>
    </div>
</div>

<!-- ❌ WRONG: Don't use standard Tailwind colors -->
<div class="bg-white text-black">
    <button class="bg-blue-500 text-white">Click</button>
</div>
```

## Tailwind 4 Practices

### Custom Utilities

**Responsive Breakpoints:**

- `xs:` (0px), `sm:` (480px), `md:` (640px), `lg:` (768px), `xl:` (1280px)

**Custom Classes:**

- `brightness-highlight` / `hover:brightness-highlight` - Theme-aware brightness
- `scrollbar-hide` - Hide scrollbars
- `grid-cols-1-auto` through `grid-cols-6-auto` - Auto-sized grid columns
- Table utilities: `table`, `table-xs`, `table-sm`, `table-md`, `table-lg`

### Common Patterns

```svelte
<!-- Glass-morphic effect -->
<div class="bg-white/10 backdrop-blur-md">

<!-- Theme-aware hover -->
<button class="hover:brightness-highlight">

<!-- Responsive spacing -->
<div class="p-4 md:p-6 lg:p-8">
```

## Best Practices

1. **Always use semantic colors** - Never use `bg-blue-500`, `text-gray-700`, etc.
2. **Use theme colors for components** - `bg-primary`, `bg-danger`, not arbitrary colors
3. **Responsive-first** - Use responsive breakpoints for layout
4. **Type-safe** - Use TypeScript for all class compositions
5. **Accessibility** - Pair background colors with correct `text-on-*` variants

## When to Use Custom Classes vs Component Props

### Priority Order

1. **Component properties** (highest priority)
2. **Simple utility classes** (single-purpose adjustments)
3. **Complex class combinations** (suggest component enhancement)

### Custom Classes: Good Use Cases

**✅ Appropriate for custom classes:**

```svelte
<!-- Positioning & layout -->
<div class="absolute top-0 right-0">
<div class="flex-1">

<!-- Single utility adjustments -->
<Typography class="text-center truncate">
<Button class="opacity-50">

<!-- Unique decorative effects -->
<div class="bg-gradient-to-b from-slate-400/20 to-slate-500/30">
<div class="backdrop-blur-lg rounded-3xl">
```

### When to Suggest Component Enhancement

**🔔 Suggest component updates when:**

1. **Repeated patterns** - Same class combo used 3+ times

    ```svelte
    <!-- Seen multiple times: -->
    <Button class="rounded-full py-4 px-6 bg-white/20 backdrop-blur-md">

    <!-- Suggest: Add `pill` and `glass` props to Button -->
    ```

2. **Complex styling that represents semantic meaning**

    ```svelte
    <!-- Complex glassmorphism pattern: -->
    <div class="bg-white/20 backdrop-blur-lg border border-white/30 rounded-3xl shadow-xl">

    <!-- Suggest: Add `glass` variant to Box component -->
    ```

3. **Layout patterns becoming standard**

    ```svelte
    <!-- Repeated flex layout: -->
    <div class="flex items-center justify-start gap-3">

    <!-- Already handled by Stack component! Use Stack instead -->
    ```

### Practical Guidelines

**Before adding custom classes, ask:**

- Does a component prop already handle this?
- Is this a one-time need or a pattern?
- Would this benefit from being a component feature?

**Example analysis:**

```svelte
<!-- ❌ DON'T: Reimplementing component features -->
<div class="flex flex-col gap-2">  <!-- Use Stack instead -->
<div class="bg-primary text-on-primary p-4 border">  <!-- Use Box instead -->

<!-- ✅ DO: Custom classes for unique needs -->
<Stack spacing={2} class="absolute top-4 right-4">  <!-- Position is unique -->
<Button color="primary" class="min-w-[200px]">  <!-- One-off size constraint -->
```

## Color Shades

Each action color has 3 shades for depth:

- Base: Main color
- `-1`: Lighter variant
- `-2`: Accent/hover variant

```svelte
<div class="bg-primary hover:bg-primary-1 active:bg-primary-2">
```
