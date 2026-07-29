import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://api-mashena.wasta-jobs.com/trip-share';

export function useTripSocket(token) {
  const [isConnected, setIsConnected] = useState(false);
  const [tripData, setTripData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      // Join the trip tracking room
      socket.emit('trip-share:join', { token });
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
