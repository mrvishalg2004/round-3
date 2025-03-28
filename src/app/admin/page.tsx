'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { toast, Toaster } from 'react-hot-toast';

interface Problem {
  _id: string;
  title: string;
  description: string;
  quote: string;
  expectedAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  active: boolean;
  createdAt: string;
}

interface EnrolledTeam {
  _id: string;
  teamName: string;
  email: string;
  isBlocked: boolean;
  qualified: boolean;
  win?: boolean;
  lose?: boolean;
}

interface GameState {
  active: boolean;
  startTime: string | null;
  endTime: string | null;
  duration: number;
  isPaused?: boolean;
  pausedTimeRemaining?: number;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeMessage, setActiveMessage] = useState<string>('');
  const [winners, setWinners] = useState<any[]>([]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io({
      path: '/api/socketio',
    });

    socketInstance.on('connect', () => {
      console.log('Admin socket connected:', socketInstance.id);
      setSocket(socketInstance);
    });

    socketInstance.on('gameStatusChange', (data) => {
      console.log('Game status changed:', data);
      fetchGameState();
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    const adminPwd = localStorage.getItem('adminPwd');
    if (adminPwd === 'vishal@#7798' || password === 'vishal@#7798') {
      setAuthenticated(true);
      fetchData();
    } else {
      setLoading(false);
    }
  }, [authenticated, password]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchGameState(),
        fetchTeams(),
        fetchMessages(),
        fetchWinners()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGameState = async () => {
    try {
      const response = await axios.get('/api/game-state');
      setGameState(response.data);
    } catch (err) {
      console.error('Error fetching game state:', err);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get('/api/admin/teams');
      console.log('Teams API response:', response.data);
      setTeams(response.data.teams || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get('/api/admin/messages');
      setMessages(response.data.messages || []);
      
      // Find active message
      const active = response.data.messages.find((m: any) => m.active);
      if (active) {
        setActiveMessage(active._id);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const fetchWinners = async () => {
    try {
      const response = await axios.get('/api/winners');
      setWinners(response.data.winners || []);
    } catch (err) {
      console.error('Error fetching winners:', err);
    }
  };

  const handleLogin = () => {
    if (password === 'vishal@#7798') {
      localStorage.setItem('adminPwd', password);
      setAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  const toggleGameState = async () => {
    try {
      const newState = !gameState.active;
      
      // Stopping the game
      if (!newState) {
        const response = await axios.put('/api/game-state', {
          active: false
        });
        
        setGameState(response.data.gameState);
        
        toast.info('Game stopped successfully!', {
          position: 'top-right',
          autoClose: 3000
        });
      } else {
        // Starting the game only (without timer)
        const response = await axios.put('/api/game-state', {
          active: true,
          // Don't set endTime
        });
        
        setGameState(response.data.gameState);
        
        toast.success('Game started successfully! (Timer not started)', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    } catch (err) {
      console.error('Error toggling game state:', err);
      toast.error('Failed to update game state. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const startGameWithTimer = async () => {
    try {
      // Starting both game and timer together
      const now = new Date();
      const duration = 20 * 60 * 1000; // 20 minutes in milliseconds
      const endTime = new Date(now.getTime() + duration);
      
      const response = await axios.put('/api/game-state', {
        active: true,
        isPaused: false,
        endTime: endTime.toISOString()
      });
      
      setGameState(response.data.gameState);
      
      toast.success('Game and timer started successfully!', {
        position: 'top-right',
        autoClose: 3000
      });
    } catch (err) {
      console.error('Error starting game with timer:', err);
      toast.error('Failed to start game with timer. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const togglePauseState = async () => {
    try {
      const newPauseState = !gameState.isPaused;
      
      const response = await axios.put('/api/game-state', {
        isPaused: newPauseState
      });
      
      setGameState(response.data.gameState);
      
      // Show confirmation to admin
      if (newPauseState) {
        toast.info('Game and timer paused successfully!', {
          position: 'top-right',
          autoClose: 3000
        });
      } else {
        toast.success('Game and timer resumed successfully!', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    } catch (err) {
      console.error('Error toggling pause state:', err);
      toast.error('Failed to update pause state. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  const setMessageAsActive = async (messageId: string) => {
    try {
      await axios.put(`/api/admin/messages/${messageId}/activate`);
      fetchMessages();
    } catch (err) {
      console.error('Error setting message as active:', err);
    }
  };

  const blockTeam = async (teamName: string) => {
    try {
      await axios.post('/api/admin/teams/block-by-name', {
        teamName,
        reason: 'Blocked by administrator'
      });
      fetchTeams();
    } catch (err) {
      console.error('Error blocking team:', err);
    }
  };

  const deleteTeam = async (teamId: string, teamName: string) => {
    if (confirm(`Are you sure you want to delete team "${teamName}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`/api/admin/teams/${teamId}`);
        alert(`Team "${teamName}" has been deleted successfully.`);
        fetchTeams();
      } catch (err) {
        console.error('Error deleting team:', err);
        alert('Failed to delete team. Please try again.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const resetGame = async () => {
    if (confirm('Are you sure you want to reset the game? This will clear all winners and submissions.')) {
      try {
        setLoading(true);
        
        // Add a timeout to ensure the request doesn't hang indefinitely
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await axios.post('/api/reset', {}, {
          signal: controller.signal
        })
        .finally(() => clearTimeout(timeoutId));
        
        // Handle successful response
        alert('Game has been reset successfully.');
        
        // Force refresh data
        await Promise.all([
          fetchGameState(),
          fetchTeams(),
          fetchMessages(),
          fetchWinners()
        ]);
      } catch (err: any) {
        console.error('Error resetting game:', err);
        
        // More user-friendly error handling
        if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
          alert('Reset request timed out. The game may still have been reset. Please refresh the page.');
        } else if (err.response?.status === 500) {
          alert(`Server error: ${err.response?.data?.error || 'Unknown server error'}`);
        } else if (!navigator.onLine) {
          alert('You appear to be offline. Please check your internet connection.');
        } else {
          alert('Failed to reset the game. The server may be temporarily unavailable.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const resetTimer = async () => {
    try {
      if (confirm('Are you sure you want to reset the timer? This will set a new 20-minute countdown.')) {
        // Calculate new end time (20 minutes from now)
        const now = new Date();
        const duration = 20 * 60 * 1000; // 20 minutes in milliseconds
        const endTime = new Date(now.getTime() + duration);
        
        // Reset the timer without changing the active state
        const response = await axios.put('/api/game-state', {
          endTime: endTime.toISOString(),
          isPaused: false // Ensure timer is running
        });
        
        setGameState(response.data.gameState);
        
        toast.success('Timer has been reset to 20 minutes!', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    } catch (err) {
      console.error('Error resetting timer:', err);
      toast.error('Failed to reset the timer. Please try again.', {
        position: 'top-right',
        autoClose: 3000
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full p-2 border border-gray-300 rounded mb-4 text-gray-800 text-lg"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded text-base"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-indigo-800 text-white p-6 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold">Decryption Game Admin Panel</h1>
          <p className="text-indigo-200 mt-1">Manage games, teams, and encrypted messages</p>
        </div>
      </div>
      
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Game Controls */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Game Controls</h2>
            
            {gameState && (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2 border-gray-200">
                  <span className="font-semibold text-gray-800 text-base">Game Status:</span>
                  <span className={`px-3 py-1 rounded-full text-white font-bold ${gameState.active ? 'bg-green-600' : 'bg-red-600'}`}>
                    {gameState.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2 border-gray-200">
                  <span className="font-semibold text-gray-800 text-base">Timer Status:</span>
                  <span className={`px-3 py-1 rounded-full text-white font-bold ${gameState.isPaused ? 'bg-yellow-600' : 'bg-blue-600'}`}>
                    {gameState.isPaused ? 'Paused' : 'Running'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2 border-gray-200">
                  <span className="font-semibold text-gray-800 text-base">Start Time:</span>
                  <span className="text-gray-800 font-medium">{formatDate(gameState.startTime)}</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2 border-gray-200">
                  <span className="font-semibold text-gray-800 text-base">End Time:</span>
                  <span className="text-gray-800 font-medium">{formatDate(gameState.endTime)}</span>
                </div>
                
                <div className="flex space-x-4 mb-4">
                  {!gameState.active ? (
                    <>
                      <button
                        onClick={toggleGameState}
                        className="flex-1 py-3 px-4 rounded font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                          Start Game Only
                        </span>
                      </button>
                      
                      <button
                        onClick={startGameWithTimer}
                        className="flex-1 py-3 px-4 rounded font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Start Game + Timer
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={toggleGameState}
                        className="flex-1 py-3 px-4 rounded font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Stop Game
                        </span>
                      </button>
                      
                      <button
                        onClick={togglePauseState}
                        className={`flex-1 py-3 px-4 rounded font-bold text-white shadow-sm ${
                          gameState.isPaused ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'
                        }`}
                      >
                        {gameState.isPaused ? (
                          <span className="flex items-center justify-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            </svg>
                            Resume Timer
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pause Timer
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={resetTimer}
                    className={`flex-1 py-3 px-4 rounded font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm ${
                      !gameState.active ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={!gameState.active}
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Reset Timer (20 min)
                    </span>
                  </button>
                  
                  <button
                    onClick={resetGame}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded shadow-sm"
                  >
                    <span className="flex items-center justify-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset Game
                    </span>
                  </button>
                </div>
                
                <button
                  onClick={fetchData}
                  className="w-full py-3 px-4 bg-gray-200 hover:bg-gray-300 rounded font-bold text-gray-700 shadow-sm mt-4 border border-gray-300"
                >
                  <span className="flex items-center justify-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Data
                  </span>
                </button>
              </div>
            )}
          </div>
          
          {/* Encrypted Messages */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Encrypted Messages</h2>
            
            {messages.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Difficulty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Assigned Teams</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages.map((message) => (
                      <tr key={message._id} className={message.active ? 'bg-blue-50' : ''}>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800 font-medium">{message.encryptionType}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800 font-medium">{message.difficulty}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${message.active ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                            {message.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {message.activeForTeams && message.activeForTeams.length > 0 ? (
                            <div className="max-h-16 overflow-y-auto">
                              <span className="text-xs font-semibold text-gray-800">{message.activeForTeams.length} teams</span>
                              <div className="text-xs text-gray-600">
                                {message.activeForTeams.slice(0, 3).map((team, i) => (
                                  <div key={i} className="truncate">{team}</div>
                                ))}
                                {message.activeForTeams.length > 3 && (
                                  <div className="font-medium">+{message.activeForTeams.length - 3} more...</div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-600 font-medium">No teams</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <button
                            onClick={() => setMessageAsActive(message._id)}
                            disabled={message.active}
                            className={`py-1 px-3 rounded text-xs font-semibold ${
                              message.active 
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {message.active ? 'Current' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-700 font-medium">No encrypted messages found</p>
            )}
          </div>
          
          {/* Winners */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Winners</h2>
            
            {winners.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Position</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Team</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {winners.map((winner) => (
                      <tr key={winner._id} className={winner.position === 1 ? 'bg-yellow-50' : ''}>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800 font-medium">{winner.position}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800 font-semibold">{winner.teamName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800">{formatDate(winner.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-700 font-medium">No winners yet</p>
            )}
          </div>
          
          {/* Teams */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Teams</h2>
            <div className="mb-2 text-sm text-gray-600">
              {teams.length > 0 ? `Found ${teams.length} teams` : 'No teams found'}
            </div>
            
            {teams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Team Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teams.map((team) => (
                      <tr key={team._id} className={team.isBlocked ? 'bg-red-50' : ''}>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800 font-semibold">{team.teamName}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-gray-800">{team.email}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${team.isBlocked ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                            {team.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap flex space-x-2">
                          <button
                            onClick={() => blockTeam(team.teamName)}
                            disabled={team.isBlocked || team.isAdmin}
                            className={`py-1 px-3 rounded text-xs font-semibold ${
                              team.isBlocked || team.isAdmin
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                                : 'bg-red-500 text-white hover:bg-red-600'
                            }`}
                          >
                            {team.isBlocked ? 'Blocked' : team.isAdmin ? 'Admin' : 'Block'}
                          </button>
                          
                          {!team.isAdmin && (
                            <button
                              onClick={() => deleteTeam(team._id, team.teamName)}
                              className="py-1 px-3 rounded text-xs font-semibold bg-gray-700 text-white hover:bg-gray-800"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-700 font-medium">No teams found</p>
            )}
          </div>
        </div>
      </div>
      {/* Toast notifications container */}
      <Toaster />
    </div>
  );
} 