import { create } from 'zustand';
import type { GameProtocol, MatchResults } from '@battle-jets/networking';
import { SOCKET_EVENTS, GameState, KillFeedEntry, WeaponType } from '@battle-jets/shared';
import { getDefaultProtocol } from '../utils/socket';

interface GameStoreState {
  gameState: GameState | null;
  isPlaying: boolean;
  matchResults: MatchResults | null;
  killFeed: KillFeedEntry[];
  localDeaths: number;

  initGameListeners: (protocol?: GameProtocol) => void;
  removeGameListeners: (protocol?: GameProtocol) => void;
  sendInput: (input: any, protocol?: GameProtocol) => void;
  sendWeaponSwitch: (weapon: WeaponType, protocol?: GameProtocol) => void;
  sendThrowGrenade: (angle: number, protocol?: GameProtocol) => void;
  resetGameStore: () => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  gameState: null,
  isPlaying: false,
  matchResults: null,
  killFeed: [],
  localDeaths: 0,

  initGameListeners: (protocol?: GameProtocol) => {
    get().removeGameListeners(protocol);
    const p = protocol || getDefaultProtocol();

    p.on(SOCKET_EVENTS.MATCH_STATE, (state: any) => {
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

    p.on(SOCKET_EVENTS.MATCH_END, (data: MatchResults) => {
      set({ matchResults: data, isPlaying: false });
    });

    p.on(SOCKET_EVENTS.KILL_FEED, (kill: any) => {
      set((state) => {
        const nextFeed = [...state.killFeed, kill];
        if (nextFeed.length > 5) nextFeed.shift();
        return { killFeed: nextFeed };
      });
    });

    p.on(SOCKET_EVENTS.PLAYER_DIED, (data: { playerId: string }) => {
      if (data.playerId === p.id || data.playerId === localStorage.getItem('bj_player_id')) {
        set((state) => ({ localDeaths: state.localDeaths + 1 }));
      }
    });
  },

  removeGameListeners: (protocol?: GameProtocol) => {
    const p = protocol || getDefaultProtocol();
    p.off(SOCKET_EVENTS.MATCH_STATE);
    p.off(SOCKET_EVENTS.MATCH_END);
    p.off(SOCKET_EVENTS.KILL_FEED);
    p.off(SOCKET_EVENTS.PLAYER_DIED);
  },

  sendInput: (input: any, protocol?: GameProtocol) => {
    const p = protocol || getDefaultProtocol();
    p.emit(SOCKET_EVENTS.PLAYER_INPUT, input);
  },

  sendWeaponSwitch: (weapon: WeaponType, protocol?: GameProtocol) => {
    const p = protocol || getDefaultProtocol();
    p.emit(SOCKET_EVENTS.SWITCH_WEAPON, weapon);
  },

  sendThrowGrenade: (angle: number, protocol?: GameProtocol) => {
    const p = protocol || getDefaultProtocol();
    p.emit(SOCKET_EVENTS.THROW_GRENADE, { angle });
  },

  resetGameStore: () => {
    set({
      gameState: null,
      isPlaying: false,
      matchResults: null,
      killFeed: [],
      localDeaths: 0,
    });
  },
}));
