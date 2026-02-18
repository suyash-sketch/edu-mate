import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Use sessionStorage so the session clears when the browser tab/window is closed.
  // This means every fresh browser open goes to /login first.
  const [user, setUser] = useState(() => {
    try {
      const stored = JSON.parse(sessionStorage.getItem('edu_user'));
      if (stored && stored.token && stored.token.length > 20) {
        return stored;
      }
      sessionStorage.removeItem('edu_user');
      // Also clear any old localStorage entries from previous versions
      localStorage.removeItem('edu_user');
      return null;
    } catch {
      sessionStorage.removeItem('edu_user');
      return null;
    }
  });

  /**
   * Call this after a successful /api/login + /api/me.
   * userData should include: { email, name, token }
   */
  const login = (userData) => {
    setUser(userData);
    sessionStorage.setItem('edu_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('edu_user');
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
