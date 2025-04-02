const { Server } = require('socket.io');
const { createServer } = require('http');

exports.handler = async (event, context) => {
  // For initial verification
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ success: true, message: 'Socket.IO Netlify function is running' })
    };
  }

  // For WebSocket connections (will be handled by Socket.IO)
  const server = createServer();
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type']
    },
    path: '/api/socketio',
    transports: ['websocket', 'polling']
  });

  // Set up socket connection handlers
  io.on('connection', (socket) => {
    console.log('Client connected to Netlify socket:', socket.id);
    
    socket.on('joinTeam', (data) => {
      const { teamName } = data;
      if (teamName) {
        socket.join(`team:${teamName}`);
        console.log(`Client ${socket.id} joined team room: ${teamName}`);
      }
    });
    
    socket.on('getGameStatus', async () => {
      try {
        // In a serverless function, you'll need to fetch game state from your database
        // This is a placeholder - implement your database access here
        const gameState = {
          active: true, // Example value
          isPaused: false,
          endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          pausedTimeRemaining: null
        };
        
        socket.emit('gameStatusChange', {
          type: 'update',
          active: gameState.active,
          endTime: gameState.endTime,
          isPaused: gameState.isPaused,
          remainingTime: gameState.pausedTimeRemaining
        });
        
        console.log(`Sent game status to client ${socket.id}`);
      } catch (error) {
        console.error('Error fetching game state for socket:', error);
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Client disconnected from Netlify socket:', socket.id);
    });
  });

  // For WebSocket upgrade requests
  if (event.headers['Upgrade'] === 'websocket') {
    // Handle WebSocket upgrade
    return {
      statusCode: 101, // Switching Protocols
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Accept': event.headers['Sec-WebSocket-Key'] // This should be properly hashed, simplified here
      }
    };
  }

  // For regular HTTP requests
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify({ success: true, message: 'Socket.IO Netlify function is running' })
  };
}; 