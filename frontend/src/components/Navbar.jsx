import React, { useState, useEffect } from 'react';
import { Bell, ChevronDown, Zap, X, Menu, LogOut, User as UserIcon, Building2, Plus, Check, Trash2 } from 'lucide-react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import OrganizationModal from './OrganizationModal';
import CreateOrgModal from './CreateOrgModal';
import { useSocket } from '../hooks/useSocket';
import { getTimeAgo } from '../utils/timeAgo';

export default function Navbar({ sidebarOpen, setSidebarOpen, userCredits = 0 }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false);
  const { logout, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_BASE_API_URL;
  
  // Socket.IO integration
  const { connected, notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useSocket();

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`${BASE_URL}/user/profile`, {
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

  // Switch active organization
  const handleSwitchOrganization = async (orgId) => {
    try {
      const response = await fetch(`${BASE_URL}/organization/${orgId}/switch`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Refetch user profile to get updated active organization
        const profileResponse = await fetch(`${BASE_URL}/user/profile`, {
          method: 'GET',
          credentials: 'include',
        });
        
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          setUserProfile(data);
          setIsOrgDropdownOpen(false);
          
          // Trigger custom event to notify other components
          window.dispatchEvent(new Event('organizationChanged'));
        }
      } else {
        console.error('Failed to switch organization');
      }
    } catch (error) {
      console.error('Error switching organization:', error);
    }
  };

  // Get active organization
  const getActiveOrganization = () => {
    if (!userProfile?.activeOrganization) {
      return 'No Organization';
    }
    return userProfile.activeOrganization.name;
  };

  // Handle organization created successfully
  const handleOrganizationCreated = async () => {
    // Refetch user profile to get updated organizations
    try {
      const response = await fetch(`${BASE_URL}/user/profile`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching updated profile:', error);
    }
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
              {/* Organization Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50 hover:shadow-lg hover:from-indigo-100 hover:to-purple-100 transition-all duration-300"
                >
                  <Building2 size={18} className="text-indigo-600" />
                  <span className="text-sm font-semibold text-gray-800 max-w-[150px] truncate">
                    {getActiveOrganization()}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-600 transition-transform duration-300 ${isOrgDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Organization Dropdown Menu */}
                {isOrgDropdownOpen && (
                  <div className="absolute left-0 top-full mt-3 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-4 border-b border-white/30">
                      <p className="font-semibold text-gray-800">Your Organizations</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {userProfile?.organizations?.length || 0} organization{userProfile?.organizations?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="p-2 max-h-96 overflow-y-auto">
                      {/* Organization List */}
                      {userProfile?.organizations && userProfile.organizations.length > 0 ? (
                        userProfile.organizations.map((org) => (
                          <div key={org._id} className="mb-1">
                            <button
                              onClick={() => {
                                if (!org.isActive) {
                                  handleSwitchOrganization(org._id);
                                } else {
                                  setShowOrgModal(true);
                                  setIsOrgDropdownOpen(false);
                                }
                              }}
                              className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                                org.isActive
                                  ? 'bg-indigo-100 border border-indigo-300'
                                  : 'hover:bg-purple-50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    org.isActive 
                                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                                      : 'bg-gradient-to-br from-gray-400 to-gray-500'
                                  }`}>
                                    <Building2 size={18} className="text-white" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-800 truncate max-w-[150px]">
                                      {org.name}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {org.memberCount} member{org.memberCount !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                    org.role === 'admin' 
                                      ? 'bg-purple-100 text-purple-700' 
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {org.role}
                                  </span>
                                  {org.isDefault && (
                                    <span className="text-xs text-gray-400">Default</span>
                                  )}
                                </div>
                              </div>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-6 text-center text-gray-500 text-sm">
                          No organizations found
                        </div>
                      )}
                      
                      {/* Divider */}
                      <div className="my-2 border-t border-white/30"></div>
                      
                      {/* Create Organization Button */}
                      <button
                        onClick={() => {
                          setShowCreateOrgModal(true);
                          setIsOrgDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200 flex items-center gap-2 font-semibold"
                      >
                        <Plus size={18} />
                        Create Organization
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Credits Section - Prominent Display */}
              <div className="flex items-center gap-1 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200/50 shadow-md hover:shadow-lg transition-all duration-300">
                <Zap size={20} className="text-orange-500" strokeWidth={2.5} />
                <div className="flex flex-col">
                  {/* <span className="text-xs text-gray-600 font-medium">Credits Left</span> */}
                  <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent font-bold text-lg">
                    {userCredits.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Notification */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 flex items-center justify-center hover:shadow-lg transition-all duration-300 hover:scale-110"
                >
                  <Bell size={20} className="text-blue-600" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div className="absolute top-full right-0 mt-2 w-96 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-800">Notifications</p>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <Check size={14} />
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors group ${
                              !notification.isRead ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {!notification.isRead && (
                                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                              )}
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => !notification.isRead && markAsRead(notification._id)}
                              >
                                <p className="text-sm font-semibold text-gray-800 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {getTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification._id);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                                title="Delete notification"
                              >
                                <Trash2 size={14} className="text-red-500" />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Bell size={32} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                  {userCredits.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Organization Section */}
          <div className="p-6 border-b border-white/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/50 flex items-center justify-center shadow-md">
                <Building2 size={22} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">Organization</h3>
                <p className="text-xs text-gray-500">
                  {userProfile?.organizations?.length || 0} organization{userProfile?.organizations?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {/* Current Organization Display */}
            <div className="mb-3 px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200/50">
              <p className="text-xs text-gray-600 font-medium mb-1">Active Organization</p>
              <p className="text-sm font-bold text-gray-800">{getActiveOrganization()}</p>
            </div>

            {/* Organization List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {userProfile?.organizations && userProfile.organizations.length > 0 ? (
                userProfile.organizations.map((org) => (
                  <button
                    key={org._id}
                    onClick={() => {
                      if (!org.isActive) {
                        handleSwitchOrganization(org._id);
                      } else {
                        setShowOrgModal(true);
                        setIsMobileSidebarOpen(false);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                      org.isActive
                        ? 'bg-indigo-100 border border-indigo-300'
                        : 'hover:bg-purple-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          org.isActive 
                            ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                            : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          <Building2 size={18} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">
                            {org.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {org.memberCount} member{org.memberCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          org.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {org.role}
                        </span>
                        {org.isDefault && (
                          <span className="text-xs text-gray-400">Default</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-6 text-center text-gray-500 text-sm">
                  No organizations found
                </div>
              )}
            </div>

            {/* Create Organization Button */}
            <button
              onClick={() => {
                setShowCreateOrgModal(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full mt-3 px-4 py-3 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 font-semibold border border-indigo-200/50"
            >
              <Plus size={18} />
              Create Organization
            </button>
          </div>

          {/* Notifications Section */}
          <div className="p-6 border-b border-white/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 flex items-center justify-center shadow-md">
                    <Bell size={22} className="text-blue-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-gray-800">Notifications</h4>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Check size={14} />
                  Mark all
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-3 rounded-lg border transition-colors group ${
                      !notification.isRead ? 'bg-blue-50/50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></div>
                      )}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => !notification.isRead && markAsRead(notification._id)}
                      >
                        <p className="text-sm font-semibold text-gray-800">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                        title="Delete notification"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Bell size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
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

      {/* Organization Modal */}
      <OrganizationModal
        isOpen={showOrgModal}
        onClose={() => setShowOrgModal(false)}
        organizationId={userProfile?.activeOrganization?._id}
      />

      {/* Create Organization Modal */}
      <CreateOrgModal
        isOpen={showCreateOrgModal}
        onClose={() => setShowCreateOrgModal(false)}
        onSuccess={handleOrganizationCreated}
      />
    </>
  );
}