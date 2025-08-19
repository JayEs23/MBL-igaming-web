# Alert System Documentation

## Overview

The alert system provides a clean, consistent way to display success, error, warning, and info messages across the application. It includes auto-dismiss functionality, animations, and mobile responsiveness.

## Features

- ✅ **4 Alert Types**: Success, Error, Warning, Info
- ✅ **Auto-dismiss**: Configurable duration (default: 4-6 seconds)
- ✅ **Manual close**: Users can close alerts manually
- ✅ **Multiple alerts**: Support for multiple alerts simultaneously
- ✅ **Animations**: Smooth slide-in/slide-out animations
- ✅ **Mobile responsive**: Optimized for all screen sizes
- ✅ **Global context**: Easy to use anywhere in the app

## Usage

### 1. Basic Usage

```tsx
import { useAlert } from '../contexts/AlertContext';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useAlert();

  const handleSuccess = () => {
    showSuccess('Operation completed successfully!');
  };

  const handleError = () => {
    showError('Something went wrong. Please try again.');
  };

  const handleWarning = () => {
    showWarning('Please check your input before proceeding.');
  };

  const handleInfo = () => {
    showInfo('This is an informational message.');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleInfo}>Show Info</button>
    </div>
  );
};
```

### 2. With Titles

```tsx
const { showSuccess, showError } = useAlert();

// With title
showSuccess('User profile updated successfully!', 'Profile Updated');

// Error with title
showError('Invalid credentials provided', 'Authentication Failed');
```

### 3. Custom Duration

```tsx
const { showAlert } = useAlert();

// Custom duration (in milliseconds)
showAlert({
  type: 'success',
  message: 'Custom duration message',
  duration: 10000, // 10 seconds
});

// No auto-dismiss
showAlert({
  type: 'error',
  message: 'Critical error - requires manual dismissal',
  duration: 0, // No auto-dismiss
});
```

### 4. Advanced Usage

```tsx
const { showAlert } = useAlert();

// Full control over alert properties
showAlert({
  type: 'warning',
  message: 'This is a detailed warning message with multiple lines of text.',
  title: 'Warning',
  duration: 8000,
  onClose: () => {
    console.log('Alert was closed');
  }
});
```

## Alert Types

| Type | Color | Icon | Default Duration | Use Case |
|------|-------|------|------------------|----------|
| `success` | Green | ✓ | 4 seconds | Successful operations |
| `error` | Red | ✕ | 6 seconds | Errors and failures |
| `warning` | Yellow | ⚠ | 5 seconds | Warnings and cautions |
| `info` | Blue | ℹ | 4 seconds | Informational messages |

## Backend Integration

The alert system is designed to work seamlessly with the backend error structure:

```tsx
// Backend returns: { status: 'error', message: 'Username already taken' }
const handleApiCall = async () => {
  try {
    const response = await fetch('/api/endpoint');
    const data = await response.json();
    
    if (data.status === 'success') {
      showSuccess(data.message);
    } else {
      showError(data.message);
    }
  } catch (error) {
    showError('Network error. Please check your connection.');
  }
};
```

## Styling

Alerts are positioned in the top-right corner by default and are fully responsive:

- **Desktop**: Fixed position, top-right, max-width 400px
- **Tablet**: Responsive margins, full-width on small screens
- **Mobile**: Full-width with reduced padding

## Accessibility

- Alerts are announced to screen readers
- Keyboard navigation support
- High contrast colors for visibility
- Clear close buttons

## Best Practices

1. **Be specific**: Use clear, actionable messages
2. **Keep it short**: Messages should be concise
3. **Use appropriate types**: Match the alert type to the message severity
4. **Don't spam**: Avoid showing too many alerts at once
5. **Handle errors gracefully**: Always provide fallback error messages

## Examples from the Codebase

### Authentication Errors
```tsx
if (error.message.includes('Invalid credentials')) {
  showError('Invalid username. Please check your credentials.');
} else if (error.message.includes('Username already taken')) {
  showError('Username is already taken. Please choose a different one.');
}
```

### Session Operations
```tsx
// Success
showSuccess('Session started successfully! Players can now join.');

// Error
showError('Cannot join session. Session is full or has ended.');

// Info
showInfo('Joining game session...');
```
