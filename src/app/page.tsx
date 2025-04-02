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

  // Function to handle enrolling in the game
  const handleEnroll = async (newTeamName: string, newEmail: string) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Call the API to register the team
      const response = await axios.post('/api/enroll', {
        teamName: newTeamName,
        email: newEmail
      });
      
      console.log('Team registered:', response.data);
      
      // If registration was successful, update the local state
      if (response.data.success) {
        // Store in local storage first so socket connection has access to it
        localStorage.setItem('teamName', newTeamName);
        localStorage.setItem('email', newEmail);
        
        setTeamName(newTeamName);
        setEmail(newEmail);
        
        // Set enrolled first, then initiate socket connection via useEffect
        setEnrolled(true);
        
        // Clear any previous socket
        if (socket) {
          socket.disconnect();
          setSocket(null);
        }
        
        setLoading(false); // Finish loading here to avoid UI lag
      } else {
        // Show error if registration failed
        setError(response.data.error || 'Failed to register team. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error enrolling team:', err);
      const errorMessage = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(errorMessage);
      // Reset enrollment to false in case of error
      setEnrolled(false);
      setLoading(false);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    if (!teamName) {
      setLoading(false); // No need to load if not enrolled
      return;
    }

    console.log(`Initializing socket connection for team: ${teamName}`);
    setLoading(true);
    
    let socketConnectTimeout: NodeJS.Timeout;
    
    const initSocket = () => {
      try {
        // Get the window location for dynamic socket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || `${protocol}//${host}`;
        
        console.log(`Connecting to socket at: ${socketUrl}`);
        
        // Create socket connection with basic settings first
        const socketInstance = io(socketUrl, {
          query: { teamName },
          path: '/api/socketio',
          transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
          timeout: 10000,
          autoConnect: true
        });

        // Set connection timeout
        socketConnectTimeout = setTimeout(() => {
          if (!socketInstance.connected) {
            console.log('Socket connection timeout, falling back to long polling');
            // Recreate socket with polling only
            socketInstance.disconnect();
            
            const fallbackSocket = io(socketUrl, {
              query: { teamName },
              path: '/api/socketio',
              transports: ['polling'], // Polling only as fallback
              timeout: 20000
            });
            
            setupSocketHandlers(fallbackSocket);
          }
        }, 5000);

        setupSocketHandlers(socketInstance);
        
        function setupSocketHandlers(socket: Socket) {
          socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            clearTimeout(socketConnectTimeout);
            setSocket(socket);
            setError(null);
            setLoading(false);
            
            // Join team room after successful connection
            socket.emit('joinTeam', { teamName });
            console.log('Joined team room:', teamName);
            
            // Get current game state
            fetchGameState();
          });

          socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            clearTimeout(socketConnectTimeout);
            
            // Set error after a delay
            setTimeout(() => {
              if (!socket.connected) {
                console.log('Socket still not connected after delay');
                setError('Connection error. Please check your internet connection and try again.');
                setLoading(false);
              }
            }, 3000);
          });

          socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
              socket.connect();
            }
          });

          socket.on('error', (err) => {
            console.error('Socket error:', err);
            setError('Connection error. Please refresh the page.');
          });

          socket.on('gameStatusChange', (data) => {
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
              setIsGameOver(false);
              if (data.endTime) {
                setEndTime(new Date(data.endTime));
              }
              setIsPaused(false);
            } else if (data.type === 'stop' || data.type === 'reset') {
              setIsGameActive(false);
            } else if (data.type === 'gameComplete' || data.type === 'end') {
              setIsGameOver(true);
            }
          });

          socket.on('teamStatusChange', (data) => {
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
        }

      } catch (err) {
        console.error('Failed to initialize socket:', err);
        setError('Failed to initialize the game. Please refresh the page.');
        setLoading(false);
      }
    };

    // Fetch game state
    const fetchGameState = async () => {
      try {
        console.log('Fetching initial game state');
        const response = await axios.get('/api/game-state');
        
        if (response.data) {
          console.log('Game state response:', response.data);
          const { active, startTime, endTime: gameEndTime, isPaused: gamePaused, pausedTimeRemaining: gamePausedTime } = response.data;
          
          setIsGameActive(active);
          
          if (gameEndTime) {
            setEndTime(new Date(gameEndTime));
          }
          
          setIsPaused(gamePaused);
          
          if (gamePausedTime) {
            setPausedTimeRemaining(gamePausedTime);
          }
        }
      } catch (err) {
        console.error('Error fetching game state:', err);
      }
    };

    initSocket();

    return () => {
      // Clean up on unmount
      if (socket) {
        console.log('Cleaning up socket connection');
        socket.disconnect();
      }
      clearTimeout(socketConnectTimeout);
    };
  }, [teamName]);

  // Function to handle game over
  const handleGameOver = () => {
    setIsGameOver(true);
  };

  // Loading state
  if (loading && !enrolled) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading the decryption challenge...</p>
          {!socket?.connected && (
            <p className="text-yellow-600 mt-2">Connecting to game server...</p>
          )}
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
