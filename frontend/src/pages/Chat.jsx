import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import ChatInterface from '../components/ChatInterface';

function Chat() {
  // Large screen: restore sidebar state from localStorage, default open
  // Mobile: always closed unless user opens manually
  const getInitialSidebarState = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 768) {
        const saved = localStorage.getItem('sidebarOpen');
        return saved === null ? true : saved === 'true';
      } else {
        return false;
      }
    }
    return false;
  };
  const [sidebarOpen, setSidebarOpen] = useState(getInitialSidebarState());
  const [userCredits, setUserCredits] = useState(0);

  const handleCreditsUpdate = (credits) => {
    setUserCredits(credits);
  };

  // Persist sidebar state only for desktop
  React.useEffect(() => {
    if (window.innerWidth >= 768) {
      localStorage.setItem('sidebarOpen', sidebarOpen);
    }
  }, [sidebarOpen]);

  // On resize, reset sidebar for mobile, restore for desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        const saved = localStorage.getItem('sidebarOpen');
        setSidebarOpen(saved === null ? true : saved === 'true');
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userCredits={userCredits} />
      <ChatInterface sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onCreditsUpdate={handleCreditsUpdate} />
    </div>
  );
}

export default Chat;
