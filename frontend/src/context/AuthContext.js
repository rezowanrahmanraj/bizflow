import React, { createContext, useState, useEffect, useContext } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On app load, check if token exists and fetch user
  useEffect(() => {
    const token = localStorage.getItem('bizflow_token');
    if (token) {
      getMe()
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('bizflow_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Login — save token and user
  const login = (token, userData) => {
    localStorage.setItem('bizflow_token', token);
    setUser(userData);
  };

  // Logout — clear token and user
  const logout = () => {
    localStorage.removeItem('bizflow_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = () => useContext(AuthContext);