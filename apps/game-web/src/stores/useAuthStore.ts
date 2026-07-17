import { create } from 'zustand';
import type { GameProtocol, AuthSuccessData } from '@battle-jets/networking';
import { SOCKET_EVENTS } from '@battle-jets/shared';
import { getDefaultProtocol } from '../utils/socket';

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
  guestLogin: (username: string, avatar: string, protocol?: GameProtocol) => Promise<PilotProfile>;
  logout: (protocol?: GameProtocol) => void;
  loadCachedSession: (protocol?: GameProtocol) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  player: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  guestLogin: async (username, avatar, protocol?) => {
    const p = protocol || getDefaultProtocol();
    set({ isLoading: true, error: null });
    return new Promise((resolve, reject) => {
      if (!p.connected) {
        p.connect();
      }

      const onAuthSuccess = (response: AuthSuccessData) => {
        p.off(SOCKET_EVENTS.AUTH_SUCCESS, onAuthSuccess);
        p.off(SOCKET_EVENTS.ERROR, onAuthError);

        if (response.success) {
          const player = response.player as PilotProfile;
          localStorage.setItem('bj_token', player.token || '');
          localStorage.setItem('bj_player', JSON.stringify(player));

          set({
            player,
            isAuthenticated: true,
            isLoading: false,
          });
          resolve(player);
        } else {
          set({ isLoading: false, error: response.message || 'Login failed' });
          reject(new Error(response.message || 'Login failed'));
        }
      };

      const onAuthError = (err: { message: string }) => {
        p.off(SOCKET_EVENTS.AUTH_SUCCESS, onAuthSuccess);
        p.off(SOCKET_EVENTS.ERROR, onAuthError);
        set({ isLoading: false, error: err.message || 'Connection error' });
        reject(new Error(err.message || 'Connection error'));
      };

      p.on(SOCKET_EVENTS.AUTH_SUCCESS, onAuthSuccess);
      p.on(SOCKET_EVENTS.ERROR, onAuthError);

      p.emit(SOCKET_EVENTS.GUEST_LOGIN, { username, avatar });
    });
  },

  logout: (protocol?: GameProtocol) => {
    const p = protocol || getDefaultProtocol();
    localStorage.removeItem('bj_token');
    localStorage.removeItem('bj_player');
    if (p.connected) {
      p.disconnect();
    }
    set({ player: null, isAuthenticated: false });
  },

  loadCachedSession: (protocol?: GameProtocol) => {
    const p = protocol || getDefaultProtocol();
    const cachedPlayer = localStorage.getItem('bj_player');
    const cachedToken = localStorage.getItem('bj_token');

    if (cachedPlayer && cachedToken) {
      try {
        const player = JSON.parse(cachedPlayer);
        set({ player, isAuthenticated: true });

        if (!p.connected) {
          p.connect();
        }

        p.emit(SOCKET_EVENTS.GUEST_LOGIN, {
          username: player.username,
          avatar: player.avatar,
        });
      } catch (e) {
        localStorage.removeItem('bj_player');
        localStorage.removeItem('bj_token');
      }
    }
  },
}));
