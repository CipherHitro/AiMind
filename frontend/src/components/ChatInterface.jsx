import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Menu, X, MessageSquare, Trash2, Edit2, MoreHorizontal } from 'lucide-react';

export default function ChatInterface({ sidebarOpen, setSidebarOpen }) {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! How can I help you today?', sender: 'ai', timestamp: new Date() }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { id: 1, title: 'Welcome Chat', active: true, messageCount: 1 },
    { id: 2, title: 'Previous Conversation about React', active: false, messageCount: 5 },
    { id: 3, title: 'About AiMind Features', active: false, messageCount: 3 },
    { id: 4, title: 'JavaScript Best Practices', active: false, messageCount: 8 },
  ]);
  const [hoveredChat, setHoveredChat] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        text: 'This is an AI response. I understood your message and I\'m here to help you with any questions or tasks you need assistance with!',
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([{ id: 1, text: 'Hello! How can I help you today?', sender: 'ai', timestamp: new Date() }]);
    setChatHistory(chatHistory.map(chat => ({ ...chat, active: false })));
  };

  const selectChat = (chatId) => {
    setChatHistory(chatHistory.map(chat => ({
      ...chat,
      active: chat.id === chatId
    })));
    setMessages([
      { id: 1, text: 'Chat loaded. How can I assist you?', sender: 'ai', timestamp: new Date() }
    ]);
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Backdrop blur overlay for mobile - only blurs chat area, not navbar */}
      {sidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/10 backdrop-blur-sm z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Chat History */}
      <div
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
          ${sidebarOpen ? 'md:w-64' : 'md:w-0'}
          fixed md:relative
          w-64
          h-full
          z-20
          transition-all duration-300 ease-in-out 
          flex flex-col 
          bg-white/50 backdrop-blur-md 
          border-r border-white/30 
          overflow-hidden
          md:border-r
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Chat History</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 hover:bg-red-100 rounded-lg transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 group"
            >
              <X size={18} className="text-gray-600 group-hover:text-red-600 transition-colors duration-300" />
            </button>
          </div>
          <button
            onClick={startNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Plus size={18} />
            New Chat
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chatHistory.map((chat) => (
            <div
              key={chat.id}
              onClick={() => selectChat(chat.id)}
              onMouseEnter={() => setHoveredChat(chat.id)}
              onMouseLeave={() => {
                setHoveredChat(null);
                setShowChatMenu(null);
              }}
              className={`relative group px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between ${
                chat.active
                  ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-300/50'
                  : 'hover:bg-white/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare size={16} className="text-purple-500 flex-shrink-0" />
                <h3 className="text-sm font-medium text-gray-800 truncate">{chat.title}</h3>
              </div>
              
              {/* Three Dots Menu Button - Shows on hover */}
              {hoveredChat === chat.id && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChatMenu(showChatMenu === chat.id ? null : chat.id);
                    }}
                    className="p-1 hover:bg-white/60 rounded transition-colors"
                  >
                    <MoreHorizontal size={16} className="text-gray-600" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showChatMenu === chat.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle rename
                          setShowChatMenu(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Edit2 size={14} />
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle delete
                          setShowChatMenu(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/30">
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 text-center">
            <p className="text-xs text-gray-600">
              <span className="font-bold text-blue-600">Pro Plan</span> - Unlimited chats
            </p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-xs lg:max-w-lg px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-br-none shadow-lg'
                      : 'bg-white/60 text-gray-800 border border-white/50 rounded-bl-none shadow-md'
                  } backdrop-blur-md break-words`}
                >
                  <p className="text-sm leading-relaxed break-words">{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-white/30 bg-white/30 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="flex-1 px-4 py-3 rounded-full bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-md placeholder-gray-500 text-gray-800 shadow-md transition-all duration-300"
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-95"
              >
                <Send size={20} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}