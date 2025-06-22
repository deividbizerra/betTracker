import { useState, useEffect } from 'react';
import { User } from '@/api/entities';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error loading user:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await User.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  return {
    user,
    loading,
    isAuthenticated,
    loadUser,
    logout,
    updateUser
  };
}