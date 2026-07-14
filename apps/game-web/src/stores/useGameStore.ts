import { create } from 'zustand';
import { socket } from '../utils/socket';
import { GameState, KillFeedEntry, SOCKET_EVENTS, WeaponType } from '@battle-jets/shared';

interface MatchResults {
  winnerId: string | null;
  winnerName: string;
  results: {
    playerId: string;
    username: string;
    kills: number;
    deaths: number;
  }[];
}

interface GameStoreState {
  gameState: GameState | null;
  isPlaying: boolean;
  matchResults: MatchResults | null;
  killFeed: KillFeedEntry[];
  localDeaths: number;

  initGameListeners: () => void;
  removeGameListeners: () => void;
  sendInput: (input: any) => void;
  sendWeaponSwitch: (weapon: WeaponType) => void;
  sendThrowGrenade: (angle: number) => void;
  resetGameStore: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: null,
  isPlaying: false,
  matchResults: null,
  killFeed: [],
  localDeaths: 0,

  initGameListeners: () => {
    get().removeGameListeners();

    socket.on(SOCKET_EVENTS.MATCH_STATE, (state: any) => {
      // Re-hydrate Map from Object sent over the network
      const playersMap = new Map<string, any>();
      Object.keys(state.players).forEach((playerId) => {
        playersMap.set(playerId, state.players[playerId]);
      });

      const hydratedState: GameState = {
        ...state,
        players: playersMap,
      };

      set({ gameState: hydratedState, isPlaying: true });
    });

    socket.on(SOCKET_EVENTS.MATCH_END, (data: MatchResults) => {
      set({ matchResults: data, isPlaying: false });
    });

    socket.on(SOCKET_EVENTS.KILL_FEED, (kill: any) => {
      set((state) => {
        const nextFeed = [...state.killFeed, kill];
        if (nextFeed.length > 5) nextFeed.shift();
        return { killFeed: nextFeed };
      });
    });

    socket.on(SOCKET_EVENTS.PLAYER_DIED, (data: { playerId: string }) => {
      if (data.playerId === socket.id || data.playerId === localStorage.getItem('bj_player_id')) {
        set((state) => ({ localDeaths: state.localDeaths + 1 }));
      }
    });
  },

  removeGameListeners: () => {
    socket.off(SOCKET_EVENTS.MATCH_STATE);
    socket.off(SOCKET_EVENTS.MATCH_END);
    socket.off(SOCKET_EVENTS.KILL_FEED);
    socket.off(SOCKET_EVENTS.PLAYER_DIED);
  },

  sendInput: (input: any) => {
    socket.emit(SOCKET_EVENTS.PLAYER_INPUT, input);
  },

  sendWeaponSwitch: (weapon: WeaponType) => {
    socket.emit(SOCKET_EVENTS.SWITCH_WEAPON, weapon);
  },

  sendThrowGrenade: (angle: number) => {
    socket.emit(SOCKET_EVENTS.THROW_GRENADE, { angle });
  },

  resetGameStore: () => {
    set({
      gameState: null,
      isPlaying: false,
      matchResults: null,
      killFeed: [],
      localDeaths: 0,
    });
  }
}));
