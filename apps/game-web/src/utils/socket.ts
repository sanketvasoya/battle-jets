import { io, Socket } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export const socket: Socket = io(SERVER_URL, {
  autoConnect: false,
  withCredentials: true,
});

export const HTTP_URL = SERVER_URL;
