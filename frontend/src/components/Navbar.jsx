import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, Zap, X, Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function Navbar({ sidebarOpen, setSidebarOpen }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notificationCount] = useState(2);
  const [userProfile, setUserProfile] = useState(null);
  const { logout, isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('http://localhost:3000/user/profile', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        } else {
          console.error('Failed to fetch user profile');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Handle logout
  const handleLogout = () => {
    // Remove cookie
    Cookies.remove('uid', { path: '/' });
    
    // If user is authenticated with Auth0, logout from Auth0
    if (isAuthenticated) {
      logout({
        logoutParams: {
          returnTo: `${window.location.origin}/login`
        }
      });
    } else {
      // Regular logout - just navigate to login
      navigate('/login');
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userProfile) return 'U';
    
    if (userProfile.fullName) {
      const names = userProfile.fullName.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return userProfile.fullName.substring(0, 2).toUpperCase();
    }
    
    return userProfile.username.substring(0, 2).toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    if (!userProfile) return 'Loading...';
    return userProfile.fullName || userProfile.username;
  };

  return (
    <>
      {/* Navbar */}
      <nav className="backdrop-blur-md bg-white/40 border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-screen mx-3 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Hamburger Menu + Logo and AI Name */}
            <div className="flex items-center gap-2">
              {/* Hamburger Menu Button - Space always reserved */}
              <div className="w-10">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-purple-100 rounded-lg transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95"
                  >
                    <Menu size={24} className="text-gray-700 hover:text-purple-600 transition-colors duration-300" />
                  </button>
                )}
              </div>
              
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  AiMind
                </h1>
                <p className="text-xs text-gray-500">Your AI Assistant</p>
              </div>
            </div>

            {/* Right - Desktop View */}
            <div className="hidden md:flex items-center gap-6">
              {/* Credits Section - Prominent Display */}
              <div className="flex items-center gap-1 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200/50 shadow-md hover:shadow-lg transition-all duration-300">
                <Zap size={20} className="text-orange-500" strokeWidth={2.5} />
                <div className="flex flex-col">
                  {/* <span className="text-xs text-gray-600 font-medium">Credits Left</span> */}
                  <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent font-bold text-lg">
                    12,450
                  </span>
                </div>
              </div>

              {/* Notification */}
              <div className="relative cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 flex items-center justify-center hover:shadow-lg transition-all duration-300 hover:scale-110">
                  <Bell size={20} className="text-blue-600" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                      {notificationCount}
                    </span>
                  )}
                </div>
                <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/50 p-3 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Notifications</p>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 p-2 rounded bg-blue-50 border border-blue-100">
                      You've used 50% of credits
                    </div>
                    <div className="text-xs text-gray-600 p-2 rounded bg-green-50 border border-green-100">
                      New feature available
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Section */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/50 hover:shadow-lg hover:from-purple-100 hover:to-indigo-100 transition-all duration-300 group"
                >
                  {userProfile?.picture ? (
                    <img 
                      src={userProfile.picture} 
                      alt={getDisplayName()}
                      className="w-8 h-8 rounded-full shadow-md object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-sm">{getUserInitials()}</span>
                    </div>
                  )}
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-gray-800">{getDisplayName()}</span>
                    <span className="text-xs text-gray-500">Premium</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-600 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 border-b border-white/30">
                      <p className="font-semibold text-gray-800">{getDisplayName()}</p>
                      <p className="text-xs text-gray-500 mt-1">{userProfile?.email || 'Loading...'}</p>
                    </div>
                    <div className="p-2">
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 rounded-lg transition-colors duration-200 flex items-center gap-2">
                        <UserIcon size={16} />
                        Profile Settings
                      </button>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 rounded-lg transition-colors duration-200">
                        🔧 Preferences
                      </button>
                      <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 rounded-lg transition-colors duration-200">
                        💳 Billing
                      </button>
                      <div className="my-2 border-t border-white/30"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center gap-2"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Profile Button */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/50 hover:shadow-lg transition-all duration-300"
            >
              {userProfile?.picture ? (
                <img 
                  src={userProfile.picture} 
                  alt={getDisplayName()}
                  className="w-8 h-8 rounded-full shadow-md object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">{getUserInitials()}</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen w-80 bg-white/95 backdrop-blur-md border-l border-white/30 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/30">
          <h3 className="text-lg font-bold text-gray-800">Menu</h3>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="overflow-y-auto h-full pb-20">
          {/* Credits Section */}
          <div className="p-6 border-b border-white/30">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200/50">
              <Zap size={22} className="text-orange-500" strokeWidth={2.5} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-medium">Credits Left</span>
                <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent font-bold text-xl">
                  12,450
                </span>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="p-6 border-b border-white/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 flex items-center justify-center shadow-md">
                  <Bell size={22} className="text-blue-600" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                      {notificationCount}
                    </span>
                  )}
                </div>
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Notifications</h4>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600 p-3 rounded-lg bg-blue-50 border border-blue-100">
                You've used 50% of credits
              </div>
              <div className="text-sm text-gray-600 p-3 rounded-lg bg-green-50 border border-green-100">
                New feature available
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <div className="p-6 border-b border-white/30">
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-4 rounded-xl border border-purple-200/30 mb-4">
              <div className="flex items-center gap-3 mb-3">
                {userProfile?.picture ? (
                  <img 
                    src={userProfile.picture} 
                    alt={getDisplayName()}
                    className="w-12 h-12 rounded-full shadow-md object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-lg">{getUserInitials()}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <p className="font-semibold text-gray-800">{getDisplayName()}</p>
                  <p className="text-xs text-gray-500">Premium</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">{userProfile?.email || 'Loading...'}</p>
            </div>

            {/* Menu Items */}
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2">
                <UserIcon size={16} />
                Profile Settings
              </button>
              <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 rounded-lg transition-colors duration-200 font-medium">
                🔧 Preferences
              </button>
              <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 rounded-lg transition-colors duration-200 font-medium">
                💳 Billing
              </button>
              <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 rounded-lg transition-colors duration-200 font-medium">
                ⚙️ Settings
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="p-6">
            <button 
              onClick={handleLogout}
              className="w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 font-medium border border-red-200/50 flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}