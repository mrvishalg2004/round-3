import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Socket } from 'socket.io-client';
import DecryptionSubmissionForm from './DecryptionSubmissionForm';
import DecryptionWinners from './DecryptionWinners';
import CountdownTimer from './CountdownTimer';

interface DecryptionGameProps {
  socket: Socket | null;
  teamName: string;
  email: string;
  onGameOver: () => void;
  endTime: Date | null;
  isPaused: boolean;
  pausedTimeRemaining: number | undefined;
}

interface EncryptedMessage {
  id: string;
  encryptedText: string;
  hint: string;
  difficulty: string;
  encryptionType: string;
}

interface GameStatus {
  gameIsFull: boolean;
  winnersCount: number;
  active: boolean;
  isPaused: boolean;
  endTime: Date | null;
  remainingTime: number | null;
  pausedTimeRemaining?: number;
}

interface SubmissionResult {
  success: boolean;
  message: string;
  isCorrect?: boolean;
  position?: number;
}

// Add type guard function
const isValidMessage = (message: any): message is EncryptedMessage => {
  return (
    message &&
    typeof message.id === 'string' &&
    typeof message.encryptedText === 'string' &&
    typeof message.hint === 'string' &&
    typeof message.difficulty === 'string' &&
    typeof message.encryptionType === 'string'
  );
};

const DecryptionGame: React.FC<DecryptionGameProps> = ({ 
  socket, 
  teamName, 
  email, 
  onGameOver,
  endTime,
  isPaused,
  pausedTimeRemaining
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<EncryptedMessage | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fullscreen and security tracking
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const lastActiveTime = useRef<number>(Date.now());
  const warningCountRef = useRef<number>(0);

  // Add new state for game initialization
  const [isGameInitialized, setIsGameInitialized] = useState(false);

  // Add socket connection status tracking
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Handle entering fullscreen
  const enterFullscreen = useCallback(() => {
    const element = gameContainerRef.current;
    if (!element) return;

    try {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, []);

  // Handle exiting fullscreen
  const exitFullscreen = useCallback(() => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = document.fullscreenElement !== null 
        || (document as any).webkitFullscreenElement !== null
        || (document as any).msFullscreenElement !== null;
      
      setIsFullscreen(isDocFullscreen);
      
      // If game is active and not paused, and the user exits fullscreen
      if (gameStatus?.active && !isPaused && !isDocFullscreen) {
        handleSecurityViolation('You exited fullscreen mode');
      }
    };

    // Track tab visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && gameStatus?.active && !isPaused) {
        handleSecurityViolation('You switched tabs or minimized the window');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameStatus?.active, isPaused]);

  // Enter fullscreen when the game becomes active
  useEffect(() => {
    if (gameStatus?.active && !isPaused && !isFullscreen) {
      enterFullscreen();
    }
  }, [gameStatus?.active, isPaused, isFullscreen, enterFullscreen]);

  // Handle security violations (fullscreen exit or tab switching)
  const handleSecurityViolation = async (reason: string) => {
    const newWarningCount = warningCountRef.current + 1;
    warningCountRef.current = newWarningCount;
    setWarningCount(newWarningCount);
    
    if (newWarningCount >= 3) {
      // Disqualify after 3 violations
      setIsDisqualified(true);
      
      try {
        // Notify server about disqualification
        await axios.post('/api/teams/disqualify', {
          teamName,
          reason: `Security violation: ${reason}. Violated ${newWarningCount} times.`
        });
      } catch (error) {
        console.error('Failed to disqualify team:', error);
      }
      
      // Show alert to player
      alert(`You've been disqualified for security violations: ${reason}`);
      
      // Clear local storage and reload after delay
      setTimeout(() => {
        localStorage.removeItem('teamName');
        localStorage.removeItem('email');
        window.location.reload();
      }, 3000);
    } else {
      // Just warning
      alert(`WARNING (${newWarningCount}/3): ${reason}. After 3 warnings, you will be disqualified.`);
      
      // Re-enter fullscreen after warning
      setTimeout(() => {
        if (gameStatus?.active && !isPaused) {
          enterFullscreen();
        }
      }, 1000);
    }
  };

  // Fetch the current encrypted message
  const fetchMessage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching encrypted message for team:", teamName);
      
      const response = await axios.get(`/api/encryption?teamName=${encodeURIComponent(teamName)}`);
      
      console.log("API response:", response.data);
      
      if (response.data.message) {
        setMessage(response.data.message);
        setGameStatus(response.data.gameStatus);
        setLoading(false);
        
        // If game is already full, trigger game over
        if (response.data.gameStatus.gameIsFull) {
          onGameOver();
        }
      } else {
        console.error("Message data missing in response:", response.data);
        setError('No message data returned from server. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching message:', err);
      setError(`Failed to load the encrypted message: ${err.message}`);
      setLoading(false);
    }
  };

  // Update socket connection handling
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('Socket connected');
      setIsSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Socket disconnected');
      setIsSocketConnected(false);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  // Update the socket event handler for game status changes
  useEffect(() => {
    if (!socket) return;

    socket.on('gameStatusChange', (data) => {
      console.log('Game status changed:', data);
      
      // Update game status for any state change
      setGameStatus(prev => {
        if (!prev) return {
          gameIsFull: false,
          winnersCount: 0,
          active: data.active,
          isPaused: data.isPaused,
          endTime: data.endTime ? new Date(data.endTime) : null,
          remainingTime: data.remainingTime,
          pausedTimeRemaining: data.pausedTimeRemaining
        };
        
        return {
          ...prev,
          active: data.active,
          endTime: data.endTime ? new Date(data.endTime) : null,
          isPaused: data.isPaused,
          remainingTime: data.remainingTime,
          pausedTimeRemaining: data.pausedTimeRemaining
        };
      });
      
      // Set game as initialized when we receive any state
      setIsGameInitialized(true);
      setLoading(false);
      
      // If game is active, fetch the message
      if (data.active) {
        fetchMessage();
      }
    });

    // Initial game state fetch
    const fetchInitialState = async () => {
      try {
        const response = await axios.get('/api/game-state');
        const gameState = response.data.gameState;
        
        console.log('Initial game state:', gameState);
        
        // Set initial game status
        setGameStatus({
          gameIsFull: false,
          winnersCount: 0,
          active: gameState.active,
          isPaused: gameState.isPaused,
          endTime: gameState.endTime ? new Date(gameState.endTime) : null,
          remainingTime: gameState.remainingTime,
          pausedTimeRemaining: gameState.pausedTimeRemaining
        });
        setIsGameInitialized(true);
        
        // If game is active, fetch the message
        if (gameState.active) {
          await fetchMessage();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching initial game state:', error);
        setError('Failed to fetch game state. Please refresh the page.');
        setLoading(false);
      }
    };

    fetchInitialState();

    return () => {
      socket.off('gameStatusChange');
    };
  }, [socket]);

  // Handle submission
  const handleSubmit = async (submittedText: string) => {
    if (!message) {
      setError('No active message found. Please refresh the page.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null); // Clear any previous errors
      
      console.log("Submitting solution:", {
        teamName,
        solution: submittedText,
        messageId: message.id
      });
      
      const response = await axios.post('/api/encryption/submit', {
        teamName,
        solution: submittedText,
        messageId: message.id
      });
      
      console.log("Submission response:", response.data);
      
      // Set submission result with proper isCorrect value
      setSubmissionResult({
        success: response.data.success,
        message: response.data.message,
        isCorrect: response.data.success,
        position: response.data.position || undefined
      });
      
      // If game is full after this submission, trigger game over
      if (response.data.gameIsFull) {
        onGameOver();
      }

      // If the answer was correct, refresh winners
      if (response.data.success) {
        // Slight delay to allow database to update
        setTimeout(fetchMessage, 1000);
      }
    } catch (err: any) {
      console.error('Error submitting answer:', err);
      setError(`Failed to submit your answer: ${err.message}`);
      
      // Even if there's an error, still set a result to show in the form
      setSubmissionResult({
        success: false,
        message: 'Submission failed. Please try again.',
        isCorrect: false,
        position: undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add keyboard event handlers to prevent exiting fullscreen
  useEffect(() => {
    // Keyboard event listener to prevent fullscreen exit via keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // If the game is active and not paused, block certain key combinations
      if (gameStatus?.active && !isPaused) {
        // Block F11 (fullscreen toggle)
        if (e.key === 'F11') {
          e.preventDefault();
          return false;
        }
        
        // Block Alt+Tab and Alt+F4
        if (e.altKey && (e.key === 'Tab' || e.key === 'F4')) {
          e.preventDefault();
          return false;
        }
        
        // Block Escape key (exits fullscreen)
        if (e.key === 'Escape') {
          e.preventDefault();
          
          // Re-enter fullscreen if it was exited
          setTimeout(() => {
            if (!document.fullscreenElement && gameStatus?.active && !isPaused) {
              enterFullscreen();
            }
          }, 100);
          
          return false;
        }
        
        // Block Ctrl+Shift+I (dev tools)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
          e.preventDefault();
          handleSecurityViolation('Attempted to open developer tools');
          return false;
        }
        
        // Block Ctrl+Shift+C (dev tools elements panel)
        if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
          e.preventDefault();
          handleSecurityViolation('Attempted to open developer tools');
          return false;
        }
        
        // Block Ctrl+Shift+J (dev tools console)
        if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
          e.preventDefault();
          handleSecurityViolation('Attempted to open developer tools');
          return false;
        }

        // Block printscreen
        if (e.key === 'PrintScreen') {
          e.preventDefault();
          handleSecurityViolation('Attempted to take a screenshot');
          return false;
        }
        
        // Block windowsKey+D (show desktop)
        if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          return false;
        }
      }
    };

    // Adding event listeners
    window.addEventListener('keydown', handleKeyDown, true);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [gameStatus?.active, isPaused, enterFullscreen, handleSecurityViolation]);

  // Additional useEffect to capture focus events
  useEffect(() => {
    const handleBlur = () => {
      if (gameStatus?.active && !isPaused) {
        handleSecurityViolation('Window/Tab lost focus');
      }
    };

    // Add event listener for window blur
    window.addEventListener('blur', handleBlur);
    
    // Cleanup
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameStatus?.active, isPaused, handleSecurityViolation]);

  // Update the loading state check
  if (loading && !isGameInitialized) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Loading the decryption challenge...</p>
        {!socket?.connected && (
          <p className="text-yellow-600 mt-2">Connecting to game server...</p>
        )}
      </div>
    );
  }

  // Show waiting screen only when game is not initialized or explicitly not active
  if (!isGameInitialized || (gameStatus && !gameStatus.active)) {
    return (
      <div className="py-8">
        <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-6 py-5 rounded-lg mb-6 text-center">
          <p className="text-xl font-semibold mb-2">👋 Welcome to the Decryption Challenge!</p>
          <p className="text-lg">Please wait for an administrator to start the game.</p>
          <p className="mt-2 text-lg">The game will begin automatically when started.</p>
          {!socket?.connected && (
            <p className="text-yellow-600 mt-2">Connecting to game server...</p>
          )}
        </div>
        
        <div className="flex justify-center mt-8">
          <div className="animate-pulse flex space-x-3">
            <div className="h-5 w-5 bg-blue-500 rounded-full"></div>
            <div className="h-5 w-5 bg-blue-500 rounded-full animation-delay-200"></div>
            <div className="h-5 w-5 bg-blue-500 rounded-full animation-delay-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-md text-center">
          <div className="text-xl mb-3 font-bold">Oops! We hit a snag</div>
          <p className="mb-4">{error}</p>
          <button 
            onClick={fetchMessage}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!message || !gameStatus) {
    return <div>No active encryption challenge found.</div>;
  }

  return (
    <div 
      ref={gameContainerRef}
      className={`bg-white rounded-lg shadow-md p-6 overflow-auto ${isFullscreen ? 'fullscreen-game fullscreen-element' : ''}`}
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {isDisqualified ? (
        <div className="bg-red-100 border-2 border-red-400 text-red-800 px-6 py-5 rounded-lg mb-6 text-center">
          <p className="text-xl font-semibold mb-2">⚠️ You have been disqualified!</p>
          <p className="text-lg">You violated the security rules multiple times.</p>
          <p className="mt-2 text-lg">The page will reload momentarily.</p>
        </div>
      ) : !isGameInitialized ? (
        // Show waiting screen when game is not initialized
        <div className="py-8">
          <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-6 py-5 rounded-lg mb-6 text-center">
            <p className="text-xl font-semibold mb-2">👋 Welcome to the Decryption Challenge!</p>
            <p className="text-lg">Please wait for an administrator to start the game.</p>
            <p className="mt-2 text-lg">The game will begin automatically when started.</p>
          </div>
          
          <div className="flex justify-center mt-8">
            <div className="animate-pulse flex space-x-3">
              <div className="h-5 w-5 bg-blue-500 rounded-full"></div>
              <div className="h-5 w-5 bg-blue-500 rounded-full animation-delay-200"></div>
              <div className="h-5 w-5 bg-blue-500 rounded-full animation-delay-400"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-gray-800">Decryption Challenge</h2>
          </div>
          
          {/* Timer Display */}
          {gameStatus?.active && gameStatus.endTime && (
            <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 shadow-lg">
              <div className="text-center">
                <h3 className="text-white text-lg font-semibold mb-2">Time Remaining</h3>
                <div className="text-4xl font-bold text-white">
                  <CountdownTimer 
                    endTime={gameStatus.endTime}
                    isPaused={gameStatus.isPaused}
                    pausedTimeRemaining={gameStatus.pausedTimeRemaining ?? undefined}
                    onTimeExpired={onGameOver}
                  />
                </div>
                {gameStatus.isPaused && (
                  <p className="text-white text-sm mt-2">⏸️ Game Paused</p>
                )}
              </div>
            </div>
          )}

          {warningCount > 0 && (
            <div className="mb-4 bg-yellow-100 border-2 border-yellow-400 p-3 rounded-lg security-warning">
              <p className="text-yellow-800 font-medium">
                Security Warning: {warningCount}/3 violations. Please stay in fullscreen mode and don't switch tabs.
              </p>
            </div>
          )}

          {!gameStatus?.active ? (
            // Show waiting screen when game is not active
            <div className="py-8">
              <div className="bg-yellow-100 border-2 border-yellow-400 text-yellow-800 px-6 py-5 rounded-lg mb-6 text-center">
                <p className="text-xl font-semibold mb-2">👋 Welcome to the Decryption Challenge!</p>
                <p className="text-lg">The game has not started yet. Please wait for an admin to start the game.</p>
                <p className="mt-2 text-lg">The encrypted message will appear here once the game begins.</p>
              </div>
              
              <div className="flex justify-center mt-8">
                <div className="animate-pulse flex space-x-3">
                  <div className="h-5 w-5 bg-blue-500 rounded-full"></div>
                  <div className="h-5 w-5 bg-blue-500 rounded-full animation-delay-200"></div>
                  <div className="h-5 w-5 bg-blue-500 rounded-full animation-delay-400"></div>
                </div>
              </div>
            </div>
          ) : isPaused ? (
            // Show paused screen when game is paused
            <div>
              <div className="bg-indigo-100 border-2 border-indigo-400 text-indigo-800 px-6 py-5 rounded-lg mb-6 text-center">
                <p className="text-xl font-semibold mb-2">⏸️ Game Paused</p>
                <p className="text-lg">The game is currently paused. Please wait for an admin to resume the game.</p>
                <p className="mt-2 text-lg">Your progress is saved and the timer is paused.</p>
              </div>
              
              {/* Show the encrypted message and hint even when paused */}
              {message && isValidMessage(message) && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">Encrypted Message:</h3>
                    <button 
                      onClick={fetchMessage}
                      className="text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                      </svg>
                      Refresh Message
                    </button>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md font-mono text-base leading-relaxed overflow-x-auto border-2 border-gray-300 shadow-inner mb-6">
                    <span className="text-gray-900 font-bold tracking-wide">{message.encryptedText}</span>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Hint:</h3>
                    <div className="bg-blue-50 p-4 rounded-md text-blue-900 text-lg border-2 border-blue-200 shadow-inner">
                      <span className="font-semibold">{message.hint}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Show game content when active and not paused
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">Encrypted Message:</h3>
                <button 
                  onClick={fetchMessage}
                  className="text-sm bg-blue-500 hover:bg-blue-600 text-white font-medium py-1 px-3 rounded flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                  </svg>
                  Refresh Message
                </button>
              </div>
              <div className="bg-gray-100 p-4 rounded-md font-mono text-base leading-relaxed overflow-x-auto border-2 border-gray-300 shadow-inner mb-6">
                <span className="text-gray-900 font-bold tracking-wide">{message.encryptedText}</span>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Hint:</h3>
                <div className="bg-blue-50 p-4 rounded-md text-blue-900 text-lg border-2 border-blue-200 shadow-inner">
                  <span className="font-semibold">{message.hint}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Only show submission form if game is active and not paused */}
          {gameStatus.active && !gameStatus.isPaused ? (
            <DecryptionSubmissionForm 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting}
              result={submissionResult}
              onRefresh={fetchMessage}
            />
          ) : (
            <div className="bg-gray-100 p-4 rounded-md text-center">
              <p className="text-gray-700 text-lg">Submission is {gameStatus.active ? "paused" : "not available"} until the game {gameStatus.active ? "resumes" : "starts"}.</p>
            </div>
          )}
          
          {/* Only show winners when game is active */}
          {gameStatus.active && (
            <DecryptionWinners messageId={message.id} />
          )}

          {/* Show fullscreen instruction when not in fullscreen */}
          {gameStatus?.active && !isPaused && !isFullscreen && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 max-w-md text-center">
                <h3 className="text-xl font-bold mb-4">Fullscreen Required</h3>
                <p className="mb-4">This game must be played in fullscreen mode for security reasons.</p>
                <button
                  onClick={enterFullscreen}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Enter Fullscreen
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add style tag for custom animation delays */}
      <style jsx>{`
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
};

export default DecryptionGame; 