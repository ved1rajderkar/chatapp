import React, { useState, useRef, useEffect } from 'react';
import io from 'socket.io-client';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const SOCKET_URL = 'http://localhost:5000';

// Create a browser-compatible Peer class
const BrowserPeer = () => {
  const config = {
    initiator: false,
    trickle: false,
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    }
  };

  return new RTCPeerConnection(config);
};

export default function ScreenShare({ user }) {
  const [sharing, setSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [sharer, setSharer] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const socketRef = useRef();
  const peerRef = useRef();
  const localStreamRef = useRef();
  const videoRef = useRef();

  // Set up socket connection and signal handling
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    const handleSignal = async ({ from, data }) => {
      try {
        if (peerRef.current) {
          if (data.type === 'offer' || data.type === 'answer') {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(data));
          } else if (data.candidate) {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(data));
          }
        } else if (data.type === 'offer') {
          // Create peer as receiver
          const peer = BrowserPeer();
          peerRef.current = peer;
          
          peer.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit('signal', { 
                to: from, 
                from: socket.id, 
                data: event.candidate 
              });
            }
          };

          peer.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
            setSharer(from);
          };

          await peer.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          
          socket.emit('signal', {
            to: from,
            from: socket.id,
            data: answer
          });
        }
      } catch (error) {
        console.error('Error handling signal:', error);
        setSnackbar({
          open: true,
          message: 'Connection error: ' + (error.message || 'Unknown error'),
          severity: 'error'
        });
      }
    };

    socket.on('signal', handleSignal);

    // Listen for screen share upcoming event
    socket.on('screen_share_upcoming', ({ username }) => {
      if (username !== user?.username) {
        setSnackbar({ 
          open: true, 
          message: `${username} is about to share their screen...`, 
          severity: 'info' 
        });
        setTimeout(() => setSnackbar(s => ({ ...s, open: false })), 5000);
      }
    });

    return () => {
      socket.off('signal', handleSignal);
      socket.off('screen_share_upcoming');
      socket.disconnect();
      
      // Clean up peer connection
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      
      // Clean up local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // Clean up remote stream
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
        setRemoteStream(null);
      }
      
      setSharer(null);
      setSharing(false);
    };
  }, [remoteStream, user?.username]);

  // Set video srcObject when remoteStream changes
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const [shareType, setShareType] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const shareOptions = [
    { 
      id: 'screen', 
      label: 'Share Entire Screen',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
      </svg>
    },
    { 
      id: 'window', 
      label: 'Share Specific Window',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    },
    { 
      id: 'tab', 
      label: 'Share Browser Tab',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    },
    { 
      id: 'camera', 
      label: 'Share Webcam',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    }
  ];

  const startScreenShare = async (type) => {
    setShareModalOpen(false);
    // Notify others that screen sharing is about to start
    socketRef.current.emit('screen_share_upcoming', { username: user.username });
    try {
      let stream;
      
      if (type === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always'
          },
          audio: false
        });
      } else if (type === 'window') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'window'
          },
          audio: false
        });
      } else if (type === 'tab') {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'browser'
          },
          audio: false
        });
      } else if (type === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      setSharing(true);
      // Create peer as initiator
      const peer = BrowserPeer();
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('signal', { 
            to: 'all', 
            from: socketRef.current.id, 
            data: event.candidate 
          });
        }
      };

      peer.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
      };

      // Add stream to peer
      stream.getTracks().forEach(track => peer.addTrack(track, stream));

      // Create offer
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      // Broadcast offer to all
      socketRef.current.emit('signal', { 
        to: 'all', 
        from: socketRef.current.id, 
        data: offer 
      });

      peerRef.current = peer;
      
      // Store the local stream reference for cleanup
      localStreamRef.current = stream;
      
      // Clean up when sharing ends
      const onEnded = () => {
        setSharing(false);
        
        // Clean up peer connection
        if (peerRef.current) {
          peerRef.current.close();
          peerRef.current = null;
        }
        
        // Clean up local stream
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(track => track.stop());
          localStreamRef.current = null;
        }
        
        setRemoteStream(null);
        setSharer(null);
        setShareType(null);
      };
      
      // Add event listeners for when sharing is stopped via browser UI
      stream.getTracks().forEach(track => {
        track.onended = onEnded;
      });
      
      // Set up error handling
      stream.getTracks().forEach(track => {
        track.onmute = () => {
          setSnackbar({
            open: true,
            message: 'Screen sharing was muted',
            severity: 'warning'
          });
          onEnded();
        };
        
        track.onerror = (error) => {
          console.error('Screen sharing error:', error);
          setSnackbar({
            open: true,
            message: 'Screen sharing error: ' + (error.message || 'Unknown error'),
            severity: 'error'
          });
          onEnded();
        };
      });

      // Store the type of share for display
      setShareType(type);
    } catch (err) {
      // Only show error if it's not a permission denied error
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
        setSnackbar({
          open: true,
          message: 'Sharing failed: ' + err.message,
          severity: 'error'
        });
      }
      return false;
    }
    return true;
  };

  return (
    <div className="my-4 flex flex-col items-center space-y-4">
      {!sharing && !remoteStream && (
        <button
          onClick={() => setShareModalOpen(true)}
          className="px-6 py-3.5 bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-600/95 hover:to-blue-700/95 text-white rounded-xl shadow-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl active:scale-95 active:shadow-lg backdrop-blur-sm border border-blue-500/10"
        >
          <span className="flex items-center gap-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-lg">Share</span>
          </span>
        </button>
      )}

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 text-white/90 backdrop-blur-sm p-2 rounded-lg inline-block">
              What would you like to share?
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {shareOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => startScreenShare(option.id)}
                  className="p-6 rounded-2xl bg-white/5 hover:bg-white/15 transition-all duration-300 flex flex-col items-center gap-3 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    {option.icon}
                  </div>
                  <span className="text-sm font-medium text-white/90 group-hover:text-white/100 transition-colors">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {remoteStream && (
        <div className="w-full max-w-2xl mt-4 relative rounded-3xl overflow-hidden border border-blue-500/10 shadow-xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls={false}
            className="w-full h-auto object-cover"
            onLoadedMetadata={() => videoRef.current && videoRef.current.play()}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm">
            <div className="absolute bottom-0 left-0 right-0 px-6 py-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold">
                    {sharer ? 'Screen shared by another user' : 'Your Screen'}
                    {shareType && ` (${shareType === 'screen' ? 'Screen' : shareType === 'window' ? 'Window' : shareType === 'tab' ? 'Tab' : 'Camera'})`}
                  </span>
                </div>
                {sharer && (
                  <button
                    onClick={() => {
                      if (peerRef.current) {
                        peerRef.current.close();
                        peerRef.current = null;
                      }
                      setRemoteStream(null);
                      setSharer(null);
                    }}
                    className="px-6 py-2 bg-red-500/90 hover:bg-red-600/90 rounded-xl text-white transition-colors font-medium shadow-lg hover:shadow-xl active:scale-95"
                  >
                    End Sharing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {sharing && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-blue-500 font-medium text-lg">
              You are sharing your {shareType === 'screen' ? 'screen' : shareType === 'window' ? 'window' : shareType === 'tab' ? 'tab' : 'camera'}
            </span>
          </div>
          <button
            onClick={() => {
              if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
              }
              setSharing(false);
              setRemoteStream(null);
              setSharer(null);
              setShareType(null);
            }}
            className="px-6 py-2.5 bg-red-500/90 hover:bg-red-600/90 rounded-xl text-white transition-colors font-medium shadow-lg hover:shadow-xl active:scale-95"
          >
            End Sharing
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="my-4 flex flex-col items-center space-y-4">
      {!sharing && !remoteStream && (
        <button
          onClick={startScreenShare}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg font-semibold transition-all duration-300 transform hover:scale-105"
        >
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Share Your Screen
          </span>
        </button>
      )}
      {remoteStream && (
        <div className="w-full max-w-2xl mt-4 relative rounded-2xl overflow-hidden border border-blue-500/20">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            controls={false}
            className="w-full h-auto"
            onLoadedMetadata={() => videoRef.current && videoRef.current.play()}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-lg font-semibold">{sharer ? 'Screen shared by another user' : 'Your Screen'}</span>
              </div>
              {sharer && (
                <button
                  onClick={() => {
                    if (peerRef.current) {
                      peerRef.current.close();
                      peerRef.current = null;
                    }
                    setRemoteStream(null);
                    setSharer(null);
                  }}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
                >
                  Stop Sharing
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {sharing && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-500 font-medium">You are sharing your screen</span>
          </div>
          <button
            onClick={() => {
              if (peerRef.current) {
                peerRef.current.close();
                peerRef.current = null;
              }
              setSharing(false);
              setRemoteStream(null);
              setSharer(null);
            }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
          >
            Stop Sharing
          </button>
        </div>
      )}
      {/* Snackbar for upcoming screen share */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{
          width: '100%',
          background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
        }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
} 