import { io, Socket } from 'socket.io-client';
import type { GameProtocol, ServerToClientEvents, ClientToServerEvents } from '@battle-jets/networking';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export class SocketIOAdapter implements GameProtocol {
  private socket: Socket;

  constructor() {
    this.socket = io(SERVER_URL, {
      autoConnect: false,
      withCredentials: true,
    });
  }

  on<K extends keyof ServerToClientEvents>(event: K, handler: ServerToClientEvents[K]) {
    this.socket.on(event, handler as any);
  }

  off<K extends keyof ServerToClientEvents>(event: K, handler?: ServerToClientEvents[K]) {
    if (handler) {
      this.socket.off(event, handler as any);
    } else {
      this.socket.off(event);
    }
  }

  emit<K extends keyof ClientToServerEvents>(event: K, ...args: Parameters<ClientToServerEvents[K]>) {
    (this.socket.emit as any)(event, ...args);
  }

  connect() {
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }

  get id() {
    return this.socket.id;
  }

  get connected() {
    return this.socket.connected;
  }
}

let defaultAdapter: SocketIOAdapter | null = null;

export function getDefaultProtocol(): GameProtocol {
  if (!defaultAdapter) {
    defaultAdapter = new SocketIOAdapter();
  }
  return defaultAdapter;
}

export const HTTP_URL = SERVER_URL;
