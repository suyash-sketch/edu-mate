import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('edu_user')) || null; }
    catch { return null; }
  });

  /**
   * Call this after a successful /api/login response.
   * userData should include at minimum: { email, token }
   */
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('edu_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('edu_user');
  };

  /** Returns the JWT token for use in Authorization headers */
  const getToken = () => user?.token || null;

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
