import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { 
  Avatar, 
  Tooltip, 
  IconButton, 
  Button,
  Box
} from '@mui/material';
import { 
  Check, 
  CheckCircle, 
  Favorite, 
  FavoriteBorder, 
  Reply, 
  MoreVert,
  Download as DownloadIcon
} from '@mui/icons-material';

const REACTION_EMOJIS = ['👍', '😂', '❤️'];

export default function Message({ 
  message, 
  isOwnMessage = false, 
  showAvatar = true, 
  showUsername = true,
  onReply = () => {},
  onReact = () => {}
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  
  const reactions = ['❤️', '👍', '😊', '🎉', '👏', '🔥'];
  
  useEffect(() => {
    // Reset hover states when message changes
    return () => {
      setIsHovered(false);
      setShowReactionMenu(false);
      setShowOptions(false);
    };
  }, [message]);

  const bubbleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 24 } }
  };

  const handleImageDownload = () => {
    const link = document.createElement('a');
    link.href = message.fileData;
    link.download = message.fileName || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: isOwnMessage ? 50 : -50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        if (!showReactionMenu && !showOptions) {
          setIsHovered(false);
        }
      }}
    >
      {!isOwnMessage && showAvatar && (
        <motion.div 
          className="flex-shrink-0 mr-3"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Tooltip title={message.sender?.username || 'Unknown User'} placement="top">
            <Avatar 
              src={message.sender?.avatar} 
              alt={message.sender?.username}
              className="w-10 h-10 border-2 border-white dark:border-gray-700 shadow-lg"
            />
          </Tooltip>
        </motion.div>
      )}
      
      <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && showUsername && (
          <motion.span 
            className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1 px-2 py-1 rounded-full bg-white/30 dark:bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {message.sender?.username || 'Unknown User'}
          </motion.span>
        )}
        
        <div className="relative">
          <motion.div 
            className={`relative px-4 py-3 rounded-2xl max-w-xs lg:max-w-md xl:max-w-lg 2xl:max-w-xl break-words transition-all duration-300 ${
              isOwnMessage 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none shadow-lg' 
                : 'bg-white/70 dark:bg-gray-700/70 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-lg backdrop-blur-sm border border-white/20'
            }`}
            whileHover={{ 
              scale: 1.02,
              boxShadow: isOwnMessage 
                ? '0 10px 25px -5px rgba(59, 130, 246, 0.4)' 
                : '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            whileTap={{ scale: 0.98 }}
          >
            {message.content}
            
            {message.type === 'image' && message.fileData ? (
              <Box display="flex" flexDirection="column" alignItems="flex-start" gap={1} mt={1}>
                <Box component="img" src={message.fileData} alt={message.fileName || 'image'} sx={{ maxWidth: '100%', maxHeight: 240, borderRadius: 2, boxShadow: 2, mb: 1 }} />
                <Button
                  onClick={handleImageDownload}
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadIcon />}
                  sx={{ fontWeight: 600 }}
                >
                  Download
                </Button>
              </Box>
            ) : null}
            
            <div className="flex items-center justify-end mt-1 space-x-1 min-h-[16px]">
              <AnimatePresence>
                {isHovered && (
                  <motion.div 
                    className="flex items-center space-x-1 mr-2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                  >
                    <IconButton 
                      size="small" 
                      className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                      onClick={() => {
                        setIsLiked(!isLiked);
                        onReact(message.id, isLiked ? null : '❤️');
                      }}
                    >
                      {isLiked || message.reaction ? (
                        <Favorite className="text-red-500" fontSize="small" />
                      ) : (
                        <FavoriteBorder fontSize="small" />
                      )}
                    </IconButton>
                    <IconButton 
                      size="small" 
                      className="text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                      onClick={() => onReply(message)}
                    >
                      <Reply fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowOptions(!showOptions);
                      }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <span className={`text-xs opacity-70 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
              </span>
              
              {isOwnMessage && (
                <span className={`ml-1 ${message.status === 'read' ? 'text-blue-300' : 'text-blue-100'}`}>
                  {message.status === 'sent' ? (
                    <Check fontSize="inherit" />
                  ) : message.status === 'delivered' ? (
                    <CheckCircle fontSize="inherit" />
                  ) : (
                    <CheckCircle fontSize="inherit" color="primary" />
                  )}
                </span>
              )}
            </div>
            
            {message.reaction && (
              <motion.div 
                className="absolute -bottom-2 right-2 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.2 }}
              >
                <span className="text-sm">{message.reaction}</span>
              </motion.div>
            )}
          </motion.div>
          
          {/* Message options menu */}
          <AnimatePresence>
            {showOptions && (
              <motion.div 
                className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden z-10 border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => {
                    // Handle copy message
                    navigator.clipboard.writeText(message.content);
                    setShowOptions(false);
                  }}
                >
                  Copy message
                </button>
                <button 
                  className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                  onClick={() => {
                    // Handle delete message
                    console.log('Delete message:', message.id);
                    setShowOptions(false);
                  }}
                >
                  Delete message
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {isOwnMessage && showAvatar && (
        <motion.div 
          className="flex-shrink-0 ml-3"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Tooltip title="You" placement="top">
            <Avatar 
              src={message.sender?.avatar} 
              alt={message.sender?.username}
              className="w-10 h-10 border-2 border-white dark:border-gray-700 shadow-lg"
            />
          </Tooltip>
        </motion.div>
      )}
    </motion.div>
  );
}