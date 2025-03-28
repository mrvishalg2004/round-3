import React, { useState, useEffect } from 'react';
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
  pausedTimeRemaining?: number;
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
}

interface SubmissionResult {
  success: boolean;
  message: string;
  isCorrect?: boolean;
  position?: number;
}

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

  // Fetch the current encrypted message
  const fetchMessage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching encrypted message for team:", teamName);
      
      // Add retry logic
      let retries = 3;
      let success = false;
      let response;
      
      while (retries > 0 && !success) {
        try {
          response = await axios.get(`/api/encryption?teamName=${encodeURIComponent(teamName)}`);
          success = true;
        } catch (err) {
          retries--;
          if (retries === 0) throw err;
          console.log(`Request failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
        }
      }
      
      if (!response) {
        throw new Error("Failed to fetch message after multiple attempts");
      }
      
      console.log("API response:", response.data);
      
      if (response.data.message) {
        // Check if we have a valid message ID
        if (!response.data.message.id) {
          console.error("Message missing ID in response:", response.data.message);
          throw new Error("The message from the server is missing its ID. Please try refreshing again.");
        }
        
        // Check if we have encrypted text
        if (!response.data.message.encryptedText) {
          console.error("Message missing encrypted text:", response.data.message);
          throw new Error("The message from the server is missing encrypted text. Please try refreshing again.");
        }
        
        setMessage(response.data.message);
        setGameStatus(response.data.gameStatus);
        
        // If game is already full, trigger game over
        if (response.data.gameStatus.gameIsFull) {
          onGameOver();
        }
      } else {
        console.error("Message data missing in response:", response.data);
        setError('No message data returned from server. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error occurred';
      console.error('Error fetching message:', err);
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      setError(`Failed to load the encrypted message: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMessage();
    
    // Setup socket listeners for real-time updates
    if (socket) {
      socket.on('gameStatusChange', (data: any) => {
        console.log('Game status changed:', data);
        
        if (data.type === 'newWinner') {
          // Update winners count
          setGameStatus(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              winnersCount: prev.winnersCount + 1
            };
          });
        }
        
        if (data.type === 'gameComplete') {
          // All winners have been found
          setGameStatus(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              gameIsFull: true
            };
          });
          onGameOver();
        }

        // Handle game start/stop events 
        if (data.type === 'start') {
          console.log('Game started by admin');
          setGameStatus(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              active: true,
              isPaused: false
            };
          });
        }

        // Handle game stop events
        if (data.type === 'stop') {
          console.log('Game stopped by admin');
          setGameStatus(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              active: false
            };
          });
        }

        // Handle game pause/resume events
        if (data.type === 'pause') {
          console.log('Game paused by admin');
          setGameStatus(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              isPaused: true
            };
          });
        }

        if (data.type === 'resume') {
          console.log('Game resumed by admin');
          setGameStatus(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              isPaused: false
            };
          });
        }
        
        // Handle game reset events
        if (data.type === 'reset') {
          console.log('Game reset by admin');
          // Refresh the message when game is reset
          fetchMessage();
          // Update game status
          setGameStatus(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              active: false,
              isPaused: false,
              winnersCount: 0,
              gameIsFull: false
            };
          });
        }

        // Update game active state
        if (data.active !== undefined) {
          setGameStatus(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              active: data.active
            };
          });
        }

        // Update game paused state
        if (data.isPaused !== undefined) {
          setGameStatus(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              isPaused: data.isPaused
            };
          });
        }
      });

      socket.on('activeMessageChanged', () => {
        // Refresh the message when active message changes
        console.log('Active message changed notification received');
        fetchMessage();
      });
      
      // Listen for team-specific message assignments
      socket.on('teamMessageAssigned', (data: any) => {
        if (data.teamName === teamName) {
          console.log(`Team-specific message assigned: ${data.messageId}`);
          fetchMessage();
        }
      });

      // Join the team-specific room for targeted notifications
      socket.emit('joinTeam', { teamName });
      console.log(`Joined team room: ${teamName}`);
      
      // Request current game status when connecting
      socket.emit('getGameStatus');
    }
    
    return () => {
      if (socket) {
        socket.off('gameStatusChange');
        socket.off('activeMessageChanged');
        socket.off('teamMessageAssigned');
      }
    };
  }, [socket, teamName, onGameOver]);

  // Handle submission
  const handleSubmit = async (submittedText: string) => {
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
        isCorrect: response.data.success, // Use success flag directly - if true, the answer is correct
        position: response.data.position
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
      console.error('Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
      
      // Set a more specific error message
      const errorMessage = err.response?.data?.error || err.message || 'Failed to submit your answer';
      setError(`Failed to submit your answer: ${errorMessage}`);
      
      // Even if there's an error, still set a result to show in the form
      setSubmissionResult({
        success: false,
        message: 'Submission failed. Please try again.',
        isCorrect: false,
        position: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
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
      className="bg-white rounded-lg shadow-md p-6" 
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-gray-800">Decryption Challenge</h2>
      </div>
      
      {endTime && (
        <div className="mb-4">
          <CountdownTimer 
            endTime={endTime} 
            isPaused={isPaused}
            pausedTimeRemaining={pausedTimeRemaining}
            onTimeExpired={onGameOver}
          />
        </div>
      )}

      {!gameStatus.active ? (
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
      ) : gameStatus.isPaused ? (
        // Show paused screen when game is paused
        <div>
          <div className="bg-indigo-100 border-2 border-indigo-400 text-indigo-800 px-6 py-5 rounded-lg mb-6 text-center">
            <p className="text-xl font-semibold mb-2">⏸️ Game Paused</p>
            <p className="text-lg">The game is currently paused. Please wait for an admin to resume the game.</p>
            <p className="mt-2 text-lg">Your progress is saved and the timer is paused.</p>
          </div>
          
          {/* Show the encrypted message and hint even when paused */}
          <div>
            <div className="flex justify-between items-center mb-4 mt-8">
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