import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, MoreVertical, Image, Flag, UserX } from 'lucide-react';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import ReportModal from '../components/ReportModal';
import io from 'socket.io-client';

const Chat = () => {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const { chatId } = useParams();
  const { user } = useAuth();
  const userId = user?.id || user?._id;
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const hasShownSocketErrorRef = useRef(false);

  useEffect(() => {
    fetchChat();
    initializeSocket();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      document.body.style.overflow = previousOverflow;
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    socketRef.current = io(process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token }
    });
    
    socketRef.current.emit('join-chat', chatId);
    
    socketRef.current.on('receive-message', (message) => {
      const createdAt = message.createdAt || message.timestamp || message.created_at || new Date().toISOString();
      setMessages(prev => [...prev, { ...message, createdAt }]);
    });

    socketRef.current.on('connect_error', () => {
      if (!hasShownSocketErrorRef.current) {
        hasShownSocketErrorRef.current = true;
        toast.error('Chat connection failed. Please refresh.');
      }
    });
  };

  const fetchChat = async () => {
    try {
      const response = await API.get(`/chat/${chatId}`);
      setChat(response.data);
      setMessages(response.data.messages || []);
      setIsUserBlocked(response.data.isBlocked || false);
    } catch (error) {
      toast.error('Failed to load chat');
      navigate('/matches');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || chat?.isBlocked) return;

    setSending(true);
    try {
      const messageData = {
        chatId,
        content: newMessage.trim(),
        messageType: 'text'
      };

      const response = await API.post('/chat/message', messageData);
      
      // Emit to socket for real-time delivery
      const createdAt = new Date().toISOString();
      socketRef.current.emit('send-message', {
        ...response.data,
        chatId,
        sender: { _id: userId, name: user?.name },
        createdAt
      });
      
      setMessages(prev => [...prev, {
        ...response.data,
        sender: { _id: userId, name: user?.name },
        createdAt
      }]);
      
      setNewMessage('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append('chatId', chatId);
      formData.append('image', file);
      formData.append('messageType', 'image');

      const response = await API.post('/chat/message', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Emit to socket
      const createdAt = new Date().toISOString();
      socketRef.current.emit('send-message', {
        ...response.data,
        chatId,
        sender: { _id: userId, name: user?.name },
        createdAt
      });
      
      setMessages(prev => [...prev, {
        ...response.data,
        sender: { _id: userId, name: user?.name },
        createdAt
      }]);
      
      toast.success('Image sent!');
    } catch (error) {
      toast.error('Failed to send image');
    } finally {
      setSending(false);
    }
  };

  const blockUser = async () => {
    try {
      await API.post('/reports/block', { userId: otherParticipant._id });
      toast.success('User blocked successfully');
      setIsUserBlocked(true);
      setChat(prev => ({ ...prev, isBlocked: true }));
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const unblockUser = async () => {
    try {
      await API.post('/reports/unblock', { userId: otherParticipant._id });
      toast.success('User unblocked successfully');
      setIsUserBlocked(false);
      setChat(prev => ({ ...prev, isBlocked: false }));
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return 'Recently';
    }
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Chat not found</p>
          <button onClick={() => navigate('/matches')} className="btn-primary mt-4">
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  const otherParticipant = chat.participants.find(p => p._id !== userId);
  
  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const timestamp = message.createdAt || message.timestamp || message.created_at || new Date().toISOString();
    const date = formatDate(timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push({ ...message, createdAt: timestamp });
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-11/12 max-w-6xl mx-auto px-0 sm:px-4 pt-20">
        <div className="flex flex-col h-[calc(100vh-112px)] overflow-hidden">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/matches')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-semibold">
                    {otherParticipant?.name?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{otherParticipant?.name}</h2>
                  <p className="text-sm text-gray-500">Pet Parent</p>
                </div>
              </div>
            </div>
            
            <button 
              className="p-2 hover:bg-gray-100 rounded-full relative"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg py-2 w-48 z-10">
                  <button
                    onClick={() => {
                      setShowReportModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                  >
                    <Flag className="w-4 h-4" />
                    <span>Report User</span>
                  </button>
                  {isUserBlocked ? (
                    <button
                      onClick={() => {
                        unblockUser();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-green-600"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Unblock User</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        blockUser();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Block User</span>
                    </button>
                  )}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 border-x border-gray-200">
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No messages yet</p>
            <p className="text-gray-400 text-sm">Start the conversation!</p>
          </div>
        ) : (
          Object.keys(groupedMessages).map(date => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex justify-center mb-4">
                <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {date}
                </span>
              </div>
              
              {/* Messages for this date */}
              {groupedMessages[date].map((message, index) => {
                const isOwn = message.sender._id === userId;
                const showAvatar = index === 0 || 
                  groupedMessages[date][index - 1].sender._id !== message.sender._id;
                const timestamp = message.createdAt || message.timestamp || message.created_at || new Date().toISOString();
                
                return (
                  <div
                    key={message._id || index}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md`}>
                      {!isOwn && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0">
                          {showAvatar && (
                            <div className="w-full h-full bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 text-xs font-semibold">
                                {message.sender.name?.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isOwn
                            ? 'bg-primary-500 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md border'
                        }`}
                      >
                        {message.messageType === 'image' ? (
                          <img 
                            src={message.content} 
                            alt="Shared image" 
                            className="max-w-xs rounded-lg cursor-pointer"
                            onClick={() => setLightboxImage(message.content)}
                          />
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <p className={`text-xs mt-1 ${
                          isOwn ? 'text-primary-100' : 'text-gray-500'
                        }`}>
                          {formatTime(timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

        {/* Message Input */}
        <div className="bg-white border border-gray-200 border-t-0 px-4 py-3 rounded-b-lg flex-shrink-0">
          {chat?.isBlocked ? (
            <div className="text-center py-3 text-gray-500">
              <UserX className="w-6 h-6 mx-auto mb-2 text-red-500" />
              <p className="text-sm">This conversation is blocked</p>
            </div>
          ) : (
            <form onSubmit={sendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => document.getElementById('image-upload').click()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <Image className="w-5 h-5" />
          </button>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={sending}
            />
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
          </form>
          )}
        </div>
      </div>
      </div>
      
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUser={otherParticipant?._id}
      />
      {lightboxImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setLightboxImage(null)}
        >
          <div className="max-w-5xl max-h-[90vh] w-full px-4">
            <img
              src={lightboxImage}
              alt="Chat"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
