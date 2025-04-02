'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import Header from '@/components/Header';
import GameOver from '@/components/GameOver';
import EnrollmentForm from '@/components/EnrollmentForm';
import CountdownTimer from '@/components/CountdownTimer';
import DecryptionGame from '@/components/DecryptionGame';

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [email, setEmail] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTimeRemaining, setPausedTimeRemaining] = useState<number | undefined>(undefined);

  // Initialize socket connection
  useEffect(() => {
    if (!teamName) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      query: { teamName },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, [teamName]);

  // Initialize socket connection
  useEffect(() => {
    const initSocket = async () => {
      try {
        setLoading(true);
        
        // Initialize the game (setup database if needed)
        try {
          await axios.get('/api/init');
        } catch (err) {
          console.error('Init API error:', err);
          // Continue even if init fails - it might already be set up
        }
        
        // Get the window location for dynamic socket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `${protocol}//${host}`;
        
        console.log(`Connecting to socket at: ${socketUrl}`);
        
        // Create socket connection with fallback options
        const socketInstance = io({
          path: '/api/socketio',
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          transports: ['polling', 'websocket']
        });

        // Handle socket events
        socketInstance.on('connect', () => {
          console.log('Socket connected:', socketInstance.id);
          setSocket(socketInstance);
        });

        socketInstance.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
          // If we're on Vercel, we might need to use polling only
          if (window.location.hostname.includes('vercel.app')) {
            console.log('Detected Vercel environment, retrying with polling transport');
            // Close current socket
            socketInstance.close();
            
            // Retry with polling only
            const fallbackSocket = io({
              path: '/api/socketio',
              transports: ['polling'],
              reconnectionAttempts: 3
            });
            
            fallbackSocket.on('connect', () => {
              console.log('Fallback socket connected with polling:', fallbackSocket.id);
              setSocket(fallbackSocket);
            });
            
            fallbackSocket.on('connect_error', (fallbackErr) => {
              console.error('Fallback socket connection failed:', fallbackErr.message);
              setError('Connection error. Real-time updates may not be available.');
              // Still allow the app to function without real-time updates
              setLoading(false);
            });
          }
        });

        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
        });

        socketInstance.on('error', (err) => {
          console.error('Socket error:', err);
          setError('Connection error. Please refresh the page.');
        });

        socketInstance.on('gameStatusChange', (data) => {
          console.log('Game status changed:', data);
          
          if (data.type === 'pause') {
            setIsPaused(true);
            if (data.remainingTime) {
              setPausedTimeRemaining(data.remainingTime);
            }
          } else if (data.type === 'resume') {
            setIsPaused(false);
            if (data.endTime) {
              setEndTime(new Date(data.endTime));
            }
          } else if (data.type === 'start') {
            setIsGameActive(true);
            setIsGameOver(false); // Make sure game over is reset when game starts
            if (data.endTime) {
              setEndTime(new Date(data.endTime));
            }
            setIsPaused(false);
          } else if (data.type === 'stop' || data.type === 'reset') {
            setIsGameActive(false); // Just mark game as inactive
            // Do NOT set isGameOver to true here
          } else if (data.type === 'gameComplete' || data.type === 'end') {
            // Only set isGameOver when the game is truly over (all winners found)
            setIsGameOver(true);
          }
        });

        socketInstance.on('teamStatusChange', (data) => {
          console.log('Team status changed:', data);
          
          // Check if the update is for this team
          const savedTeamName = localStorage.getItem('teamName');
          if (savedTeamName && data.teamName === savedTeamName) {
            if (data.isBlocked) {
              setIsBlocked(true);
              
              // Show custom message if provided, otherwise show default message
              const blockMessage = data.message || 'Your team has been blocked by an administrator.';
              alert(blockMessage);
              
              // Clear local storage and reload after a delay
              setTimeout(() => {
                localStorage.removeItem('teamName');
                localStorage.removeItem('email');
                window.location.reload();
              }, 2000);
            } else if (data.isBlocked === false) {
              // Team has been unblocked
              setIsBlocked(false);
              
              // Show unblock message if provided
              if (data.message) {
                alert(data.message);
              }
            }
          }
        });

        // Check if already enrolled
        const savedTeamName = localStorage.getItem('teamName');
        const savedEmail = localStorage.getItem('email');
        
        if (savedTeamName && savedEmail) {
          setTeamName(savedTeamName);
          setEmail(savedEmail);
          setEnrolled(true);
          
          // Join the team room
          socketInstance.emit('joinTeam', { teamName: savedTeamName });
          console.log('Joined team room:', savedTeamName);
        }

        // Fetch initial game state
        await fetchGameState();

      } catch (err) {
        console.error('Failed to initialize:', err);
        setError('Failed to initialize the game. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    // Fetch game state
    const fetchGameState = async () => {
      try {
        const response = await axios.get('/api/game-state');
        
        if (response.data) {
          const { active, startTime, endTime: gameEndTime, isPaused: gamePaused, pausedTimeRemaining: gamePausedTime } = response.data;
          
          setIsGameActive(active);
          
          if (gameEndTime) {
            setEndTime(new Date(gameEndTime));
          }
          
          setIsPaused(gamePaused);
          
          if (gamePausedTime) {
            setPausedTimeRemaining(gamePausedTime);
          }
          
          // Don't automatically set game over if the game is inactive
          // We only want game over state when explicitly triggered
        }
      } catch (err) {
        console.error('Error fetching game state:', err);
      }
    };

    initSocket();

    return () => {
      if (socket) {
        console.log('Cleaning up socket connection');
        socket.disconnect();
      }
    };
  }, []);

  // Function to handle enrolling in the game
  const handleEnroll = async (newTeamName: string, newEmail: string) => {
    try {
      setLoading(true);
      
      // Call the API to register the team
      const response = await axios.post('/api/enroll', {
        teamName: newTeamName,
        email: newEmail
      });
      
      console.log('Team registered:', response.data);
      
      // If registration was successful, update the local state
      if (response.data.success) {
        setTeamName(newTeamName);
        setEmail(newEmail);
        setEnrolled(true);
        
        // Store in local storage for persistence
        localStorage.setItem('teamName', newTeamName);
        localStorage.setItem('email', newEmail);
        
        // Join the team room in socket.io if socket exists
        if (socket) {
          socket.emit('joinTeam', { teamName: newTeamName });
          console.log('Joined team room:', newTeamName);
        }
      } else {
        // Show error if registration failed
        setError(response.data.error || 'Failed to register team. Please try again.');
      }
    } catch (err: any) {
      console.error('Error enrolling team:', err);
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
      // Reset enrollment to false in case of error
      setEnrolled(false);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle game over
  const handleGameOver = () => {
    setIsGameOver(true);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading the decryption challenge...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <Header teamName={teamName} />
      
      <div className="container mx-auto px-4 py-8">
        {!enrolled ? (
          // Enrollment Form
          <EnrollmentForm onEnroll={handleEnroll} />
        ) : isGameOver ? (
          // Only show Game Over screen when the game is truly over (all winners found)
          <GameOver />
        ) : (
          // For all other states (active, inactive, paused), show the DecryptionGame component
          // which will handle showing the appropriate state messages
          <DecryptionGame
            socket={socket}
            teamName={teamName}
            email={email}
            onGameOver={handleGameOver}
            endTime={endTime}
            isPaused={isPaused}
            pausedTimeRemaining={pausedTimeRemaining}
          />
        )}
      </div>
    </main>
  );
}
