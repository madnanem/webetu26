import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = localStorage.getItem('webetu_auth');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/auth/login', { username, password });
      const session = {
        token: data.token,
        uuid: data.uuid,
        userId: data.userId,
        individuId: data.idIndividu,
        etablissementId: data.etablissementId,
        username: data.username,
      };
      localStorage.setItem('webetu_auth', JSON.stringify(session));
      setAuth(session);
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Connexion échouée. Vérifiez vos identifiants.';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('webetu_auth');
    setAuth(null);
  }, []);

  const apiHeaders = auth ? { Authorization: auth.token } : {};

  return (
    <AuthContext.Provider value={{ auth, login, logout, loading, error, setError, apiHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
