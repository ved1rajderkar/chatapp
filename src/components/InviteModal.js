import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, TextField, Button, IconButton, Alert, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function InviteModal({ open, onClose, onInvite }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await onInvite(email);
      setMessage('Invite sent!');
      setEmail('');
    } catch (err) {
      setMessage('Failed to send invite.');
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 2, boxShadow: 8, position: 'relative' } }}>
      <IconButton onClick={onClose} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }} aria-label="Close">
        <CloseIcon fontSize="large" />
      </IconButton>
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 800, fontSize: 28, letterSpacing: 1, mb: 1 }}>
        Invite by Email
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography variant="body2" textAlign="center">
            Send a chat invite to your friend’s email!
          </Typography>
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Stack spacing={2}>
              <TextField
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email address"
                required
                fullWidth
                label="Email Address"
                variant="outlined"
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || !email}
                sx={{ fontWeight: 700, letterSpacing: 1, py: 1.2, borderRadius: 2, boxShadow: 2, textTransform: 'none', fontSize: 16 }}
              >
                {loading ? 'Sending...' : 'Send Invite'}
              </Button>
            </Stack>
          </form>
          {message && <Alert severity={message === 'Invite sent!' ? 'success' : 'error'} sx={{ mt: 1 }}>{message}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button onClick={onClose} variant="text" sx={{ fontWeight: 600 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
} 