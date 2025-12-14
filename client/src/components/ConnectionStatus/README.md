# ConnectionStatus Component

## Overview
Enhanced ConnectionStatus component with four distinct states and comprehensive visual feedback.

## States

### 1. CONNECTED
Shows a minimal green dot indicator in the top-right corner.

### 2. RECONNECTING
Shows a warning banner with:
- Yellow/amber gradient background
- Message: "Connection lost. Reconnecting... (attempt X/10)"
- Animated progress bar
- [Dismiss] button

### 3. OFFLINE
Shows an error banner with:
- Red/rose gradient background
- Message: "You're offline. Messages will be sent when you reconnect"
- [Try Again] button

### 4. SYNCING
Shows a blue banner with:
- Blue gradient background
- Message: "Syncing messages..."
- Spinner animation
- Auto-dismisses when complete

## Usage

```jsx
import ConnectionStatus from '../components/ConnectionStatus/ConnectionStatus';
import { ConnectionState } from '../hooks/useSocketConnection';

function Chat() {
  const {
    connectionState,
    error,
    retryAttempt,
    maxRetryAttempts,
    retryDelay,
    reconnect,
  } = useSocketConnection(ENDPOINT);

  return (
    <div>
      <ConnectionStatus
        connectionState={connectionState}
        error={error}
        retryAttempt={retryAttempt}
        maxRetryAttempts={maxRetryAttempts}
        retryDelay={retryDelay}
        onRetry={reconnect}
      />
      {/* Your content */}
    </div>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `connectionState` | string | One of: CONNECTED, RECONNECTING, OFFLINE, SYNCING, CONNECTING, DISCONNECTED, FAILED |
| `error` | string | Error message to display |
| `retryAttempt` | number | Current retry attempt number |
| `maxRetryAttempts` | number | Maximum number of retry attempts |
| `retryDelay` | number | Delay before next retry in milliseconds |
| `onRetry` | function | Callback function when user clicks retry button |

## States & Behaviors

| State | Display | Input Enabled | Messages Visible | Auto-Dismiss | Actions |
|-------|---------|---------------|------------------|--------------|---------|
| CONNECTED | Green dot | ✅ | ✅ | N/A | None |
| RECONNECTING | Warning banner | ❌ | ✅ | ❌ | [Dismiss] |
| OFFLINE | Error banner | ✅ (queued) | ✅ | ❌ | [Try Again] |
| SYNCING | Info banner | ⏳ | ✅ | ✅ | None |

## Animations

- **Slide Down**: Banner slides in from top (300ms)
- **Progress Bar**: Animated shimmer effect on reconnection progress
- **Pulse Dot**: Green dot pulses when connected
- **Fade In/Out**: Smooth transitions between states

## Responsive Design

- Mobile (<768px): Stacks content vertically, adjusts padding
- Tablet/Desktop: Horizontal layout with actions on right

## Accessibility

- Semantic HTML with proper ARIA labels
- Keyboard navigation support
- Clear visual feedback for all states
- Color contrast meets WCAG AA standards
