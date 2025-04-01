import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endTime: Date;
  isPaused: boolean;
  pausedTimeRemaining: number | undefined;
  onTimeExpired: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endTime,
  isPaused,
  pausedTimeRemaining,
  onTimeExpired
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(0);
        onTimeExpired();
        return;
      }

      setTimeLeft(difference);
    };

    if (!isPaused) {
      calculateTimeLeft();
      interval = setInterval(calculateTimeLeft, 1000);
    } else if (pausedTimeRemaining) {
      setTimeLeft(pausedTimeRemaining);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [endTime, isPaused, pausedTimeRemaining, onTimeExpired]);

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (isExpired) return 'text-red-500';
    if (timeLeft <= 30000) return 'text-red-500 animate-pulse'; // Last 30 seconds
    if (timeLeft <= 60000) return 'text-yellow-500'; // Last minute
    return 'text-white';
  };

  return (
    <div className={`font-mono ${getTimerColor()}`}>
      {isExpired ? (
        <span className="text-2xl">00:00</span>
      ) : (
        <span className="text-4xl">{formatTime(timeLeft)}</span>
      )}
    </div>
  );
};

export default CountdownTimer; 