import React, { createContext, useContext, useReducer, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      const normalizedUser = action.payload.user?._id
        ? { ...action.payload.user, id: action.payload.user._id }
        : action.payload.user;
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      return {
        ...state,
        user: normalizedUser,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const savedUser = (() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  })();

  const [state, dispatch] = useReducer(authReducer, {
    user: savedUser,
    token: localStorage.getItem('token'),
    isAuthenticated: Boolean(localStorage.getItem('token')),
    loading: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user data
      verifyToken(token);
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await API.get('/auth/verify-token');
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { 
          token, 
          user: response.data.user 
        } 
      });
    } catch (error) {
      // Only clear token on explicit auth failures
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete API.defaults.headers.common['Authorization'];
        dispatch({ type: 'LOGOUT' });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (email, password) => {
    try {
      const response = await API.post('/auth/login', { email, password });
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.data });
      API.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      // Clear auth error flag on successful login
      localStorage.removeItem('hasShownAuthError');
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  };

  const register = async (userData) => {
    try {
      const response = await API.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    delete API.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
