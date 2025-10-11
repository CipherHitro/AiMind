import { useState } from 'react'
import './App.css'
import Navbar from './components/Navbar';
import ChatInterface from './components/ChatInterface';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }}>
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <ChatInterface sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    </div>
  )
}

export default App
