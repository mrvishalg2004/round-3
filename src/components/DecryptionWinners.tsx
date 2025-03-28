import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Winner {
  teamName: string;
  position: number;
  createdAt: string;
}

interface DecryptionWinnersProps {
  messageId: string;
}

const DecryptionWinners: React.FC<DecryptionWinnersProps> = ({ messageId }) => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/encryption/winners');
      
      if (response.data.winners) {
        setWinners(response.data.winners);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching winners:', err);
      setError('Failed to load winners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
    
    // Poll for winners every 10 seconds
    const interval = setInterval(fetchWinners, 10000);
    
    return () => clearInterval(interval);
  }, [messageId]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading && winners.length === 0) {
    return (
      <div className="mt-6 border-t-2 border-gray-200 pt-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Winners:</h3>
        <div className="flex justify-center items-center h-20">
          <div className="animate-pulse text-gray-600 text-lg">Loading winners...</div>
        </div>
      </div>
    );
  }

  if (error && winners.length === 0) {
    return (
      <div className="mt-6 border-t-2 border-gray-200 pt-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Winners:</h3>
        <div className="text-red-600 text-center text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t-2 border-gray-200 pt-4">
      <h3 className="text-xl font-semibold text-gray-800 mb-3">Winners:</h3>
      
      {winners.length === 0 ? (
        <div className="text-gray-700 text-center py-4 text-lg bg-gray-50 rounded-lg border border-gray-200">
          No winners yet. Be the first to decrypt the message!
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border-2 border-gray-200 shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Team</th>
                <th className="px-6 py-3 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {winners.map((winner) => (
                <tr key={winner.position} className={winner.position === 1 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-base ${
                        winner.position === 1 ? 'bg-yellow-300 text-yellow-900' : 
                        winner.position === 2 ? 'bg-gray-300 text-gray-900' : 
                        'bg-amber-700 text-amber-50'
                      }`}>
                        {winner.position}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-base font-medium text-gray-900">{winner.teamName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700">
                    {formatTime(winner.createdAt)}
                  </td>
                </tr>
              ))}
              
              {/* Placeholder rows for remaining slots */}
              {winners.length < 3 && Array.from({ length: 3 - winners.length }).map((_, index) => (
                <tr key={`empty-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold text-base">
                        {winners.length + index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-base font-medium text-gray-500">Waiting...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base text-gray-500">
                    --:--:--
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DecryptionWinners; 