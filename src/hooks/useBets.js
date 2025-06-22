import { useState, useEffect } from 'react';
import { Bet, User } from '@/api/entities';

export function useBets(bankrollId = null) {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBets();
  }, [bankrollId]);

  const loadBets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await User.me();
      let betsData;
      
      if (bankrollId) {
        betsData = await Bet.filter({ bankroll_id: bankrollId }, "-date");
      } else {
        betsData = await Bet.filter({ created_by: user.email }, "-date");
      }
      
      setBets(betsData);
    } catch (err) {
      console.error("Error loading bets:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createBet = async (betData) => {
    try {
      const user = await User.me();
      const newBet = await Bet.create({
        ...betData,
        created_by: user.email
      });
      setBets(prev => [newBet, ...prev]);
      return newBet;
    } catch (err) {
      console.error("Error creating bet:", err);
      throw err;
    }
  };

  const updateBet = async (betId, updateData) => {
    try {
      const updatedBet = await Bet.update(betId, updateData);
      setBets(prev => prev.map(bet => bet.id === betId ? updatedBet : bet));
      return updatedBet;
    } catch (err) {
      console.error("Error updating bet:", err);
      throw err;
    }
  };

  const deleteBet = async (betId) => {
    try {
      await Bet.delete(betId);
      setBets(prev => prev.filter(bet => bet.id !== betId));
    } catch (err) {
      console.error("Error deleting bet:", err);
      throw err;
    }
  };

  return {
    bets,
    loading,
    error,
    loadBets,
    createBet,
    updateBet,
    deleteBet
  };
}