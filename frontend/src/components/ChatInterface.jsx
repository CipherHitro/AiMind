import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Menu, X, MessageSquare, Trash2, Edit2, MoreHorizontal } from 'lucide-react';

export default function ChatInterface({ sidebarOpen, setSidebarOpen, onCreditsUpdate }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [hoveredChat, setHoveredChat] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentOrgId, setCurrentOrgId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [tempChatTitle, setTempChatTitle] = useState('New Chat');
  const [userCredits, setUserCredits] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chats from server
  const fetchChats = async () => {
    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setChatHistory(data.chats);
        setCurrentOrgId(data.organizationId);
        
        // If no active chat and chats exist, select the first one
        if (!activeChatId && data.chats.length > 0) {
          loadChat(data.chats[0]._id);
        }
      } else {
        console.error('Failed to fetch chats');
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // Fetch user credits
  const fetchUserCredits = async () => {
    try {
      const response = await fetch('http://localhost:3000/user/credits', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.credits);
        // Notify parent component about credits update
        if (onCreditsUpdate) {
          onCreditsUpdate(data.credits);
        }
      } else {
        console.error('Failed to fetch credits');
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  // Load a specific chat with messages
  const loadChat = async (chatId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/chat/${chatId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setActiveChatId(chatId);
        setMessages(data.chat.messages);
      } else {
        console.error('Failed to load chat');
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchChats();
    fetchUserCredits();
  }, []);

  // Refetch chats when organization changes
  useEffect(() => {
    const handleOrgChange = () => {
      fetchChats();
      setActiveChatId(null);
      setMessages([]);
    };

    // Listen for custom event when organization changes
    window.addEventListener('organizationChanged', handleOrgChange);
    
    return () => {
      window.removeEventListener('organizationChanged', handleOrgChange);
    };
  }, []);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    if (!activeChatId) {
      alert('Please select or create a chat first');
      return;
    }

    const messageText = inputValue;
    setInputValue('');

    try {
      let chatId = activeChatId;
      
      // If this is a temporary chat, create it in database first
      if (isTemporaryChat) {
        const createResponse = await fetch('http://localhost:3000/chat/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: tempChatTitle,
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          alert(error.message || 'Failed to create chat');
          setInputValue(messageText);
          return;
        }

        const createData = await createResponse.json();
        chatId = createData.chat._id;
        setActiveChatId(chatId);
        setIsTemporaryChat(false);
      }

      // Now send the message
      const response = await fetch(`http://localhost:3000/chat/${chatId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: messageText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update user credits from response
        if (data.credits !== undefined) {
          setUserCredits(data.credits);
          // Notify parent component about credits update
          if (onCreditsUpdate) {
            onCreditsUpdate(data.credits);
          }
        }
        
        // If the backend auto-generated a title, update it in the chat history
        if (data.chatTitle) {
          // Update chat title in the sidebar immediately
          setChatHistory(prevHistory => 
            prevHistory.map(chat => 
              chat._id === chatId ? { ...chat, title: data.chatTitle } : chat
            )
          );
        }
        
        // Reload the entire chat to get updated messages from backend
        // Backend removes system messages automatically
        loadChat(chatId);
        fetchChats(); // Refresh chat list to show the new chat with updated title
      } else {
        const error = await response.json();
        
        // Handle insufficient credits error
        if (response.status === 403 && error.credits !== undefined) {
          alert(`Insufficient credits! You have ${error.credits} credits, but need ${error.requiredCredits} credits to send a message.`);
        } else {
          alert(error.message || 'Failed to send message');
        }
        
        setInputValue(messageText); // Restore input value on error
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
      setInputValue(messageText);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = async () => {
    // Create temporary chat with welcome message immediately
    setIsTemporaryChat(true);
    setActiveChatId('temp-chat');
    setTempChatTitle('New Chat');
    setMessages([
      {
        role: 'system',
        content: 'Welcome to AiMind\n\nStart a conversation with your AI assistant. Ask me anything, and I\'ll help you with information, creative tasks, coding, and more.',
        timestamp: new Date()
      }
    ]);
  };

  const selectChat = (chatId) => {
    setIsTemporaryChat(false); // Clear temporary chat state
    loadChat(chatId);
  };

  const deleteChat = async (chatId) => {
    if (!confirm('Are you sure you want to delete this chat?')) return;

    try {
      const response = await fetch(`http://localhost:3000/chat/${chatId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // If deleted chat was active, clear messages
        if (activeChatId === chatId) {
          setActiveChatId(null);
          setMessages([]);
        }
        fetchChats(); // Refresh chat list
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      alert('Failed to delete chat');
    }
  };

  const renameChat = async (chatId, newTitle) => {
    if (!newTitle.trim()) {
      alert('Chat title cannot be empty');
      return;
    }

    try {
      console.log('Renaming chat:', chatId, 'to:', newTitle);
      const response = await fetch(`http://localhost:3000/chat/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newTitle.trim(),
        }),
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Rename successful:', data);
        setEditingChatId(null);
        setEditingChatTitle('');
        await fetchChats(); // Refresh chat list
        alert('Chat renamed successfully!');
      } else {
        const error = await response.json();
        console.error('Rename error:', error);
        alert(error.message || 'Failed to rename chat');
      }
    } catch (error) {
      console.error('Error renaming chat:', error);
      alert('Failed to rename chat: ' + error.message);
    }
  };

  const startRenaming = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setEditingChatTitle(currentTitle);
    setShowChatMenu(null);
  };

  const handleSuggestedPrompt = async (prompt) => {
    if (!activeChatId) {
      alert('Please select or create a chat first');
      return;
    }

    try {
      let chatId = activeChatId;
      
      // If this is a temporary chat, create it in database first
      if (isTemporaryChat) {
        const createResponse = await fetch('http://localhost:3000/chat/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            title: tempChatTitle,
          }),
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          alert(error.message || 'Failed to create chat');
          return;
        }

        const createData = await createResponse.json();
        chatId = createData.chat._id;
        setActiveChatId(chatId);
        setIsTemporaryChat(false);
      }

      // Now send the message
      const response = await fetch(`http://localhost:3000/chat/${chatId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: prompt,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update user credits from response
        if (data.credits !== undefined) {
          setUserCredits(data.credits);
          // Notify parent component about credits update
          if (onCreditsUpdate) {
            onCreditsUpdate(data.credits);
          }
        }
        
        // If the backend auto-generated a title, update it in the chat history
        if (data.chatTitle) {
          // Update chat title in the sidebar immediately
          setChatHistory(prevHistory => 
            prevHistory.map(chat => 
              chat._id === chatId ? { ...chat, title: data.chatTitle } : chat
            )
          );
        }
        
        // Reload the entire chat to get updated messages from backend
        // Backend removes system messages automatically
        loadChat(chatId);
        fetchChats(); // Refresh chat list to show the new chat with updated title
      } else {
        const error = await response.json();
        
        // Handle insufficient credits error
        if (response.status === 403 && error.credits !== undefined) {
          alert(`Insufficient credits! You have ${error.credits} credits, but need ${error.requiredCredits} credits to send a message.`);
        } else {
          alert(error.message || 'Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  const suggestedPrompts = [
    "Explain quantum computing in simple terms",
    "Write a creative story about space",
    "Help me debug my React code",
    "Generate ideas for a blog post"
  ];

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
          {chatHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No chats yet. Create a new chat to get started!
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div
                key={chat._id}
                onClick={() => selectChat(chat._id)}
                onMouseEnter={() => setHoveredChat(chat._id)}
                onMouseLeave={() => {
                  setHoveredChat(null);
                  setShowChatMenu(null);
                }}
                className={`relative group px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between ${
                  activeChatId === chat._id
                  ? 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-300/50'
                  : 'hover:bg-white/40 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MessageSquare size={16} className="text-purple-500 flex-shrink-0" />
                <h3 className="text-sm font-medium text-gray-800 truncate">{chat.title}</h3>
              </div>
              
              {/* Three Dots Menu Button - Shows on hover */}
              {hoveredChat === chat._id && (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChatMenu(showChatMenu === chat._id ? null : chat._id);
                    }}
                    className="p-1 hover:bg-white/60 rounded transition-colors"
                  >
                    <MoreHorizontal size={16} className="text-gray-600" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showChatMenu === chat._id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRenaming(chat._id, chat.title);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Edit2 size={14} />
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat._id);
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
            ))
          )}
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
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : messages.length === 1 && messages[0].role === 'system' ? (
            // Special case: Only welcome message exists - center it
            <div className="flex items-center justify-center h-full">
              <div className="max-w-2xl w-full text-center space-y-6 px-4">
                {/* Welcome Header */}
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {messages[0].content.split('\n')[0]}
                  </h1>
                  <p className="text-gray-600 text-base max-w-lg mx-auto">
                    {messages[0].content.split('\n').slice(2).join(' ')}
                  </p>
                </div>
                
                {/* Suggested Prompts */}
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedPrompt(prompt)}
                        className="px-5 py-3.5 rounded-xl bg-white border border-gray-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 shadow-sm hover:shadow-md text-left group"
                      >
                        <p className="text-sm text-gray-700 group-hover:text-purple-700">
                          {prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Regular chat messages
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message, index) => {
                // Skip system messages in regular chat view
                if (message.role === 'system') return null;
                
                // Regular message rendering
                return (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-xs lg:max-w-lg px-4 py-3 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-br-none shadow-lg'
                          : 'bg-white/60 text-gray-800 border border-white/50 rounded-bl-none shadow-md'
                      } backdrop-blur-md break-words`}
                    >
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-white/30 bg-white/30 backdrop-blur-md">
          <div className="max-w-3xl mx-auto">
            {/* Low Credits Warning */}
            {userCredits < 2 && (
              <div className="mb-3 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-center">
                <p className="text-sm font-medium text-red-700">
                  Insufficient credits! You need at least 2 credits to send a message.
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={userCredits < 2 ? "Insufficient credits..." : "Type your message here..."}
                disabled={userCredits < 2}
                className="flex-1 px-4 py-3 rounded-full bg-white/60 border border-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-md placeholder-gray-500 text-gray-800 shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={userCredits < 2}
                className="px-4 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-500 disabled:hover:to-indigo-600"
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

      {/* Rename Modal */}
      {editingChatId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Rename Chat</h3>
            <input
              type="text"
              value={editingChatTitle}
              onChange={(e) => setEditingChatTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  renameChat(editingChatId, editingChatTitle);
                }
              }}
              placeholder="Enter chat title..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setEditingChatId(null);
                  setEditingChatTitle('');
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => renameChat(editingChatId, editingChatTitle)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}