import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { tenant } = useAuth();

  useEffect(() => {
    if (!tenant) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
    
    // Connect to server passing tenantId in handshake query to lock to tenant room
    const newSocket = io(socketUrl, {
      query: { tenantId: tenant.id },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Real-time Socket.io successfully connected to Tenant:', tenant.name);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Real-time Socket.io disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [tenant]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
