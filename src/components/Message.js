import React, { useState } from 'react';
import { Card, CardContent, Avatar, Typography, IconButton, Tooltip, Box, Stack, Button, Chip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

const REACTION_EMOJIS = ['👍', '😂', '❤️'];

export default function Message({ message, user }) {
  // Reactions: track which emojis this user has reacted to
  const [reactions, setReactions] = useState({}); // { emoji: true/false }

  const isCurrentUser = user && message.user && user.username === message.user.username;

  if (message.type === 'system') {
    return (
      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Chip label={message.content} color="info" variant="outlined" size="small" />
      </Box>
    );
  }

  const handleReaction = (emoji) => {
    setReactions((prev) => ({
      ...prev,
      [emoji]: !prev[emoji], // toggle
    }));
  };

  // Download image handler
  const handleImageDownload = () => {
    const link = document.createElement('a');
    link.href = message.fileData;
    link.download = message.fileName || 'image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box display="flex" flexDirection={isCurrentUser ? 'row-reverse' : 'row'} alignItems="flex-start" gap={2} my={2} maxWidth="100%" sx={{ mx: 'auto', width: '100%', maxWidth: 600 }}>
      <Avatar
        src={message.user?.avatar || undefined}
        alt={message.user?.username || 'User'}
        sx={{ width: 40, height: 40, boxShadow: 2, border: 2 }}
      >
        {!message.user?.avatar && (message.user?.username?.[0]?.toUpperCase() || 'U')}
      </Avatar>
      <Card
        elevation={4}
        sx={{
          borderRadius: 4,
          minWidth: 0,
          maxWidth: 420,
          flex: 1,
          boxShadow: isCurrentUser ? 6 : 2,
          ml: isCurrentUser ? 0 : 1,
          mr: isCurrentUser ? 1 : 0,
          position: 'relative',
        }}
      >
        <CardContent sx={{ pb: '12px !important' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5} justifyContent={isCurrentUser ? 'flex-end' : 'flex-start'}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {message.user?.username || 'User'}
            </Typography>
            <Typography variant="caption">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          </Stack>
          {/* Message content */}
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
          {message.type === 'file' && message.fileData ? (
            <Button
              href={message.fileData}
              download={message.fileName}
              variant="text"
              size="small"
              startIcon={<DownloadIcon />}
              sx={{ fontWeight: 600 }}
              target="_blank" rel="noopener noreferrer"
            >
              {message.fileName || 'Download file'}
            </Button>
          ) : null}
          {/* Show text content if present */}
          {message.content && <Typography variant="body1" sx={{ wordBreak: 'break-word', mt: 1 }}>{message.content}</Typography>}
          {/* Emoji reactions */}
          <Stack direction="row" spacing={1} mt={1} justifyContent={isCurrentUser ? 'flex-end' : 'flex-start'}>
            {REACTION_EMOJIS.map((emoji) => (
              <Tooltip key={emoji} title={reactions[emoji] ? 'Remove reaction' : 'React'}>
                <IconButton
                  size="small"
                  onClick={() => handleReaction(emoji)}
                  sx={{
                    borderRadius: 2,
                    boxShadow: reactions[emoji] ? 2 : 0,
                  }}
                >
                  <Typography variant="body1" fontWeight={700}>{emoji}</Typography>
                  {reactions[emoji] && <Typography variant="caption" fontWeight={700} ml={0.5}>1</Typography>}
                </IconButton>
              </Tooltip>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
} 