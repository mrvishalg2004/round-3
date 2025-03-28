import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';
import GameState from '@/models/GameState';
import dbConnect from '@/utils/db';

// Store the Socket.IO server instance globally
let io: SocketIOServer | null = null;

export const getIO = () => {
  if (!io) {
    console.error('Socket.io not initialized! This may prevent real-time updates.');
    return null;
  }
  return io;
};

export const initSocket = (server: NetServer) => {
  if (!io) {
    console.log('Initializing Socket.io server...');
    
    // Create a new Socket.io server
    io = new SocketIOServer(server, {
      path: '/api/socketio',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });
    
    // Set up event handlers
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('joinTeam', (data) => {
        const { teamName } = data;
        if (teamName) {
          socket.join(`team:${teamName}`);
          console.log(`Client ${socket.id} joined team room: ${teamName}`);
        }
      });

      // Handle game status request from clients
      socket.on('getGameStatus', async () => {
        try {
          await dbConnect();
          const gameState = await GameState.findOne({});
          
          if (gameState) {
            // Send the game status directly to the requesting client
            socket.emit('gameStatusChange', {
              type: 'update',
              active: gameState.active,
              endTime: gameState.endTime,
              isPaused: gameState.isPaused,
              remainingTime: gameState.pausedTimeRemaining
            });
            console.log(`Sent game status to client ${socket.id}:`, {
              active: gameState.active,
              isPaused: gameState.isPaused
            });
          }
        } catch (error) {
          console.error('Error fetching game state for socket:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }
  
  return io;
};

export const emitLeaderboardUpdate = (
  leaderboard: any[],
  remainingSlots: number
) => {
  if (!io) return;
  io.emit('leaderboardUpdate', { leaderboard, remainingSlots });
};

export const emitGameComplete = () => {
  if (!io) return;
  io.emit('gameComplete');
};

export function emitGameStatusChange(data: any) {
  const io = getIO();
  if (!io) {
    console.error('Socket.io not initialized, cannot emit gameStatusChange');
    return;
  }
  
  // For reset events, ensure type is 'reset' and active=false
  if (data.reset) {
    data.type = 'reset';
    data.active = false;
    console.log('Emitting game RESET event to all clients');
  }
  
  // Log the event details for debugging
  console.log('Emitting gameStatusChange event:', {
    type: data.type,
    active: data.active,
    isPaused: data.isPaused,
    teamName: data.teamName || 'all',
    messageData: data.messageId ? 'included' : 'none'
  });
  
  io.emit('gameStatusChange', data);
}

export const emitTeamStatusChange = (teamName: string, isBlocked: boolean, message: string) => {
  if (!io) {
    console.error('Socket.io not initialized, cannot emit teamStatusChange');
    return;
  }
  
  try {
    // Emit to all clients in the team's room
    io.to(`team:${teamName}`).emit('teamStatusChange', {
      teamName,
      isBlocked,
      message
    });
    
    // Also broadcast to all clients for backup
    io.emit('teamStatusChange', {
      teamName,
      isBlocked,
      message
    });
    
    console.log(`teamStatusChange sent for team ${teamName}, blocked: ${isBlocked}`);
  } catch (error) {
    console.error('Error emitting teamStatusChange:', error);
  }
};

export const emitActiveMessageChanged = (messageId: string) => {
  if (!io) {
    console.error('Socket.io not initialized, cannot emit activeMessageChanged');
    return;
  }
  
  try {
    console.log(`Broadcasting activeMessageChanged for message ID: ${messageId}`);
    io.emit('activeMessageChanged', { messageId });
  } catch (error) {
    console.error('Error broadcasting activeMessageChanged:', error);
  }
};

// New function to notify teams of their specific message assignment
export const emitTeamMessageAssigned = (teamName: string, messageId: string) => {
  if (!io) {
    console.error('Socket.io not initialized, cannot emit teamMessageAssigned');
    return;
  }
  
  try {
    // Emit to the specific team room
    io.to(`team:${teamName}`).emit('teamMessageAssigned', { 
      teamName, 
      messageId,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Notified team ${teamName} of their assigned message: ${messageId}`);
  } catch (error) {
    console.error(`Error emitting teamMessageAssigned to ${teamName}:`, error);
  }
}; 