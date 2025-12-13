# Visual Implementation Guide

## Connection Status Indicators

### 🟢 CONNECTED State
```
┌─────────────────────────────────────┐
│                            ● (green) │  ← Minimal green dot indicator
└─────────────────────────────────────┘
```
- **Location**: Fixed top-right corner
- **Animation**: Pulse effect
- **Behavior**: Always visible when connected

---

### ⚠️ RECONNECTING State
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠ Connection lost. Reconnecting... (attempt 3/10)  [Dismiss] │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░ 30%                 │
└─────────────────────────────────────────────────────────────┘
     ^                                           ^        ^
     Icon                                     Progress  Button
```
- **Background**: Yellow/amber gradient (#f59e0b → #d97706)
- **Features**:
  - Animated progress bar (shimmer effect)
  - Dismiss button to hide banner
  - Shows attempt count (X/10)
- **Input**: Disabled during reconnection
- **Messages**: Remain visible

---

### 🔴 OFFLINE State
```
┌────────────────────────────────────────────────────────────────┐
│ ⚠ You're offline. Messages will be sent when you reconnect    │
│                                                    [Try Again]  │
└────────────────────────────────────────────────────────────────┘
```
- **Background**: Red/rose gradient (#f43f5e → #e11d48)
- **Features**:
  - Try Again button to retry connection
  - Clear offline indicator
- **Input**: Enabled (messages queued locally)
- **Messages**: Remain visible

---

### 🔵 SYNCING State
```
┌─────────────────────────────────────────────┐
│ ⟳ Syncing messages...                      │
│   (spinner animation)                       │
└─────────────────────────────────────────────┘
```
- **Background**: Blue gradient (#3b82f6 → #1d4ed8)
- **Features**:
  - Animated spinner
  - Auto-dismisses when complete
- **Behavior**: Temporary state during sync

---

## Message Animations

### 📨 Incoming Message
```
Animation Timeline:
0ms:   opacity: 0, y: 20px, scale: 0.95
      ┌─────────────────┐
      │                 │ ← Below, small, invisible
      └─────────────────┘

200ms: opacity: 1, y: 0, scale: 1
      ┌─────────────────┐
      │ Hello World!    │ ← In position, full size, visible
      └─────────────────┘
```
- **Duration**: 200ms
- **Easing**: cubic-bezier(0.25, 0.1, 0.25, 1.0)
- **Effect**: Fade in from bottom with scale

---

### 📤 Sending Message
```
Animation Timeline:
0ms:   opacity: 0.7, x: 10px
      ┌─────────────────┐
      │                 │ ← Slightly right, semi-transparent
      └─────────────────┘

150ms: opacity: 1, x: 0
      ┌─────────────────┐
      │ Sending...    ○ │ ← In position, fully visible
      └─────────────────┘
```
- **Duration**: 150ms
- **Easing**: ease-out
- **Effect**: Slide in from right with fade

---

### ✅ Message Confirmed
```
Animation Timeline:
Checkmark pulses:
0ms:   scale: 1.0    ✓
200ms: scale: 1.3    ✓ (larger)
400ms: scale: 1.0    ✓
```
- **Duration**: 400ms
- **Effect**: Checkmark scales up and back

---

### 🗑️ Message Deleted
```
Animation Timeline:
0ms:   opacity: 1, height: 60px
      ┌─────────────────┐
      │ Message here    │
      └─────────────────┘

200ms: opacity: 0, height: 0
      ─ (collapsed)
```
- **Duration**: 200ms
- **Easing**: ease-in-out
- **Effect**: Collapse and fade

---

## Presence Animations

### 👤 User Online
```
Status Dot:
0ms:   scale: 0
       ○ (invisible)

300ms: scale: 1 (spring)
       ● (green, bouncy entrance)

Name Entry:
0ms:   opacity: 0, x: -20px
       ────────

300ms: opacity: 1, x: 0
       Alice
```

---

### 👥 User Offline
```
Status Dot Color:
0ms:   green (#22c55e)
       ●

500ms: gray (#71717a)
       ●

Then after 5 seconds:
       opacity: 1 → 0
       x: 0 → -20px (fade left)
```

---

### ⌨️ Typing Indicator
```
Three dots bouncing with stagger:

●  ○  ○     ← Dot 1 up
○  ●  ○     ← Dot 2 up
○  ○  ●     ← Dot 3 up
●  ○  ○     ← Repeat

Stagger: 100ms between each dot
Cycle: 600ms per complete bounce
```

---

## UI Transitions

### 🗔 Modal Open
```
Backdrop:
0ms:   opacity: 0 (invisible)
150ms: opacity: 0.5 (semi-transparent dark overlay)

Modal Content:
0ms:   opacity: 0, scale: 0.95 (small, invisible)
       ┌─────┐
       │  □  │
       └─────┘

200ms: opacity: 1, scale: 1 (full size, visible)
       ┌───────────┐
       │  Modal    │
       │  Content  │
       └───────────┘
```
- **Backdrop**: 150ms fade
- **Modal**: 200ms scale with expo-out easing

---

### 📄 Page Transitions

**Exit Animation:**
```
0ms:   opacity: 1, x: 0
       ┌───────────┐
       │   Page    │ ← Visible, in place
       └───────────┘

150ms: opacity: 0, x: -20px
       ┌────────
       │   Pa      ← Faded, moved left
       └────────
```

**Enter Animation:**
```
0ms:   opacity: 0, x: 20px
              ────────┐
              Page    │ ← Invisible, right
              ────────┘

200ms: opacity: 1, x: 0
       ┌───────────┐
       │   Page    │ ← Visible, in place
       └───────────┘
```

---

## Hover Effects

### 🔘 Button Hover
```
Normal:     scale(1.0)
            ┌──────────┐
            │  Button  │
            └──────────┘

Hover:      scale(1.02)
            ┌────────────┐
            │   Button   │ ← Slightly larger
            └────────────┘

Active:     scale(0.98)
            ┌────────┐
            │ Button │ ← Pressed down
            └────────┘
```
- **Duration**: 100ms

---

### 📇 Card Hover
```
Normal:     y: 0, shadow-md
            ┌───────────┐
            │   Card    │
            │  Content  │
            └───────────┘
            ___shadow___

Hover:      y: -2px, shadow-lg
            ┌───────────┐
            │   Card    │ ← Lifted
            │  Content  │
            └───────────┘
            ____shadow____
```
- **Duration**: 150ms

---

### 🔗 Link Hover
```
Normal:     color: blue, opacity: 1
            Link Text

Hover:      color: dark-blue, opacity: 0.8
            Link Text ← Darker, slightly transparent
```
- **Duration**: 100ms

---

## Utility Classes Quick Reference

### Fade
- `.fade-in` - Fade in
- `.fade-out` - Fade out

### Slide
- `.slide-in-left` - From left
- `.slide-in-right` - From right
- `.slide-in-top` - From top
- `.slide-in-bottom` - From bottom

### Scale & Bounce
- `.scale-in` - Scale in
- `.bounce-in` - Bounce in
- `.shake` - Shake animation

### Loading
- `.spinner` - Rotating spinner
- `.pulse-loading` - Pulsing
- `.skeleton` - Skeleton loader

### Hover
- `.hover-scale` - Button scale
- `.card-hover` - Card lift
- `.link-hover` - Link transition

---

## Responsive Behavior

### Mobile (<768px)
- Connection banners stack vertically
- Buttons below content
- Reduced padding and font sizes
- Touch-optimized hit areas

### Tablet (768px - 1024px)
- Full banner layout
- Adjusted spacing
- Optimized for touch

### Desktop (>1024px)
- Full-featured layout
- Hover effects enabled
- Optimal spacing and typography

---

## Accessibility

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  /* All animations: 0.01ms (instant) */
}
```

Users with "Reduce Motion" enabled see:
- Instant state changes (no animations)
- Immediate transitions
- Full functionality maintained

---

## Browser Support Matrix

| Browser | Animations | Hover | Gradients | Notes |
|---------|------------|-------|-----------|-------|
| Chrome | ✅ Full | ✅ Full | ✅ Full | Recommended |
| Firefox | ✅ Full | ✅ Full | ✅ Full | Recommended |
| Safari | ✅ Full | ✅ Full | ✅ Full | Recommended |
| Edge | ✅ Full | ✅ Full | ✅ Full | Recommended |
| iOS Safari | ✅ Full | ⚠️ Touch | ✅ Full | Touch events |
| Chrome Mobile | ✅ Full | ⚠️ Touch | ✅ Full | Touch events |
| IE11 | ⚠️ Basic | ⚠️ Basic | ⚠️ Basic | Degraded |

Legend:
- ✅ Full support with all features
- ⚠️ Partial support or degraded
- ❌ Not supported

---

## Performance Tips

1. **GPU Acceleration**: All animations use `transform` and `opacity`
2. **No Layout Shifts**: Avoid animating `width`, `height`, `margin`
3. **Limit Concurrent**: Don't animate too many elements at once
4. **Profile**: Use Chrome DevTools Performance tab
5. **Test Mobile**: Verify 60fps on lower-end devices

---

**Visual Guide Version**: 1.0.0  
**Last Updated**: December 13, 2024  
**Status**: Complete
