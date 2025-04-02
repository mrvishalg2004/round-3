# Decryption Challenge Game

A real-time decryption challenge game built with Next.js and Socket.IO.

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm

### Installation
1. Clone the repository
2. Install dependencies
```bash
npm install
```

### Environment Setup
Create a `.env.local` file in the root directory and add the following:
```
MONGODB_URI=mongodb+srv://rounds:rounds123@aiodysseyrounds.rr88p.mongodb.net/?retryWrites=true&w=majority&appName=AIODYSSEYRounds
NEXT_PUBLIC_SOCKET_URL=http://localhost:8009
```

### Important: Running the Socket.IO Server
This application requires the custom Socket.IO server to be running alongside the Next.js app.

**Option 1: Run both together (recommended)**
```bash
npm run dev:all
```

**Option 2: Run separately**
In one terminal:
```bash
npm run dev
```

In another terminal:
```bash
npm run start:server
```

### Troubleshooting Socket Connection Issues

If you see the error "Connection error. Please check your internet connection and try again" after clicking "Join Challenge":

1. Make sure the custom server is running with `npm run start:server`
2. Verify the `NEXT_PUBLIC_SOCKET_URL` is set correctly in `.env.local`
3. Check the browser console for connection logs

## Game Structure

### Player Side
- Enter team name and email
- Join the decryption challenge
- Solve encrypted messages
- Submit solutions

### Admin Side
- Start/stop the game
- Pause/resume the game
- Monitor team progress
- View game statistics

## Admin Access
Access the admin panel at: http://localhost:3000/admin
Password: admin123

## Features

- Real-time team competition with Socket.IO
- Multiple encryption types (Caesar, Base64, Morse, Binary, etc.)
- Admin panel for game management
- Winner tracking and leaderboard
- Message assignment system
- Animated celebration effects

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Create a `.env.local` file with:
   ```
   MONGODB_URI=mongodb+srv://rounds:rounds123@aiodysseyrounds.rr88p.mongodb.net/?retryWrites=true&w=majority&appName=AIODYSSEYRounds
   NEXT_PUBLIC_SOCKET_URL=http://localhost:8009
   ```
4. Run the system check:
   ```bash
   npm run system-check
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Visit `http://localhost:8009` for the game and `http://localhost:8009/admin` for the admin panel.

## Deploying to Vercel

### Prerequisites

- A [Vercel](https://vercel.com) account
- The [Vercel CLI](https://vercel.com/cli) installed (optional for command-line deployment)

### Deployment Steps

1. **Set up Environment Variables**
   - In your Vercel project settings, add the following environment variable:
     - `MONGODB_URI`: Your MongoDB connection string

2. **Deploy via Vercel Dashboard**
   - Push your code to a GitHub, GitLab, or Bitbucket repository
   - Import the project in the Vercel dashboard
   - Configure the environment variables
   - Deploy

3. **Deploy via Vercel CLI**
   ```bash
   # Login to Vercel
   vercel login

   # Deploy
   vercel
   ```

4. **Production Deployment**
   ```bash
   vercel --prod
   ```

### Important Notes for Vercel Deployment

- Socket.IO functionality may be limited in serverless environments. Consider using [Vercel Edge Functions](https://vercel.com/features/edge-functions) or a third-party service like [Pusher](https://pusher.com/) for full real-time capabilities.
- Database seeding should be done separately, either locally or through a dedicated endpoint protected by authentication.

## Deploying to Netlify

### Prerequisites

- A [Netlify](https://netlify.com) account
- Git repository with your project

### Deployment Steps

1. **Set up Environment Variables**
   - In your Netlify project settings, add the following environment variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `NEXT_PUBLIC_SOCKET_URL`: Your Netlify app URL (e.g., `https://your-app-name.netlify.app`)

2. **Deploy via Netlify Dashboard**
   - Connect your Git repository to Netlify
   - Set the build command to `npm run build`
   - Set the publish directory to `.next`
   - Add the environment variables
   - Deploy the site

3. **Configure Socket.IO for Netlify**
   - Netlify is a serverless platform, so Socket.IO needs special handling
   - The included `netlify.toml` file sets up the necessary redirects
   - The `netlify/functions/socketio.js` function handles Socket.IO connections

4. **Verify Socket.IO Connection**
   - After deployment, verify that Socket.IO is working by:
     - Checking the Netlify function logs
     - Testing the connection in your browser
     - Ensuring the `/api/socketio` endpoint returns a 200 status

### Troubleshooting Netlify Socket.IO

If you encounter socket connection issues on Netlify:

1. Check your Netlify function logs for errors
2. Ensure `NEXT_PUBLIC_SOCKET_URL` is set to your Netlify deployment URL
3. Verify that the `netlify.toml` file is properly configured
4. Try using the WebSocket transport only by updating the client configuration:
   ```javascript
   const socketInstance = io(socketUrl, {
     query: { teamName },
     path: '/api/socketio',
     transports: ['websocket'], // WebSocket only
     timeout: 10000,
     reconnectionAttempts: 5,
     reconnectionDelay: 1000,
     autoConnect: true,
   });
   ```

## Tech Stack

- Next.js 15
- React 19
- MongoDB with Mongoose
- Socket.IO for real-time features
- Tailwind CSS for styling
