import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isAuthenticated } from '../utils/auth';

/**
 * ProtectedRoute - Redirects to login if user is not authenticated
 * Use this for pages that require authentication (e.g., /chat)
 */
export const ProtectedRoute = ({ children }) => {
  const [authState, setAuthState] = useState('checking'); // 'checking', 'authenticated', 'unauthenticated'

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setAuthState(authenticated ? 'authenticated' : 'unauthenticated');
    };
    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // User is not authenticated, redirect to login
  if (authState === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the protected component
  return children;
};

/**
 * PublicRoute - Redirects to chat if user is already authenticated
 * Use this for login/signup pages to prevent authenticated users from accessing them
 */
export const PublicRoute = ({ children }) => {
  const [authState, setAuthState] = useState('checking'); // 'checking', 'authenticated', 'unauthenticated'

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setAuthState(authenticated ? 'authenticated' : 'unauthenticated');
    };
    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // User is already authenticated, redirect to chat
  if (authState === 'authenticated') {
    return <Navigate to="/chat" replace />;
  }

  // User is not authenticated, render the public component (login/signup)
  return children;
};
