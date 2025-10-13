import Cookies from 'js-cookie';

/**
 * Check if user is authenticated by checking for JWT token in cookies
 */
export const isAuthenticated = () => {
  const token = Cookies.get('uid');
  return !!token; // Returns true if token exists, false otherwise
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
