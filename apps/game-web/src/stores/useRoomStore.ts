import { create } from 'zustand';
import type { GameProtocol } from '@battle-jets/networking';
import { Room, SOCKET_EVENTS } from '@battle-jets/shared';
import { getDefaultProtocol } from '../utils/socket';

interface RoomState {
  roomsList: Room[];
  activeRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  countdown: number | null;
  isReady: boolean;

  fetchRooms: (protocol?: GameProtocol) => void;
  createRoom: (isPublic: boolean, mapId: string, protocol?: GameProtocol) => Promise<Room>;
  joinRoom: (code: string, protocol?: GameProtocol) => Promise<Room>;
  leaveRoom: (protocol?: GameProtocol) => void;
  toggleReady: (protocol?: GameProtocol) => void;
  initRoomListeners: (protocol?: GameProtocol) => void;
  removeRoomListeners: (protocol?: GameProtocol) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  roomsList: [],
  activeRoom: null,
  isLoading: false,
  error: null,
  countdown: null,
  isReady: false,

  fetchRooms: (protocol?: GameProtocol) => {
    const p = protocol || getDefaultProtocol();
    set({ isLoading: true });
    p.emit(SOCKET_EVENTS.GET_ROOMS, {}, (res: { success: boolean; rooms: Room[]; error?: string }) => {
      if (res && res.success) {
        set({ roomsList: res.rooms, isLoading: false });
      } else {
        set({ isLoading: false, error: res?.error || 'Failed to fetch rooms' });
      }
    });
  },

  createRoom: async (isPublic, mapId, protocol?) => {
    const p = protocol || getDefaultProtocol();
    set({ isLoading: true, error: null });
    return new Promise((resolve, reject) => {
      p.emit(
        SOCKET_EVENTS.CREATE_ROOM,
        { isPublic, mapId },
        (res: { success: boolean; room?: Room; error?: string }) => {
          set({ isLoading: false });
          if (res && res.success && res.room) {
            set({ activeRoom: res.room, isReady: false, countdown: null });
            resolve(res.room);
          } else {
            set({ error: res?.error || 'Failed to create room' });
            reject(new Error(res?.error || 'Failed to create room'));
          }
        }
      );
    });
  },

  joinRoom: async (code, protocol?) => {
    const p = protocol || getDefaultProtocol();
    set({ isLoading: true, error: null });
    return new Promise((resolve, reject) => {
      p.emit(
        SOCKET_EVENTS.JOIN_ROOM,
        { code: code.toUpperCase() },
        (res: { success: boolean; room?: Room; error?: string }) => {
          set({ isLoading: false });
          if (res && res.success && res.room) {
            set({ activeRoom: res.room, isReady: false, countdown: null });
            resolve(res.room);
          } else {
            set({ error: res?.error || 'Room not found or full' });
            reject(new Error(res?.error || 'Room not found or full'));
          }
        }
      );
    });
  },

  leaveRoom: (protocol?: GameProtocol) => {
    const p = protocol || getDefaultProtocol();
    const active = get().activeRoom;
    if (active) {
      p.emit(SOCKET_EVENTS.LEAVE_ROOM, { code: active.code });
      set({ activeRoom: null, isReady: false, countdown: null });
    }
  },

  toggleReady: (protocol?: GameProtocol) => {
    const p = protocol || getDefaultProtocol();
    const active = get().activeRoom;
    if (active) {
      const nextReadyState = !get().isReady;
      set({ isReady: nextReadyState });
      p.emit(SOCKET_EVENTS.READY_UP, { code: active.code, ready: nextReadyState });
    }
  },

  initRoomListeners: (protocol?: GameProtocol) => {
    const p = protocol || getDefaultProtocol();
    get().removeRoomListeners(protocol);

    p.on(SOCKET_EVENTS.ROOM_UPDATE, (room: Room | null) => {
      set({ activeRoom: room });
      if (!room) {
        set({ isReady: false, countdown: null });
      }
    });

    p.on(SOCKET_EVENTS.COUNTDOWN, (data: { seconds: number }) => {
      set({ countdown: data.seconds });
    });

    p.on('rooms:refresh', (rooms: Room[]) => {
      set({ roomsList: rooms });
    });
  },

  removeRoomListeners: (protocol?: GameProtocol) => {
    const p = protocol || getDefaultProtocol();
    p.off(SOCKET_EVENTS.ROOM_UPDATE);
    p.off(SOCKET_EVENTS.COUNTDOWN);
    p.off('rooms:refresh');
  },
}));
