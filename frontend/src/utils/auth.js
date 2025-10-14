import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_BASE_API_URL;

/**
 * Check if user is authenticated by making API request
 * Since cookies are httpOnly, we can't read them directly
 */
export const isAuthenticated = async () => {
  try {
    const response = await fetch(`${BASE_URL}/user/profile`, {
      method: 'GET',
      credentials: 'include', // Send httpOnly cookies automatically
    });
    
    return response.ok; // Returns true if authenticated
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

/**
 * Get the authentication token
 */
export const getAuthToken = () => {
  return Cookies.get('uid');
};

/**
 * Remove authentication token (logout)
 */
export const removeAuthToken = () => {
  Cookies.remove('uid', { path: '/' });
};

/**
 * Set authentication token
 */
export const setAuthToken = (token) => {
  Cookies.set('uid', token, { path: '/', expires: 7 }); // 7 days expiry
};
