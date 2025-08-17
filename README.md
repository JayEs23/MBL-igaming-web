# MBL iGaming Frontend

A React-based gaming lobby frontend that provides real-time session management, user authentication, and a responsive gaming interface for the number-picking game.

## What This Does

This frontend handles the user experience for a gaming platform where users can join sessions, pick numbers 1-9, and see real-time results. It's built to be responsive, user-friendly, and handles the gaming flow from login to session completion.

## Tech Stack

- **React 18** - Main UI framework with hooks and functional components
- **TypeScript** - Type safety and better developer experience
- **React Router** - Client-side routing and navigation
- **Context API** - State management for auth and sessions
- **CSS Modules** - Scoped styling without external dependencies
- **Vite** - Fast build tool and dev server

## Core Features

### User Experience

- **Authentication Flow** - Login/register with JWT tokens
- **Session Management** - Real-time session status and countdowns
- **Game Interface** - Number picking, session joining, results display
- **Responsive Design** - Works on desktop and mobile
- **Real-time Updates** - Session status updates every few seconds

### Gaming Flow

- **Session Discovery** - See current pending/active sessions
- **Join Mechanics** - Pick numbers 1-9 when joining
- **Live Countdown** - Real-time session timer
- **Results Display** - Winner announcements and statistics
- **Leaderboard** - Player rankings and win tracking

### Session States

- **Pending** - Waiting for players, auto-start countdown
- **Active** - Game in progress, number picking disabled
- **Ended** - Results displayed, winners announced

## How It Works

### Authentication Flow

1. **Login/Register** - Username-based auth (no passwords for simplicity)
2. **JWT Storage** - Tokens stored in localStorage
3. **Protected Routes** - Auth context guards all game routes
4. **Auto-logout** - Handles token expiration gracefully

### Session Management

- **Polling** - Fetches session data every 3 seconds
- **Real-time Updates** - Countdown timers update every second
- **State Synchronization** - Frontend state stays in sync with backend
- **Error Handling** - Graceful fallbacks when API calls fail

### Game Logic

- **Number Validation** - Ensures picks are 1-9 only
- **Session Joining** - Handles full sessions with queue system
- **Results Display** - Shows winners, user results, and statistics
- **Navigation** - Seamless flow between game states

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts for state management
├── pages/              # Main application pages
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── config/             # Configuration and constants
└── styles/             # Global styles and CSS modules
```

### Key Components

- **Layout** - Main app structure and navigation
- **AuthPage** - Login/register interface
- **HomePage** - Session overview and joining
- **GamePage** - Active gaming interface
- **ResultsPage** - Session results and statistics
- **LeaderboardPage** - Player rankings

### State Management

- **AuthContext** - User authentication state
- **SessionContext** - Current session data
- **Local State** - Component-specific state
- **API Integration** - Real-time data fetching

## Setup & Development

### Prerequisites

- Node.js 20+
- npm/yarn
- Backend API running

### Installation

```bash
npm install
npm run dev
```

### Environment Variables

```env
VITE_API_URL=http://localhost:4000
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Development Workflow

### State Updates

- **Session Data** - Fetched every 3 seconds via polling
- **Countdown Timers** - Updated every second for real-time feel
- **User Actions** - Immediate UI updates with API calls
- **Error Handling** - Graceful fallbacks and user feedback

### API Integration

- **Service Layer** - Centralized API calls in GameService
- **Error Handling** - Retry logic and fallback endpoints
- **Authentication** - JWT tokens in request headers
- **Real-time Sync** - Frontend stays in sync with backend state

### Responsive Design

- **Mobile First** - Designed for mobile, enhanced for desktop
- **CSS Modules** - Scoped styling prevents conflicts
- **Flexbox/Grid** - Modern CSS layout techniques
- **Touch Friendly** - Optimized for mobile interactions

## Production Build

### Build Process

```bash
npm run build
```

### Output

- **Static Files** - HTML, CSS, JS bundles
- **Optimized Assets** - Minified and compressed
- **Environment Config** - API URLs and constants
- **Service Worker Ready** - Structure supports PWA features

### Deployment

- **Static Hosting** - Can deploy to any static host
- **CDN Ready** - Optimized for content delivery
- **Environment Variables** - Built-time configuration
- **API Configuration** - Backend URL configuration

## What's Next

- **WebSocket Integration** - Real-time updates without polling
- **PWA Features** - Offline support and app-like experience
- **Advanced Animations** - Smooth transitions and micro-interactions
- **Theme System** - Dark/light mode and customization
- **Performance Optimization** - Code splitting and lazy loading
- **Testing** - Unit tests and integration tests

## Why This Architecture

Built this way because:

- **React 18** gives modern features without complexity
- **Context API** is sufficient for this scale (no need for Redux)
- **TypeScript** catches errors early and improves DX
- **CSS Modules** keeps styling organized and scoped
- **Vite** is fast and modern for development
- **Polling approach** is simple and reliable for real-time updates

The goal was to build a responsive, user-friendly gaming interface that handles real-time updates efficiently. It's designed to be fast, maintainable, and provide a smooth gaming experience across devices.

## Performance Considerations

- **Efficient Polling** - 3-second intervals for session data
- **Optimized Re-renders** - React.memo and useCallback where needed
- **Bundle Size** - Tree-shaking and code splitting ready
- **Image Optimization** - Optimized assets and lazy loading support
- **Memory Management** - Proper cleanup of intervals and listeners
