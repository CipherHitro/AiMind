import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

/**
 * ProtectedRoute - Redirects to login if user is not authenticated
 * Use this for pages that require authentication (e.g., /chat)
 */
export const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // User is not authenticated, redirect to login
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
  if (isAuthenticated()) {
    // User is already authenticated, redirect to chat
    return <Navigate to="/chat" replace />;
  }

  // User is not authenticated, render the public component (login/signup)
  return children;
};
