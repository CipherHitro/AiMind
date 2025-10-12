import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, User, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import Cookies from 'js-cookie';

export default function Signup() {
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_API_URL;
  const { loginWithRedirect, isAuthenticated, user, isLoading } = useAuth0();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasCapital: false,
    hasNumber: false,
    hasSymbol: false
  });
  const [oauthProcessed, setOauthProcessed] = useState(false);

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    message: ''
  });

  const usernameCheckTimeout = useRef(null);

  // Password validation function
  const validatePassword = (password) => {
    const validation = {
      minLength: password.length >= 8,
      hasCapital: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  // Check username availability with debounce
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: '' });

    try {
      const response = await fetch(
        `${BASE_URL}/user/check-username?username=${encodeURIComponent(username)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      setUsernameStatus({
        checking: false,
        available: result.available,
        message: result.message,
      });
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus({
        checking: false,
        available: null,
        message: 'Error checking username',
      });
    }
  };

  // Debounce username check
  useEffect(() => {
    if (formData.username) {
      // Clear previous timeout
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }

      // Set new timeout
      usernameCheckTimeout.current = setTimeout(() => {
        checkUsernameAvailability(formData.username);
      }, 500); // 500ms debounce
    } else {
      setUsernameStatus({ checking: false, available: null, message: '' });
    }

    // Cleanup
    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [formData.username]);

  // Handle Auth0 authentication callback
  useEffect(() => {
    const handleOAuthSignup = async () => {
      if (isAuthenticated && user && !oauthProcessed) {
        setOauthProcessed(true); // Prevent multiple calls
        
        try {
          // Send OAuth user data to backend
          const response = await fetch(`${BASE_URL}/user/oauth-login`, {
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
            console.log("OAuth signup successful");
            if (import.meta.env.VITE_MODE === 'development' && result.token) {
              console.log("Setting OAuth cookie");
              Cookies.set('uid', result.token, { expires: 7, path: '/', sameSite: 'Lax' });
            }
            navigate('/chat');
          } else {
            console.error('OAuth signup failed:', result.message);
            alert(result.message || 'OAuth signup failed');
            setOauthProcessed(false); // Reset on failure
          }
        } catch (error) {
          console.error('OAuth signup error:', error);
          alert('Error during OAuth signup');
          setOauthProcessed(false); // Reset on failure
        }
      }
    };

    if (!oauthProcessed) {
      handleOAuthSignup();
    }
  }, [isAuthenticated, user, navigate, oauthProcessed]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate password in real-time
    if (name === 'password') {
      validatePassword(value);
    }

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

    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!usernameStatus.available) {
      newErrors.username = 'Please choose an available username';
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password does not meet requirements';
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // Handle signup logic here
    const response = await fetch(`${BASE_URL}/user/signup`, {
      method: 'POST',
      headers : {
        "Content-Type" : "application/json"
      },
      body: JSON.stringify(formData)
    })

    console.log("response ", response)
    const result = await response.json();
    console.log("json :", result)
    
    if (response.ok) {
      console.log('Form submitted:', formData);
      // After successful signup, navigate to login
      navigate('/login');
    } else {
      alert(result.message || 'Signup failed');
    }
  };

  const handleGoogleSignup = () => {
    // Trigger Auth0 Google login with redirect
    // Using the same flow as login to avoid callback URL mismatch
    loginWithRedirect({
      authorizationParams: {
        connection: 'google-oauth2',
      },
    });
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
    <div className="h-dvh flex items-center justify-center p-4 py-8 md:py-4 overflow-y-auto" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
      <div className="w-full max-w-md my-auto">
        {/* Signup Form */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-6 md:p-8">
          {/* Title inside the box */}
          <div className="text-center mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Join AiMind
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">Create your account to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
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
                  className={`w-full pl-10 pr-10 py-2.5 md:py-3 rounded-lg bg-white/60 border ${
                    errors.username 
                      ? 'border-red-300' 
                      : usernameStatus.available === true 
                      ? 'border-green-300' 
                      : usernameStatus.available === false 
                      ? 'border-red-300' 
                      : 'border-white/50'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300`}
                  placeholder="Enter your username"
                />
                {/* Status Icon */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {usernameStatus.checking && (
                    <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
                  )}
                  {!usernameStatus.checking && usernameStatus.available === true && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {!usernameStatus.checking && usernameStatus.available === false && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
              {!errors.username && usernameStatus.message && (
                <p className={`mt-1 text-sm ${
                  usernameStatus.available ? 'text-green-600' : 'text-red-600'
                }`}>
                  {usernameStatus.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-2.5 md:py-3 rounded-lg bg-white/60 border ${
                    errors.email ? 'border-red-300' : 'border-white/50'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
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

              {/* Password Requirements - Show as paragraph */}
              {formData.password && (
                <div className="mt-2">
                  {(!passwordValidation.minLength || !passwordValidation.hasCapital || !passwordValidation.hasNumber || !passwordValidation.hasSymbol) && (
                    <p className="text-xs text-red-600">
                      Password must contain 
                      {!passwordValidation.minLength && ' at least 8 characters'}
                      {!passwordValidation.hasCapital && ((!passwordValidation.minLength) ? ', 1 uppercase letter' : ' 1 uppercase letter')}
                      {!passwordValidation.hasNumber && ((!passwordValidation.minLength || !passwordValidation.hasCapital) ? ', 1 number' : ' 1 number')}
                      {!passwordValidation.hasSymbol && ((!passwordValidation.minLength || !passwordValidation.hasCapital || !passwordValidation.hasNumber) ? ' and 1 special character' : ' 1 special character')}
                      .
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-12 py-2.5 md:py-3 rounded-lg bg-white/60 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-white/50'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:scale-110 transition-transform duration-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
              {/* Show mismatch error only when passwords don't match and user has typed in confirm password */}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && !errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match.</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="cursor-pointer w-full py-2.5 md:py-3 px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95"
            >
              Create Account
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

          {/* Google Signup Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
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
            Sign up with Google
          </button>

          {/* Login Link */}
          <div className="mt-4 md:mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
