# Animation System Usage Guide

## Overview
This guide explains how to use the comprehensive animation system implemented in `animations.css`.

## Quick Start

The animations are globally available once you import `animations.css` in your main entry point (already done in `index.js`).

```jsx
import './animations.css'; // Already imported in index.js
```

## Message Animations

### Incoming Messages
```jsx
<div className="message-incoming">
  {/* Message content */}
</div>
```
**Effect**: Fades in from bottom with scale (200ms)

### Sending Messages
```jsx
<div className="message-sending">
  {/* Message content */}
</div>
```
**Effect**: Slides in from right with fade (150ms)

### Confirmed Messages
```jsx
<div className="message-confirmed">
  <span className="checkmark-icon">✓</span>
</div>
```
**Effect**: Checkmark pulses on confirmation (400ms)

### Deleting Messages
```jsx
<div className="message-deleting">
  {/* Message being deleted */}
</div>
```
**Effect**: Collapses and fades out (200ms)

## Presence Animations

### User Comes Online
```jsx
<div className="member-card user-online">
  <span className="status-dot status-dot-online">🟢</span>
  <span className="member-name">Alice</span>
</div>
```
**Effect**: Status dot springs in, name slides from left (300ms)

### User Goes Offline
```jsx
<div className="member-card user-offline">
  <span className="status-dot status-dot-offline">⚫</span>
  <span className="member-name">Bob</span>
</div>
```
**Effect**: Dot color transitions green→gray (500ms), then fades out after 5s

### Typing Indicator
```jsx
<div className="typing-indicator">
  <span className="dot"></span>
  <span className="dot"></span>
  <span className="dot"></span>
</div>
```
**Effect**: Three dots bounce with 100ms stagger (600ms cycle)

Or use the TypingIndicator component:
```jsx
import TypingIndicator from './components/TypingIndicator/TypingIndicator';

<TypingIndicator users={['Alice', 'Bob']} />
```

## UI Transitions

### Modal Animations
```jsx
// Backdrop
<div className="modal-backdrop">
  {/* Dark overlay */}
</div>

// Modal content
<div className="modal-content">
  {/* Modal body */}
</div>

// When closing
<div className="modal-closing">
  <div className="modal-backdrop"></div>
  <div className="modal-content"></div>
</div>
```

### Page Transitions
```jsx
// Exiting page
<div className="page-exit">
  {/* Old page content */}
</div>

// Entering page
<div className="page-enter">
  {/* New page content */}
</div>
```

## Hover Effects

### Button Hover
```jsx
<button className="hover-scale">
  Click me
</button>
```
**Effect**: Scales to 1.02 on hover (100ms)

### Card Hover
```jsx
<div className="card-hover">
  {/* Card content */}
</div>

// Or
<div className="card hover-lift">
  {/* Card content */}
</div>
```
**Effect**: Lifts up 2px with shadow (150ms)

### Link Hover
```jsx
<a href="#" className="link-hover">
  Click here
</a>
```
**Effect**: Color transition with opacity (100ms)
*Note: All `<a>` tags have this by default*

## Utility Classes

### Fade Animations
```jsx
<div className="fade-in">Content</div>
<div className="fade-out">Content</div>
```

### Slide Animations
```jsx
<div className="slide-in-left">From left</div>
<div className="slide-in-right">From right</div>
<div className="slide-in-top">From top</div>
<div className="slide-in-bottom">From bottom</div>
```

### Scale & Bounce
```jsx
<div className="scale-in">Scales in</div>
<div className="bounce-in">Bounces in</div>
```

### Loading States
```jsx
<div className="spinner">⟳</div>
<div className="pulse-loading">Loading...</div>
<div className="skeleton">
  {/* Skeleton placeholder */}
</div>
```

### Shake (for errors)
```jsx
<input className="shake" />
```

## Custom Animations

### Using Keyframes
You can reference any keyframe animation from `animations.css`:

```css
.my-element {
  animation: messageIncoming 200ms cubic-bezier(0.25, 0.1, 0.25, 1.0);
}
```

Available keyframes:
- `messageIncoming`, `messageSending`, `messageDeleting`
- `userOnline`, `userOffline`
- `typingBounce`
- `modalBackdropFadeIn`, `modalContentOpen`
- `pageExit`, `pageEnter`
- `fadeIn`, `fadeOut`
- `slideInLeft`, `slideInRight`, `slideInTop`, `slideInBottom`
- `scaleIn`, `bounceIn`, `shake`
- `spin`, `pulse`, `skeletonLoading`

## Animation Specifications

### Message Animations
- **Incoming**: 200ms, ease-out [0.25, 0.1, 0.25, 1.0]
- **Sending**: 150ms, ease-out
- **Confirmed**: 400ms, ease-out [0.25, 0.1, 0.25, 1.0]
- **Deleting**: 200ms, ease-in-out

### Presence Animations
- **User Online**: 300ms, ease-out (spring for dot)
- **User Offline**: 500ms color transition, 5s delay, 500ms fade
- **Typing**: 600ms cycle, ease-in-out, 100ms stagger

### UI Transitions
- **Modal Backdrop**: 150ms fade
- **Modal Content**: 200ms, expo-out [0.16, 1, 0.3, 1]
- **Page Exit**: 150ms, ease-out
- **Page Enter**: 200ms, ease-out

### Hover Effects
- **Button**: 100ms scale to 1.02
- **Card**: 150ms translateY(-2px)
- **Link**: 100ms color transition

## Accessibility

### Reduced Motion Support
All animations respect the `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are disabled or minimized */
}
```

Users who enable "Reduce Motion" in their OS settings will see:
- Instant transitions (0.01ms)
- No animation iterations
- Immediate state changes

## Performance Tips

1. **Use transforms**: All animations use `transform` and `opacity` for GPU acceleration
2. **Avoid layout shifts**: Don't animate `width`, `height`, `margin` in critical paths
3. **Limit concurrent animations**: Too many simultaneous animations can cause jank
4. **Test on mobile**: Verify animations run smoothly on lower-powered devices
5. **Profile performance**: Use Chrome DevTools to check animation performance

## Browser Compatibility

- ✅ Chrome/Edge (all versions with CSS3 support)
- ✅ Firefox (all versions with CSS3 support)
- ✅ Safari (all versions with CSS3 support)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ IE11 (partial support, graceful degradation)

## Examples

### Complete Message Animation Flow
```jsx
// When sending a message
const [messageState, setMessageState] = useState('sending');

<div className={`message ${
  messageState === 'sending' ? 'message-sending' : 
  messageState === 'confirmed' ? 'message-confirmed' : ''
}`}>
  <p>{text}</p>
  {messageState === 'confirmed' && (
    <span className="checkmark-icon">✓</span>
  )}
</div>

// Later, when confirmed
setMessageState('confirmed');
```

### Complete User Presence Flow
```jsx
const [isOnline, setIsOnline] = useState(false);

<div className={`member-card ${isOnline ? 'user-online' : 'user-offline'}`}>
  <span className={`status-dot ${isOnline ? 'status-dot-online' : 'status-dot-offline'}`}>
    {isOnline ? '🟢' : '⚫'}
  </span>
  <span className="member-name">{userName}</span>
</div>
```

### Complete Modal Flow
```jsx
const [isOpen, setIsOpen] = useState(false);
const [isClosing, setIsClosing] = useState(false);

const handleClose = () => {
  setIsClosing(true);
  setTimeout(() => {
    setIsOpen(false);
    setIsClosing(false);
  }, 150);
};

{isOpen && (
  <div className={isClosing ? 'modal-closing' : ''}>
    <div className="modal-backdrop" onClick={handleClose}></div>
    <div className="modal-content">
      {/* Modal content */}
    </div>
  </div>
)}
```

## Troubleshooting

### Animations not working?
1. Check that `animations.css` is imported in `index.js`
2. Verify class names match exactly (case-sensitive)
3. Check browser console for CSS errors
4. Ensure elements are visible (not `display: none`)

### Animations too fast/slow?
You can override animation duration:
```css
.my-element {
  animation-duration: 500ms !important;
}
```

### Animations causing performance issues?
1. Reduce the number of concurrent animations
2. Use `will-change` sparingly
3. Consider disabling animations on low-end devices
4. Profile with Chrome DevTools Performance tab

## Contributing

When adding new animations:
1. Use existing keyframes when possible
2. Follow naming conventions (verb-noun pattern)
3. Document specifications in comments
4. Test on multiple browsers
5. Consider accessibility (reduced motion)
6. Use GPU-accelerated properties (`transform`, `opacity`)

---

**Version**: 1.0.0  
**Last Updated**: December 13, 2024  
**Status**: Production Ready
