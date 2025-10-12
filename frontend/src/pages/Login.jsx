import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import Cookies from 'js-cookie'

export default function Login() {
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.BASE_API_URL;
  const { loginWithRedirect, isAuthenticated, user, isLoading } = useAuth0();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [oauthProcessed, setOauthProcessed] = useState(false);

  // Handle Auth0 authentication callback
  useEffect(() => {
    const handleOAuthLogin = async () => {
      if (isAuthenticated && user && !oauthProcessed) {
        setOauthProcessed(true); // Prevent multiple calls
        
        try {
          // Send OAuth user data to backend
          const response = await fetch('http://localhost:3000/user/oauth-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              picture: user.picture,
              sub: user.sub, // Auth0 user ID
            }),
          });

          const result = await response.json();
          
          if (response.ok) {
            // Set cookie if in development mode
            console.log("OAuth authentication successful");
            if (import.meta.env.VITE_MODE === 'development' && result.token) {
              console.log("Setting OAuth cookie");
              Cookies.set('uid', result.token, { expires: 7, path: '/', sameSite: 'Lax' });
            }
            navigate('/chat');
          } else {
            console.error('OAuth login failed:', result.message);
            alert(result.message || 'OAuth login failed');
            setOauthProcessed(false); // Reset on failure
          }
        } catch (error) {
          console.error('OAuth login error:', error);
          alert('Error during OAuth login');
          setOauthProcessed(false); // Reset on failure
        }
      }
    };

    if (!oauthProcessed) {
      handleOAuthLogin();
    }
  }, [isAuthenticated, user, navigate, oauthProcessed]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate username or email
    if (!formData.username.trim()) {
      newErrors.username = 'Username or email is required';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    console.log(import.meta.env.VITE_MODE)
    // Handle login logic here
    const response = await fetch(`http://localhost:3000/user/login`, {
      method : "POST",
      headers: {
        "Content-Type" : "application/json",
      },
      credentials: 'include',
      body : JSON.stringify(formData)
    })
    console.log("response : ", response);
    const result = await response.json();
    console.log("json :", result)
    console.log('Login submitted:', formData);
    if (response.ok) {
      if (import.meta.env.VITE_MODE == 'development') {
        if(result.rememberMe){
          console.log("in remember me ")
          Cookies.set('uid', result.token,  { expires: 7 , path: '/', sameSite: 'Lax' })
        }
        else{
          console.log("out remember me")
          console.log(result.token)
          Cookies.set('uid', result.token,  { expires: 1 , path: '/', sameSite: 'Lax' })
        }
        navigate('/chat');
      }
      else{
        navigate('/chat'); 
      }
    }
    else {
      alert(result.message || 'Login failed');
    }
  };

  const handleGoogleLogin = () => {
    // Trigger Auth0 Google login with redirect
    loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2',
      },
    });
  };

  const handleForgotPassword = () => {
    // Handle forgot password logic here
    console.log('Forgot password clicked');
  };

  // Show loading state while OAuth is being processed
  if (isLoading || (isAuthenticated && user && !oauthProcessed)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex items-center justify-center px-4 py-8 md:py-4 overflow-y-auto" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
      <div className="w-full max-w-md my-auto">
        {/* Login Form */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6 md:p-8">
          {/* Title inside the box */}
          <div className="text-center mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">Sign in to continue to AiMind</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {/* Username or Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2.5 md:py-3 rounded-lg bg-white/60 border ${
                    errors.username ? 'border-red-300' : 'border-white/50'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300`}
                  placeholder="Enter username or email"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-2.5 md:py-3 rounded-lg bg-white/60 border ${
                    errors.password ? 'border-red-300' : 'border-white/50'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:scale-110 transition-transform duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm cursor-pointer text-purple-600 hover:text-purple-700 font-semibold hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="cursor-pointer w-full py-2.5 md:py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
            >
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-4 md:my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/60 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="cursor-pointer w-full py-2.5 md:py-3 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          {/* Signup Link */}
          <div className="mt-4 md:mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-600 hover:text-purple-700 font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
