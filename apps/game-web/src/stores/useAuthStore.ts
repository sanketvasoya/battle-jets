import { create } from 'zustand';
import { socket } from '../utils/socket';
import { SOCKET_EVENTS } from '@battle-jets/shared';

interface PilotProfile {
  id: string;
  username: string;
  avatar: string;
  level: number;
  coins: number;
  wins: number;
  losses: number;
  xp: number;
  token?: string;
}

interface AuthState {
  player: PilotProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  guestLogin: (username: string, avatar: string) => Promise<PilotProfile>;
  logout: () => void;
  loadCachedSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  player: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  guestLogin: async (username, avatar) => {
    set({ isLoading: true, error: null });
    return new Promise((resolve, reject) => {
      // Ensure socket is connected
      if (!socket.connected) {
        socket.connect();
      }

      const onAuthSuccess = (response: { success: boolean; player: PilotProfile; message?: string }) => {
        socket.off(SOCKET_EVENTS.AUTH_SUCCESS, onAuthSuccess);
        socket.off(SOCKET_EVENTS.ERROR, onAuthError);
        
        if (response.success) {
          localStorage.setItem('bj_token', response.player.token || '');
          localStorage.setItem('bj_player', JSON.stringify(response.player));
          
          set({
            player: response.player,
            isAuthenticated: true,
            isLoading: false,
          });
          resolve(response.player);
        } else {
          set({ isLoading: false, error: response.message || 'Login failed' });
          reject(new Error(response.message || 'Login failed'));
        }
      };

      const onAuthError = (err: any) => {
        socket.off(SOCKET_EVENTS.AUTH_SUCCESS, onAuthSuccess);
        socket.off(SOCKET_EVENTS.ERROR, onAuthError);
        set({ isLoading: false, error: err.message || 'Connection error' });
        reject(new Error(err.message || 'Connection error'));
      };

      socket.on(SOCKET_EVENTS.AUTH_SUCCESS, onAuthSuccess);
      socket.on(SOCKET_EVENTS.ERROR, onAuthError);

      socket.emit(SOCKET_EVENTS.GUEST_LOGIN, { username, avatar });
    });
  },

  logout: () => {
    localStorage.removeItem('bj_token');
    localStorage.removeItem('bj_player');
    if (socket.connected) {
      socket.disconnect();
    }
    set({ player: null, isAuthenticated: false });
  },

  loadCachedSession: () => {
    const cachedPlayer = localStorage.getItem('bj_player');
    const cachedToken = localStorage.getItem('bj_token');
    
    if (cachedPlayer && cachedToken) {
      try {
        const player = JSON.parse(cachedPlayer);
        set({ player, isAuthenticated: true });
        
        // Connect socket and perform re-auth
        if (!socket.connected) {
          socket.connect();
        }
        
        socket.emit(SOCKET_EVENTS.GUEST_LOGIN, { 
          username: player.username, 
          avatar: player.avatar 
        });
      } catch (e) {
        localStorage.removeItem('bj_player');
        localStorage.removeItem('bj_token');
      }
    }
  }
}));
