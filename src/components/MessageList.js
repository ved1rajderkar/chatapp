import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import Message from './Message';
import confetti from 'canvas-confetti';

const CELEBRATION_WORDS = [
  'congrats',
  'party',
  '🎉',
];

const MessageList = ({ messages = [], currentUser, onReact, onReply, loading = false }) => {
  const lastMessageId = useRef(null);
  const messagesEndRef = useRef(null);
  const messageListRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if messages should be grouped
  const shouldGroupWithPrevious = (currentMsg, previousMsg) => {
    if (!previousMsg) return false;
    
    const timeDiff = new Date(currentMsg.timestamp) - new Date(previousMsg.timestamp);
    const isSameUser = currentMsg.userId === previousMsg.userId;
    const isWithinTimeThreshold = timeDiff < 5 * 60 * 1000; // 5 minutes
    
    return isSameUser && isWithinTimeThreshold;
  };

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (!messageListRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 100;
    
    setIsScrolled(scrollTop > 0);
    setShowScrollButton(!isAtBottom && scrollHeight > clientHeight);
  }, []);

  // Scroll to bottom smoothly
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setShowScrollButton(false);
    }
  }, []);

  // Celebration effect for special messages
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.id === lastMessageId.current) return;
    lastMessageId.current = lastMsg.id;
    
    if (lastMsg.content && CELEBRATION_WORDS.some(word => lastMsg.content.toLowerCase().includes(word))) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 },
      });
    }
  }, [messages]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom('auto');
  }, [scrollToBottom]);

  // Auto-scroll for new messages if near bottom
  useEffect(() => {
    if (!messageListRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 200;
    
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Add scroll listener
  useEffect(() => {
    const list = messageListRef.current;
    if (list) {
      list.addEventListener('scroll', handleScroll);
      return () => list.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Group messages by date
  const groupMessagesByDate = (msgs) => {
    if (!msgs.length) return {};
    
    return msgs.reduce((groups, msg) => {
      const date = format(new Date(msg.timestamp), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
      return groups;
    }, {});
  };

  const groupedMessages = groupMessagesByDate(messages);

  // Format date for display
  const formatDateHeader = (dateStr) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
    
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return format(new Date(dateStr), 'EEEE, MMMM d, yyyy');
  };

  return (
    <div 
      ref={messageListRef}
      className="flex-1 overflow-y-auto relative"
    >
      <div className="p-4 space-y-1">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="mb-6">
            {/* Date header */}
            <div className="flex items-center justify-center my-4">
              <div className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                {formatDateHeader(date)}
              </div>
            </div>
            
            {/* Messages for this date */}
            <div className="space-y-1">
              {dateMessages.map((message, index) => {
                const isOwnMessage = message.userId === currentUser?.id;
                const previousMessage = dateMessages[index - 1];
                const showAvatar = !shouldGroupWithPrevious(message, previousMessage);
                const showUsername = showAvatar && !isOwnMessage;
                const isFirstInGroup = showAvatar;
                const isLastInGroup = index === dateMessages.length - 1 || 
                  !shouldGroupWithPrevious(dateMessages[index + 1], message);

                return (
                  <div 
                    key={message.id || index}
                    className={`transition-all duration-200 ${
                      isFirstInGroup ? 'mt-2' : ''
                    } ${isLastInGroup ? 'mb-2' : ''}`}
                  >
                    <Message
                      message={message}
                      isOwnMessage={isOwnMessage}
                      showAvatar={showAvatar}
                      showUsername={showUsername}
                      onReact={onReact}
                      onReply={onReply}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-pulse flex space-x-2 items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full delay-75"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full delay-150"></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 right-6 z-10"
          >
            <button
              onClick={() => scrollToBottom()}
              className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              aria-label="Scroll to bottom"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(MessageList);