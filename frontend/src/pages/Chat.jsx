import { useState } from 'react';
import Navbar from '../components/Navbar';
import ChatInterface from '../components/ChatInterface';

function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userCredits, setUserCredits] = useState(0);

  const handleCreditsUpdate = (credits) => {
    setUserCredits(credits);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} userCredits={userCredits} />
      <ChatInterface sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} onCreditsUpdate={handleCreditsUpdate} />
    </div>
  );
}

export default Chat;
