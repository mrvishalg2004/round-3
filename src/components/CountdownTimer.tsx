import React, { useState, useEffect, useRef } from 'react';

interface CountdownTimerProps {
  endTime: Date;
  onTimeExpired: () => void;
  isPaused?: boolean;
  pausedTimeRemaining?: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  endTime, 
  onTimeExpired, 
  isPaused = false,
  pausedTimeRemaining
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [progressPercentage, setProgressPercentage] = useState<number>(100);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Log props changes for debugging
  useEffect(() => {
    console.log('CountdownTimer props changed:', { 
      endTime: endTime?.toISOString(), 
      isPaused, 
      pausedTimeRemaining 
    });
  }, [endTime, isPaused, pausedTimeRemaining]);
  
  useEffect(() => {
    // Clear any existing interval when dependencies change
    if (intervalRef.current) {
      console.log('Clearing existing interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // If paused and we have a pausedTimeRemaining value, use that instead
    if (isPaused && pausedTimeRemaining !== undefined) {
      console.log('Timer is paused with remaining time:', pausedTimeRemaining);
      setTimeLeft(pausedTimeRemaining);
      
      // Calculate total duration (assuming 10 minutes)
      const totalDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
      
      // Calculate progress based on paused time
      const pausedProgress = (pausedTimeRemaining / totalDuration) * 100;
      setProgressPercentage(pausedProgress);
      
      // Don't set up an interval when paused
      return;
    }
    
    // Set initial time left
    const initialTimeLeft = Math.max(0, endTime.getTime() - Date.now());
    console.log('Setting initial time left:', initialTimeLeft);
    setTimeLeft(initialTimeLeft);
    
    // Calculate total duration (assuming 10 minutes)
    const totalDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    // Calculate initial progress
    const initialProgress = (initialTimeLeft / totalDuration) * 100;
    setProgressPercentage(initialProgress);
    
    // Only start the interval if not paused
    if (!isPaused) {
      console.log('Starting countdown interval');
      // Update time left every second
      intervalRef.current = setInterval(() => {
        const newTimeLeft = Math.max(0, endTime.getTime() - Date.now());
        setTimeLeft(newTimeLeft);
        
        // Update progress
        const newProgress = (newTimeLeft / totalDuration) * 100;
        setProgressPercentage(newProgress);
        
        // Check if time has expired
        if (newTimeLeft <= 0) {
          console.log('Timer expired');
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onTimeExpired();
        }
      }, 1000);
    } else {
      console.log('Not starting interval because timer is paused');
    }
    
    // Clean up interval on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        console.log('Cleaning up interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [endTime, onTimeExpired, isPaused, pausedTimeRemaining]);
  
  // Format time to MM:SS
  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Get animation class for final countdown
  const getAnimationClass = (): string => {
    if (isPaused) return ''; // No animation when paused
    return timeLeft <= 10000 ? 'animate-pulse' : '';
  };
  
  // Get color class based on remaining time
  const getTimeColorClass = (): string => {
    if (timeLeft <= 30000) return 'text-red-600'; // Last 30 seconds
    if (timeLeft <= 60000) return 'text-orange-600'; // Last minute
    if (timeLeft <= 180000) return 'text-yellow-700'; // Last 3 minutes
    return 'text-indigo-700';
  };
  
  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center bg-white px-6 py-3 rounded-full shadow-lg border-2 border-indigo-200">
        <span className="font-bold text-indigo-800 mr-3 text-lg">Game Time:</span>
        <span className={`text-3xl font-extrabold ${getTimeColorClass()} ${getAnimationClass()}`}>
          {formatTime(timeLeft)}
        </span>
        {isPaused && (
          <span className="ml-3 px-3 py-1 text-sm font-bold bg-yellow-200 text-yellow-800 rounded-full animate-pulse border border-yellow-400">
            PAUSED
          </span>
        )}
      </div>
      
      {/* Progress bar below timer */}
      <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-1000 ${
            progressPercentage <= 25 ? 'bg-red-500' :
            progressPercentage <= 50 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CountdownTimer; 