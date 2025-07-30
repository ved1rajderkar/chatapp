import React from 'react';
import { AppBar, Toolbar, Typography, Avatar, IconButton, Stack, Tooltip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

export default function Header({ onLogout, darkMode, onToggleDarkMode, user }) {
  return (
    <AppBar position="static" elevation={8} sx={{
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      mb: 2,
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
    }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            src={user?.avatar || undefined}
            alt={user?.username || 'User'}
            sx={{ width: 48, height: 48, fontWeight: 700, border: 2, boxShadow: 2 }}
          >
            {!user?.avatar && (user?.username?.[0]?.toUpperCase() || 'U')}
          </Avatar>
          <Typography variant="h4" fontWeight={900} letterSpacing={2}>
            BubblyTalk
          </Typography>
        </Stack>
        <Tooltip title="Logout">
          <IconButton onClick={onLogout} color="error" sx={{}}>
            <LogoutIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
} 