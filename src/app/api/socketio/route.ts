import { NextRequest, NextResponse } from 'next/server';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIO } from '@/types/next';

// Set up a Map to store socket connections
// This is needed since serverless functions are stateless
let io: ServerIO;

/**
 * Socket.IO API route compatible with Vercel serverless functions
 */
export async function GET(req: NextRequest) {
  // Check if we're in a serverless environment (like Vercel)
  const isServerless = process.env.VERCEL || process.env.NETLIFY;
  
  if (isServerless) {
    // In Vercel/serverless environments, real-time functionality is limited
    // Consider using Vercel Edge Runtime or external socket service like Pusher
    return NextResponse.json({ 
      success: true,
      warning: "Socket.IO has limited functionality in serverless environments. Consider using Vercel Edge Functions or a third-party service for true real-time features."
    });
  }
  
  try {
    // Get the response object
    const res = NextResponse.next() as NextApiResponseServerIO;
    
    // Check if socket.io server is already running
    if (res.socket?.server?.io) {
      return NextResponse.json({ success: true, message: "Socket.IO already running" });
    }
    
    // Initialize Socket.IO server
    io = new ServerIO(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    });
    
    // Store the io instance on the server
    res.socket.server.io = io;
    
    // Set up event handlers
    io.on('connection', (socket) => {
      console.log('A client connected', socket.id);
      
      // Handle team room joining
      socket.on('joinTeam', ({ teamName }) => {
        if (teamName) {
          socket.join(`team:${teamName}`);
          console.log(`Socket ${socket.id} joined team room: ${teamName}`);
        }
      });
      
      socket.on('disconnect', () => {
        console.log('A client disconnected', socket.id);
      });
    });
    
    return NextResponse.json({ success: true, message: "Socket.IO initialized" });
  } catch (error) {
    console.error('Error setting up Socket.IO:', error);
    return NextResponse.json({ success: false, error: 'Failed to initialize Socket.IO' }, { status: 500 });
  }
}

export function POST(req: NextRequest) {
  return NextResponse.json({ success: false, error: 'Method not allowed' }, { status: 405 });
} 