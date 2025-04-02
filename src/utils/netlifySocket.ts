import { io, Socket } from 'socket.io-client';

// Function to initialize socket connection optimized for Netlify
export const initNetlifySocket = (teamName: string): Socket => {
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
  console.log(`Initializing Netlify socket connection at: ${socketUrl}`);
  
  // First try with WebSocket transport (works better with Netlify)
  const socket = io(socketUrl, {
    query: { teamName },
    path: '/api/socketio',
    transports: ['websocket'], // WebSocket only for Netlify
    timeout: 15000,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
  });
  
  // Set up fallback to polling if websocket fails
  socket.on('connect_error', (err) => {
    console.error('WebSocket connection error:', err.message);
    
    // If the connection error is related to transport
    if (err.message.includes('websocket')) {
      console.log('Falling back to polling transport');
      
      // Disconnect and reconnect with polling
      socket.disconnect();
      
      // Update socket options to use polling
      socket.io.opts.transports = ['polling'];
      
      // Reconnect
      socket.connect();
    }
  });
  
  return socket;
};

// Helper to check if environment is Netlify
export const isNetlifyEnvironment = (): boolean => {
  return typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     process.env.NETLIFY === 'true');
};

// Helper to check if Netlify socket server is available
export const checkNetlifySocketServer = async (): Promise<boolean> => {
  try {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const response = await fetch(`${socketUrl}/api/socketio`);
    return response.ok;
  } catch (err) {
    console.error('Failed to check Netlify socket server:', err);
    return false;
  }
}; 