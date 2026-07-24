import { io } from "socket.io-client";
import { getAccessToken } from "../auth/token";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket?.connected) return this.socket;

    const token = getAccessToken();

    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      auth: {
        token: token ? `Bearer ${token}` : "",
      },
    });

    // Setup global connection debug listeners
    this.socket.on("connect", () => {
      this.socket.onAny((event, ...args) => {
        console.log("SOCKET EVENT:", event, args);
      });
      console.log("=========================");
      console.log("[SocketService] ✅ Connected");
      console.log("Socket ID:", this.socket.id);
      console.log("Auth Token:", getAccessToken());
      console.log("=========================");
      console.log(
        `[SocketService] Connected to ${SOCKET_URL} with ID: ${this.socket.id}`,
      );
      this.triggerStatusChange(true);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn(`[SocketService] Disconnected. Reason: ${reason}`);
      this.triggerStatusChange(false);
    });

    this.socket.on("connect_error", (err) => {
      console.error("[SocketService] Connection Error:", err.message);
      this.triggerStatusChange(false);
    });

    this.socket.connect();
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("[SocketService] Explicitly disconnected.");
      this.triggerStatusChange(false);
    }
  }

  // General event listener with clean wrapper
  on(event, callback) {
    if (!this.socket) {
      this.connect();
    }
    this.socket.on(event, callback);

    if (!this.eventCallbacks) {
      this.eventCallbacks = new Map();
    }
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set());
    }
    this.eventCallbacks.get(event).add(callback);
  }

  // Remove listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    if (this.eventCallbacks && this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).delete(callback);
    }
  }

  // Emit event safely
  emit(event, data) {
    if (!this.socket) {
      this.connect();
    }
    this.socket.emit(event, data);
  }

  // Dynamic connection listeners
  onStatusChange(callback) {
    const id = Math.random().toString(36).substring(2, 9);
    this.listeners.set(id, callback);
    // Emit immediate current status
    callback(this.socket?.connected || false);

    return () => {
      this.listeners.delete(id);
    };
  }

  triggerStatusChange(status) {
    this.listeners.forEach((callback) => callback(status));
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
