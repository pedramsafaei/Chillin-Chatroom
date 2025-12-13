# Spaces Design System

## Quick Reference Guide

This document provides a quick reference for developers working with the Spaces design system.

---

## Color Palette

### Background Layers
Use these for layering UI elements from back to front:

| Variable | Hex | Use Case |
|----------|-----|----------|
| `var(--bg-900)` | #0a0a0b | Main canvas, page background |
| `var(--bg-800)` | #121214 | Sidebars, containers |
| `var(--bg-700)` | #1a1a1f | Cards, panels, elevated surfaces |
| `var(--bg-600)` | #252530 | Hover states |
| `var(--bg-500)` | #32323f | Active/pressed states |

### Text Hierarchy
Use these for text content from most to least important:

| Variable | Hex | Use Case |
|----------|-----|----------|
| `var(--text-100)` | #ffffff | Primary text, headings |
| `var(--text-200)` | #e4e4e7 | Secondary text, body |
| `var(--text-300)` | #a1a1aa | Tertiary text, labels |
| `var(--text-400)` | #71717a | Disabled text, placeholders |

### Accent Colors (with gradients)
Use these for interactive elements, branding, and visual interest:

| Color | From → To | CSS Class |
|-------|-----------|-----------|
| Blue | #3b82f6 → #1d4ed8 | `.gradient-blue` |
| Purple | #8b5cf6 → #6d28d9 | `.gradient-purple` |
| Green | #10b981 → #059669 | `.gradient-green` |
| Orange | #f97316 → #ea580c | `.gradient-orange` |
| Rose | #f43f5e → #e11d48 | `.gradient-rose` |
| Cyan | #06b6d4 → #0891b2 | `.gradient-cyan` |

### Semantic Colors
Use these for specific UI states:

| Variable | Hex | Use Case |
|----------|-----|----------|
| `var(--success)` | #22c55e | Success messages, confirmations |
| `var(--warning)` | #eab308 | Warnings, cautions |
| `var(--error)` | #ef4444 | Errors, destructive actions |
| `var(--info)` | #3b82f6 | Information, tips |

---

## Typography

### Font Families
```css
--font-ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
--font-code: 'JetBrains Mono', 'Courier New', monospace
```

### Type Scale

| Class | Size/Line Height | Letter Spacing | Weight | Use Case |
|-------|------------------|----------------|--------|----------|
| `.text-display` | 48px/56px | -0.02em | 800 | Page titles, hero text |
| `.text-h1` | 32px/40px | -0.02em | 700 | Section headings |
| `.text-h2` | 24px/32px | -0.01em | 600 | Card titles |
| `.text-h3` | 20px/28px | -0.01em | 600 | Subsection headings |
| `.text-body` | 16px/24px | 0 | 400 | Default body text |
| `.text-body-sm` | 14px/20px | 0 | 400 | Secondary text |
| `.text-caption` | 12px/16px | 0.01em | 500 | Labels, captions |
| `.text-micro` | 10px/14px | 0.02em | 500 | Badges, tags (uppercase) |

### Example Usage
```jsx
<h1 className="text-display">Spaces</h1>
<h2 className="text-h1">Welcome Back</h2>
<p className="text-body">Start a conversation...</p>
<span className="text-caption">Online now</span>
```

---

## Spacing

### 8px-Based System

| Variable | Value | Use Case |
|----------|-------|----------|
| `var(--space-1)` | 4px | Tight spacing, icons |
| `var(--space-2)` | 8px | Default gap between elements |
| `var(--space-3)` | 12px | Comfortable spacing |
| `var(--space-4)` | 16px | Section gaps |
| `var(--space-5)` | 24px | Card padding |
| `var(--space-6)` | 32px | Section padding |
| `var(--space-7)` | 48px | Major section spacing |
| `var(--space-8)` | 64px | Page-level spacing |

### Example Usage
```css
.card {
  padding: var(--space-5);
  margin-bottom: var(--space-4);
  gap: var(--space-3);
}
```

---

## Border Radius

| Variable | Value | Use Case |
|----------|-------|----------|
| `var(--radius-sm)` | 4px | Buttons, small inputs |
| `var(--radius-md)` | 8px | Cards, panels, inputs |
| `var(--radius-lg)` | 12px | Modals, large cards |
| `var(--radius-xl)` | 16px | Featured elements |
| `var(--radius-full)` | 9999px | Avatars, pills, badges |

### Example Usage
```css
.button {
  border-radius: var(--radius-md);
}

.avatar {
  border-radius: var(--radius-full);
}
```

---

## Shadows

| Variable | Use Case |
|----------|----------|
| `var(--shadow-sm)` | Subtle elevation |
| `var(--shadow-md)` | Cards, buttons |
| `var(--shadow-lg)` | Hover states, modals |
| `var(--shadow-xl)` | Prominent elements, dropdowns |

### Example Usage
```css
.card {
  box-shadow: var(--shadow-md);
}

.card:hover {
  box-shadow: var(--shadow-lg);
}
```

---

## Transitions

| Variable | Duration | Use Case |
|----------|----------|----------|
| `var(--transition-fast)` | 150ms | Subtle interactions |
| `var(--transition-base)` | 250ms | Standard interactions |
| `var(--transition-slow)` | 350ms | Major animations |

All transitions use `cubic-bezier(0.4, 0, 0.2, 1)` easing.

### Example Usage
```css
.button {
  transition: all var(--transition-base);
}

.button:hover {
  transform: translateY(-2px);
}
```

---

## Animations

### Built-in Keyframes

```css
/* Fade in */
animation: fadeIn var(--transition-base);

/* Slide in from left */
animation: slideIn var(--transition-base);

/* Pulse effect */
animation: pulse 2s infinite;

/* Spin (loading) */
animation: spin 1s linear infinite;
```

### Example Usage
```jsx
<div className="fade-in">Content</div>
<div className="spinner"></div>
```

---

## Utility Classes

### Layout
```css
.flex-center    /* Centers content horizontally and vertically */
.flex-between   /* Space-between with vertical center alignment */
.truncate       /* Ellipsis overflow */
```

### Visual Effects
```css
.loading        /* Pulse animation */
.spinner        /* Rotating spinner */
.fade-in        /* Fade in animation */
```

### Gradients
```css
.gradient-blue
.gradient-purple
.gradient-green
.gradient-orange
.gradient-rose
.gradient-cyan
```

### Example Usage
```jsx
<div className="flex-center">
  <span className="spinner"></span>
</div>

<button className="gradient-blue">
  Join Space
</button>
```

---

## Component Patterns

### Button
```jsx
<button className="button-primary">
  Primary Action
</button>
```

```css
.button-primary {
  padding: var(--space-4);
  background: linear-gradient(135deg, var(--blue-from) 0%, var(--blue-to) 100%);
  color: var(--text-100);
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
}

.button-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

### Card
```jsx
<div className="card">
  <h3 className="text-h3">Card Title</h3>
  <p className="text-body">Card content...</p>
</div>
```

```css
.card {
  background: var(--bg-800);
  border: 1px solid var(--bg-700);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}
```

### Input
```jsx
<input 
  type="text" 
  className="input-field"
  placeholder="Enter text..."
/>
```

```css
.input-field {
  padding: var(--space-4);
  background: var(--bg-700);
  border: 2px solid var(--bg-600);
  border-radius: var(--radius-md);
  color: var(--text-100);
  font-size: var(--text-body);
  transition: all var(--transition-base);
}

.input-field:focus {
  outline: none;
  border-color: var(--blue-from);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

### Avatar
```jsx
<div className="avatar gradient-blue">
  JD
</div>
```

```css
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  text-transform: uppercase;
}
```

---

## Responsive Breakpoints

```css
/* Mobile First Approach */
@media (max-width: 480px) {
  /* Mobile phones */
}

@media (max-width: 640px) {
  /* Small tablets */
}

@media (max-width: 768px) {
  /* Tablets */
}

@media (max-width: 1024px) {
  /* Small laptops */
}

@media (max-width: 1280px) {
  /* Laptops */
}
```

---

## Best Practices

### Do's ✅
- Always use design system variables instead of hardcoded values
- Use the spacing scale for consistent layouts
- Apply appropriate text hierarchy
- Use semantic colors for meaningful UI states
- Add hover and active states to interactive elements
- Ensure proper color contrast for accessibility
- Test on multiple screen sizes

### Don'ts ❌
- Don't use arbitrary color values
- Don't create new spacing values outside the scale
- Don't skip hover states on interactive elements
- Don't use inconsistent border radius values
- Don't ignore responsive design
- Don't forget to add transitions for smooth UX

---

## Quick Copy-Paste Templates

### Card with Gradient Header
```jsx
<div className="card">
  <div className="gradient-blue" style={{height: '4px'}}></div>
  <div style={{padding: 'var(--space-5)'}}>
    <h3 className="text-h3">Title</h3>
    <p className="text-body">Content</p>
  </div>
</div>
```

### Button with Icon
```jsx
<button className="button-primary">
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="..." stroke="currentColor" strokeWidth="2"/>
  </svg>
  Button Text
</button>
```

### Status Indicator
```jsx
<div className="flex-center" style={{gap: 'var(--space-2)'}}>
  <span className="status-dot online"></span>
  <span className="text-caption">Online</span>
</div>
```

```css
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: var(--success);
  animation: pulse-green 2s infinite;
}
```

---

## Resources

### Design Tools
- Figma: Use the color palette for mockups
- Chrome DevTools: Inspect design system variables
- Browser Extensions: Check contrast ratios

### Fonts
- Inter: https://fonts.google.com/specimen/Inter
- JetBrains Mono: https://fonts.google.com/specimen/JetBrains+Mono

### Icons
- Heroicons: https://heroicons.com/
- Lucide: https://lucide.dev/
- Custom SVGs following 20x20 or 24x24 viewBox

---

## Need Help?

1. Check existing components for reference
2. Review this design system documentation
3. Inspect browser DevTools for CSS variables
4. Maintain consistency with existing patterns
5. Test on multiple devices and browsers

---

**Version**: 2.0.0  
**Last Updated**: December 13, 2024  
**Status**: Production Ready
