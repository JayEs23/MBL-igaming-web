# Backend Integration Guide

## Backend Deployment Status

Your backend is deployed at: `https://mbl-igaming.onrender.com`

## API Configuration

The web frontend is already configured to use this production URL by default in `src/config/api.ts`.

## Environment Variables (Optional)

For local development, you can create a `.env.local` file:

```env
VITE_API_URL=http://localhost:4000
```

For production, no configuration is needed - it automatically uses the production backend.

## Testing the Connection

1. **Build and deploy** your web frontend
2. **Test API calls** to ensure they reach the backend
3. **Check browser network tab** to verify requests go to `https://mbl-igaming.onrender.com`

## Deployment Steps

1. **Build**: `npm run build:prod`
2. **Deploy** the `dist/` folder to your hosting service
3. **No additional configuration** needed for production

## Troubleshooting

- If API calls fail, verify the backend is running at `https://mbl-igaming.onrender.com`
- Check that your web frontend is making requests to the correct URL
- Ensure CORS is properly configured on the backend (should be handled by NestJS)
