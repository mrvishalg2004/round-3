# Vercel Deployment Guide

This guide will help you deploy the Decryption Game application to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. MongoDB Atlas account with a working database cluster

## Step 1: Prepare Your Environment Variables

You'll need to set up the following environment variables in Vercel:

- `MONGODB_URI`: Your MongoDB connection string
  Example: `mongodb+srv://username:password@cluster.mongodb.net/decryption-game?retryWrites=true&w=majority`

## Step 2: Deploy to Vercel

### Option A: Deploy via the Vercel Dashboard

1. Log in to your [Vercel dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure the project:
   - Framework Preset: Next.js
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next`
   - Install Command: `npm install`
   - Development Command: `npm run vercel-start`
5. Add the environment variables from Step 1
6. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to your project directory and deploy:
   ```bash
   vercel
   ```

4. Follow the interactive prompts and provide the required environment variables.

5. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 3: Initialize the Database

Since we're using a custom server in development but not in Vercel's serverless environment, we need to initialize the database:

1. After deployment, make a GET request to `/api/init` endpoint:
   ```bash
   curl https://your-vercel-app.vercel.app/api/init
   ```

2. This will set up the initial database collections and schema.

## Step 4: Verify Socket.IO Functionality

Socket.IO works differently in serverless environments. To verify:

1. Visit your deployed application
2. Check browser console for socket connection messages
3. Test real-time features like game state changes

### Socket.IO in Serverless Environment

Note that Socket.IO in serverless environments has limitations:

- WebSocket connections may fall back to long-polling
- Disconnections are more frequent
- Room functionality may be limited

For production apps with heavy real-time requirements, consider:
- Using [Vercel Edge Functions](https://vercel.com/features/edge-functions)
- Using a third-party service like [Pusher](https://pusher.com/)
- Deploying a separate WebSocket server

## Troubleshooting

### MongoDB Connection Issues

If you see MongoDB connection errors:

1. Verify your MongoDB URI is correctly set in environment variables
2. Ensure your MongoDB Atlas cluster allows connections from anywhere (0.0.0.0/0)
3. Check if your MongoDB user has the correct permissions

### Socket.IO Connection Issues

If real-time updates aren't working:

1. Check browser console for connection errors
2. Verify the client is configured to use polling as a fallback
3. Ensure your Socket.IO path is correctly set to `/api/socketio`

### Build Failures

If you encounter build failures:

1. Check Vercel deployment logs
2. Verify that TypeScript and ESLint checks are disabled for builds in `next.config.mjs`
3. Ensure all dependencies are correctly installed

## Need Help?

If you encounter issues during deployment, you can:

- Check the Vercel deployment logs
- Refer to [Vercel's documentation](https://vercel.com/docs)
- Troubleshoot common [Next.js deployment issues](https://nextjs.org/docs/deployment) 