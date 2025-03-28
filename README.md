# Decryption Game

A real-time team-based cryptography challenge game where teams compete to decrypt messages.

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

## Admin Access

Access the admin panel at `/admin` with password: `admin123`

## Tech Stack

- Next.js 15
- React 19
- MongoDB with Mongoose
- Socket.IO for real-time features
- Tailwind CSS for styling
