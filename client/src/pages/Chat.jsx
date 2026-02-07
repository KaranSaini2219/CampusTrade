import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export default function Chat() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const startListingId = location.state?.startListingId;
  
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    console.log('Initializing socket connection...');
    
    socketRef.current = io(window.location.origin, {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket connected');
      setSocketConnected(true);
      setError(null);
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
      setSocketConnected(false);
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setSocketConnected(false);
    });

    return () => {
      if (socketRef.current) {
        console.log('Disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  // Load initial chats
  useEffect(() => {
    const loadChats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await api.get('/chats');
        console.log('Loaded chats:', res.data.length);
        setChats(res.data);

        // Handle starting a new chat from a listing
        if (startListingId) {
          console.log('Starting chat for listing:', startListingId);
          
          try {
            const startRes = await api.post('/chats/start', { listingId: startListingId });
            const chat = startRes.data;
            
            console.log('Chat started:', chat);
            setActiveChat(chat);
            
            // Add to chats list if not already there
            setChats((prev) => {
              const exists = prev.find((c) => c._id === chat._id);
              if (exists) return prev;
              return [chat, ...prev];
            });
            
            await loadMessages(chat._id);
          } catch (err) {
            console.error('Error starting chat:', err);
            const errorMsg = err.response?.data?.message || 'Failed to start chat. Please try again.';
            setError(errorMsg);
            alert(errorMsg);
          }
        }
      } catch (err) {
        console.error('Error loading chats:', err);
        setError('Failed to load chats. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [startListingId]);

  // Handle Socket.IO messages for active chat
  useEffect(() => {
    if (!socketRef.current || !activeChat) return;

    const chatId = activeChat._id;
    console.log('Joining chat room:', chatId);

    // Join the chat room
    socketRef.current.emit('joinChat', chatId);

    // Listen for new messages
    const handleNewMessage = (msg) => {
      console.log('Received new message:', msg);
      
      // Only add message if it belongs to active chat
      if (msg.chatId === chatId) {
        setMessages((prev) => {
          // Prevent duplicates
          const exists = prev.find((m) => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });
      }
    };

    socketRef.current.on('newMessage', handleNewMessage);

    // Cleanup
    return () => {
      console.log('Leaving chat room:', chatId);
      socketRef.current?.emit('leaveChat', chatId);
      socketRef.current?.off('newMessage', handleNewMessage);
    };
  }, [activeChat?._id]);

  const loadMessages = async (chatId) => {
    try {
      setLoadingMessages(true);
      setError(null);
      
      const res = await api.get(`/chats/${chatId}/messages`);
      console.log('Loaded messages:', res.data.length);
      setMessages(res.data);
    } catch (err) {
      console.error('Error loading messages:', err);
      
      if (err.response?.status === 403) {
        setError('You do not have access to this chat.');
        setActiveChat(null);
      } else {
        setError('Failed to load messages.');
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const selectChat = async (chat) => {
    console.log('Selecting chat:', chat._id);
    setActiveChat(chat);
    setMessages([]);
    setError(null);
    await loadMessages(chat._id);
  };

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !activeChat || sendingMessage) return;

    console.log('Sending message:', content.substring(0, 50));
    setSendingMessage(true);
    const tempMessage = newMessage;
    setNewMessage(''); // Clear input immediately

    try {
      // Try Socket.IO first if connected
      if (socketRef.current?.connected) {
        console.log('Sending via Socket.IO');
        socketRef.current.emit('sendMessage', {
          chatId: activeChat._id,
          content,
        });
      } else {
        // Fallback to HTTP
        console.log('Sending via HTTP');
        const { data } = await api.post(`/chats/${activeChat._id}/messages`, { content });
        
        // Add message to state if not already added by socket
        setMessages((prev) => {
          const exists = prev.find((m) => m._id === data._id);
          if (exists) return prev;
          return [...prev, data];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setNewMessage(tempMessage); // Restore message on error
      
      const errorMsg = err.response?.data?.message || 'Failed to send message.';
      setError(errorMsg);
      
      if (err.response?.status === 403) {
        alert('You do not have permission to send messages in this chat.');
      } else {
        alert('Failed to send message. Please try again.');
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-96 bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Messages</h1>
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className="text-sm text-slate-600">
            {socketConnected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="flex h-[700px]">
          {/* Chat List Sidebar */}
          <div className="w-full md:w-96 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-700">Your Conversations</h2>
              <p className="text-xs text-slate-500 mt-1">{chats.length} chat{chats.length !== 1 ? 's' : ''}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium">No conversations yet</p>
                  <p className="text-sm text-slate-500 mt-2">Start chatting by clicking "Contact Seller" on any listing</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => selectChat(chat)}
                    className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-all ${
                      activeChat?._id === chat._id 
                        ? 'bg-primary-50 border-l-4 border-l-primary-600' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                        {(chat.otherUser?.name || '?')[0].toUpperCase()}
                      </div>
                      
                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">
                          {chat.otherUser?.name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-slate-600 truncate">
                          {chat.listingId?.title || 'Listing'}
                        </p>
                        {chat.lastMessage && (
                          <p className="text-xs text-slate-400 truncate mt-1">
                            {chat.lastMessage.content}
                          </p>
                        )}
                      </div>
                      
                      {/* Unread Indicator (optional - can add unread count later) */}
                      {activeChat?._id !== chat._id && chat.lastMessage && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
            {activeChat ? (
              <>
                {/* Chat Header */}
                <div className="p-5 border-b border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                      {(activeChat.otherUser?.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">
                        {activeChat.otherUser?.name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {activeChat.listingId?.title || 'Listing'}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/listings/${activeChat.listingId?._id}`)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      View Listing →
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingMessages ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                      </div>
                      <p className="text-slate-600 font-medium">No messages yet</p>
                      <p className="text-sm text-slate-500 mt-1">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((m, index) => {
                      const isSentByMe = m.senderId?._id === user?.id || m.senderId === user?.id;
                      const showAvatar = index === 0 || messages[index - 1]?.senderId?._id !== m.senderId?._id;
                      
                      return (
                        <div
                          key={m._id}
                          className={`flex gap-2 ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isSentByMe && showAvatar && (
                            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 text-sm font-semibold flex-shrink-0">
                              {(activeChat.otherUser?.name || '?')[0].toUpperCase()}
                            </div>
                          )}
                          {!isSentByMe && !showAvatar && <div className="w-8"></div>}
                          
                          <div className={`max-w-[70%] ${isSentByMe ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div
                              className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                                isSentByMe
                                  ? 'bg-primary-600 text-white rounded-br-sm'
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm'
                              }`}
                            >
                              <p className="break-words whitespace-pre-wrap">{m.content}</p>
                            </div>
                            <p className={`text-xs mt-1 px-2 ${isSentByMe ? 'text-slate-400' : 'text-slate-500'}`}>
                              {new Date(m.createdAt).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-200 bg-white">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-3"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      maxLength={2000}
                      disabled={sendingMessage}
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm hover:shadow-md disabled:hover:shadow-sm"
                    >
                      {sendingMessage ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending
                        </span>
                      ) : (
                        'Send'
                      )}
                    </button>
                  </form>
                  <p className="text-xs text-slate-500 mt-2">
                    Press Enter to send • {2000 - newMessage.length} characters remaining
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-xl font-semibold text-slate-700 mb-2">Select a conversation</p>
                  <p className="text-slate-500">Choose a chat from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
