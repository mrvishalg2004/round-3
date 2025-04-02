import { io, Socket } from 'socket.io-client';

// Function to initialize socket connection optimized for Netlify
export const initNetlifySocket = (teamName: string): Socket => {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
  console.log(`Initializing Netlify socket connection at: ${socketUrl}`);
  
  // Configure socket with optimized Netlify settings
  const socket = io(socketUrl, {
    query: { teamName },
    path: '/api/socketio',
    transports: ['polling'], // Start with polling for more reliable Netlify connection
    timeout: 20000, // Increased timeout
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
    forceNew: true, // Create a new connection every time
  });
  
  // Log connection events for debugging
  socket.on('connect', () => {
    console.log('Netlify socket connected successfully with ID:', socket.id);
  });
  
  socket.on('connect_error', (err) => {
    console.error('Netlify socket connection error:', err.message);
    console.log('Socket connection options:', socket.io.opts);
    
    // Try different transport strategy after failures
    if (socket.io.backoff.attempts > 2) {
      console.log('Multiple connection failures, trying alternative transport');
      socket.io.opts.transports = ['websocket'];
    }
  });
  
  socket.on('reconnect_attempt', (attempt) => {
    console.log(`Netlify socket reconnection attempt ${attempt}`);
  });
  
  socket.on('reconnect', (attempts) => {
    console.log(`Netlify socket reconnected after ${attempts} attempts`);
  });
  
  socket.on('error', (err) => {
    console.error('Netlify socket error:', err);
  });
  
  return socket;
};

// Helper to check if environment is Netlify
export const isNetlifyEnvironment = (): boolean => {
  return typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     process.env.NETLIFY === 'true' ||
     window.location.hostname !== 'localhost');
};

// Helper to check if Netlify socket server is available
export const checkNetlifySocketServer = async (): Promise<boolean> => {
  try {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    console.log(`Checking Netlify socket server at: ${socketUrl}/api/socketio`);
    
    // Use POST method as GET might be blocked by CORS
    const response = await fetch(`${socketUrl}/api/socketio`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Netlify socket server check response:', response.status);
    return response.ok;
  } catch (err) {
    console.error('Failed to check Netlify socket server:', err);
    return false;
  }
}; 