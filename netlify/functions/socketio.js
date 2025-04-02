const { Server } = require('socket.io');
const { createServer } = require('http');

// Simulated game state for serverless environment
const simulatedGameState = {
  active: true,
  isPaused: false,
  endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
  pausedTimeRemaining: null
};

exports.handler = async (event, context) => {
  console.log('Socket.IO function called with method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers));
  
  // Setup CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '2592000', // 30 days
    'Content-Type': 'application/json'
  };
  
  // Handle OPTIONS requests (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }
  
  // For initial verification or health check
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: 'Socket.IO Netlify function is running',
        timestamp: new Date().toISOString(),
        gameState: simulatedGameState
      })
    };
  }
  
  // For POST requests (fallback for socket.io polling)
  if (event.httpMethod === 'POST') {
    try {
      // Parse the request body if present
      let requestData = {};
      if (event.body) {
        try {
          requestData = JSON.parse(event.body);
        } catch (e) {
          console.error('Error parsing request body:', e);
        }
      }
      
      // Handle different types of socket.io requests
      if (requestData.type === 'getGameStatus') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            type: 'gameStatusChange',
            active: simulatedGameState.active,
            endTime: simulatedGameState.endTime,
            isPaused: simulatedGameState.isPaused,
            remainingTime: simulatedGameState.pausedTimeRemaining
          })
        };
      }
      
      // Generic response for other POST requests
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Socket.IO message received',
          data: requestData
        })
      };
    } catch (error) {
      console.error('Error handling POST request:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false, 
          message: 'Error processing Socket.IO request', 
          error: error.message 
        })
      };
    }
  }
  
  // Handle WebSocket upgrade requests
  if (event.headers.Upgrade && event.headers.Upgrade.toLowerCase() === 'websocket') {
    return {
      statusCode: 426, // Upgrade Required
      headers: {
        ...headers,
        'Connection': 'Upgrade',
        'Upgrade': 'websocket'
      },
      body: JSON.stringify({
        message: 'WebSocket connections are not fully supported in serverless functions. Use long-polling instead.'
      })
    };
  }
  
  // Default response for unsupported methods
  return {
    statusCode: 405, // Method Not Allowed
    headers,
    body: JSON.stringify({ 
      success: false, 
      message: 'Method not allowed. Use GET for health checks or POST for socket communication.' 
    })
  };
}; 