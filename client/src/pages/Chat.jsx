import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';

export default function Chat() {
  const { user } = useAuth();
  const location = useLocation();
  const startListingId = location.state?.startListingId;
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get('/chats').then((res) => {
      setChats(res.data);
      if (startListingId) {
        api.post('/chats/start', { listingId: startListingId }).then((startRes) => {
          const chat = startRes.data;
          setActiveChat(chat);
          setChats((prev) => {
            const exists = prev.find((c) => c._id === chat._id);
            if (exists) return prev;
            return [chat, ...prev];
          });
          loadMessages(chat._id);
        }).catch(() => {}).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));
  }, [startListingId]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    socketRef.current = io(window.location.origin, {
      auth: { token },
      path: '/socket.io',
    });
    socketRef.current.on('connect_error', () => {});
    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (!socketRef.current || !activeChat) return;
    socketRef.current.emit('joinChat', activeChat._id);
    socketRef.current.on('newMessage', (msg) => {
      if (msg.chatId === activeChat._id) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => {
      socketRef.current?.emit('leaveChat', activeChat._id);
      socketRef.current?.off('newMessage');
    };
  }, [activeChat?._id]);

  const loadMessages = (chatId) => {
    api.get(`/chats/${chatId}/messages`).then((res) => {
      setMessages(res.data);
    });
  };

  const selectChat = (chat) => {
    setActiveChat(chat);
    loadMessages(chat._id);
  };

  const sendMessage = async () => {
    const content = newMessage.trim();
    if (!content || !activeChat) return;
    if (socketRef.current?.connected) {
      socketRef.current.emit('sendMessage', { chatId: activeChat._id, content });
      setNewMessage('');
      return;
    }
    try {
      const { data } = await api.post(`/chats/${activeChat._id}/messages`, { content });
      setMessages((prev) => [...prev, data]);
      setNewMessage('');
    } catch (err) {}
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Messages</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[600px]">
        <div className="flex flex-1 min-h-0">
          <div className="w-full md:w-80 border-r border-slate-200 overflow-y-auto">
            {chats.length === 0 ? (
              <p className="p-4 text-slate-500">No chats yet. Start a chat from a listing.</p>
            ) : (
              chats.map((chat) => (
                <button
                  key={chat._id}
                  onClick={() => selectChat(chat)}
                  className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 ${
                    activeChat?._id === chat._id ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-semibold">
                      {(chat.otherUser?.name || '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">
                        {chat.otherUser?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {chat.listingId?.title || 'Listing'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            {activeChat ? (
              <>
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <p className="font-medium text-slate-800">{activeChat.otherUser?.name}</p>
                  <p className="text-sm text-slate-500">{activeChat.listingId?.title}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m._id}
                      className={`flex ${m.senderId?._id === user?.id || m.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-xl ${
                          m.senderId?._id === user?.id || m.senderId === user?.id
                            ? 'bg-primary-600 text-white'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        <p>{m.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                  className="p-4 border-t border-slate-200 flex gap-2"
                >
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    maxLength={2000}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                Select a chat or start one from a listing
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
