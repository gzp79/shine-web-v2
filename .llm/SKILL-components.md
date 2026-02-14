# UI Component Reference

## Layout Components

### Stack

Flexbox container for arranging children.

**Props:**

- `direction`: 'row' | 'column' (default: 'column')
- `spacing`: number (default: 2)
- `alignment`: 'start' | 'center' | 'end' | 'stretch' (default: 'stretch')
- `justification`: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' (default: 'center')
- `wrap`: boolean
- `grow`: boolean (makes all children flex-1)
- `margin`: ResponsiveSpacing
- `class`: string

```svelte
<Stack direction="column" spacing={2} alignment="stretch" justification="center">
    {children}
</Stack>
```

### Box

Container with border, padding, and theme colors.

**Props:**

- `color`: ActionColor (primary | secondary | info | warning | danger | success)
- `border`: boolean (default: true)
- `shadow`: boolean (default: false)
- `ghost`: boolean (transparent background)
- `width`: 'fit' | 'sm' | 'md' | 'lg' | 'full' (default: 'fit')
- `margin`: ResponsiveSpacing
- `padding`: ResponsiveSpacing (default: 4)
- `overflow`: 'x' | 'y' | 'xy' | 'none' (default: 'xy')
- **`containerClass`**: string (for outer container)
- **`contentClass`**: string (for inner content)

```svelte
<Box color="primary" border shadow={false} padding={4} containerClass="max-w-md">
    {children}
</Box>
```

**⚠️ Box does NOT accept `class` prop - use `containerClass` or `contentClass`**

### Card

Pre-styled container with optional icon, title, and actions.

**Props:**

- `color`: ActionColor
- `shadow`: boolean (default: false)
- `width`: 'fit' | 'sm' | 'md' | 'lg' | 'full'
- `padding`: ResponsiveSpacing (default: 2)
- `title`: string | Snippet
- `icon`: Snippet
- `actions`: Snippet

```svelte
<Card color="primary" title="Card Title" padding={2}>
    {#snippet icon({ class })}<MyIcon />{/snippet}
    {#snippet actions()}<Button>Action</Button>{/snippet}
    Content here
</Card>
```

### Separator

Horizontal or vertical divider line.

**Props:**

- `variant`: 'default' | 'subtle' (default: 'default')
- `orientation`: 'horizontal' | 'vertical' (default: 'horizontal')

```svelte
<Separator variant="default" orientation="horizontal" />
```

## Typography

Text component with semantic variants.

**Props:**

- `variant`: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'text' | 'footnote' | 'code' (default: 'text')
- `weight`: 'normal' | 'emphasis' | 'bold' (default: 'normal')
- `underline`: boolean
- `italic`: boolean
- `element`: string (override HTML element)
- `class`: string

```svelte
<Typography variant="text" weight="normal" class="text-center">Text content</Typography>
```

## Input Components

### Button

Action button with theme variants.

**Props:**

- `color`: ActionColor (default: 'primary')
- `variant`: 'filled' | 'accent' | 'outline' | 'ghost' (default: 'filled')
- `size`: 'xs' | 'sm' | 'md' | 'lg' (default: 'md')
- `wide`: boolean (full width)
- `disabled`: boolean
- `type`: 'button' | 'submit' | 'reset'
- `href`: string (makes it a link)

```svelte
<Button color="primary" variant="filled" size="md">Button Text</Button>
```

### Input

Form input with validation states.

**Props:**

- `type`: 'text' | 'number' | 'password' | 'email' | 'date' | 'time' | etc. (default: 'text')
- `color`: ActionColor (default: 'primary')
- `variant`: 'filled' | 'accent' | 'outline' | 'ghost' (default: 'filled')
- `size`: 'xs' | 'sm' | 'md' | 'lg' (default: 'md')
- `wide`: boolean (full width)
- `disabled`: boolean
- `invalid`: boolean (shows error state)
- `value`: bindable
- `placeholder`: string

```svelte
<Input type="text" color="primary" variant="filled" bind:value placeholder="Enter text" />
```

## Common Patterns

### Responsive Props

Single value or object with breakpoints:

```svelte
<Stack spacing={2} />
<Stack spacing={{ xs: 1, sm: 2, lg: 4 }} />
<Stack direction={{ xs: 'column', md: 'row' }} />
```

### Action Colors

Standard semantic colors across all components:

- `primary`, `secondary`, `info`, `warning`, `danger`, `success`
- Auto-nesting: Box/Card colors rotate through `container` → `sub-container` → `surface`

### Sizes

Standard sizing scale: `xs`, `sm`, `md`, `lg`

## Key Reminders

1. **Box uses `containerClass` and `contentClass`** - never `class`
2. **Stack uses `spacing`** - not `gap`
3. **Typography has `variant`** - not `type` or `size`
4. **Responsive props** use objects with breakpoint keys
5. **Always use semantic colors** from the theme

## Component Properties vs Custom Classes

**Always prefer component props over custom Tailwind classes.**

```svelte
<!-- ✅ GOOD: Use props -->
<Stack direction="row" spacing={3} alignment="center">
<Button color="primary" size="lg" wide>

<!-- ❌ AVOID: Reimplementing with classes -->
<div class="flex flex-row gap-3 items-center">
<button class="bg-primary px-6 py-3 w-full">
```

**Suggest component enhancements when you see repeated complex class patterns:**

- Same combination used 3+ times → suggest new prop/variant
- Example: `class="rounded-full backdrop-blur-md"` → suggest `pill` and `glass` props

**Custom classes are OK for:**

- Positioning (`absolute`, `relative`, `top-4`)
- One-off tweaks (`text-center`, `opacity-50`)
- Story-specific styling
