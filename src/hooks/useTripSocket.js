import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'https://api-mashena.wasta-jobs.com';
const SOCKET_URL = API_URL.endsWith('/trip-share') ? API_URL : `${API_URL.replace(/\/$/, '')}/trip-share`;

export function useTripSocket(token) {
  const [isConnected, setIsConnected] = useState(false);
  const [tripData, setTripData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    console.log('[TripSocket] Attempting connection to:', SOCKET_URL, 'with token:', token);
    console.log('[TripSocket] Connection version: v2 (with auth token and namespace)');

    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      auth: {
        token: token // Sending token in handshake auth
      }
    });

    socket.on('connect', () => {
      console.log('[TripSocket] Connected successfully with ID:', socket.id);
      setIsConnected(true);
      setError(null);
      // Join the trip tracking room
      socket.emit('trip-share:join', { token });
    });

    socket.on('connect_error', (err) => {
      console.error('[TripSocket] Connection Error:', err.message);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('trip-share:snapshot', (data) => {
      setTripData(data);
      if (data.driverLocation) {
        setDriverLocation(data.driverLocation);
      }
      if (data.status) {
        setStatus(data.status);
      }
    });

    socket.on('trip-share:driver-location', (data) => {
      setDriverLocation(prev => ({
        ...prev,
        lat: data.lat,
        lng: data.lng,
        recordedAt: data.recordedAt
      }));
    });

    socket.on('trip-share:status-changed', (data) => {
      setStatus(data.status);
    });

    socket.on('trip-share:revoked', () => {
      setError('تم إبطال رابط المشاركة لهذه الرحلة.');
    });

    socket.on('trip-share:ended', (data) => {
      setStatus(data.status || 'completed');
    });

    socket.on('trip-share:error', (err) => {
      setError(err.message || 'حدث خطأ غير متوقع');
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  return {
    isConnected,
    tripData,
    driverLocation,
    status,
    error
  };
}
