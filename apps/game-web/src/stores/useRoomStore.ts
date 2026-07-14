import { create } from 'zustand';
import { socket } from '../utils/socket';
import { Room, SOCKET_EVENTS } from '@battle-jets/shared';

interface RoomState {
  roomsList: Room[];
  activeRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  countdown: number | null;
  isReady: boolean;

  fetchRooms: () => void;
  createRoom: (isPublic: boolean, mapId: string) => Promise<Room>;
  joinRoom: (code: string) => Promise<Room>;
  leaveRoom: () => void;
  toggleReady: () => void;
  initRoomListeners: () => void;
  removeRoomListeners: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  roomsList: [],
  activeRoom: null,
  isLoading: false,
  error: null,
  countdown: null,
  isReady: false,

  fetchRooms: () => {
    set({ isLoading: true });
    socket.emit(SOCKET_EVENTS.GET_ROOMS, {}, (res: { success: boolean; rooms: Room[]; error?: string }) => {
      if (res && res.success) {
        set({ roomsList: res.rooms, isLoading: false });
      } else {
        set({ isLoading: false, error: res?.error || 'Failed to fetch rooms' });
      }
    });
  },

  createRoom: async (isPublic, mapId) => {
    set({ isLoading: true, error: null });
    return new Promise((resolve, reject) => {
      socket.emit(
        SOCKET_EVENTS.CREATE_ROOM,
        { isPublic, mapId },
        (res: { success: boolean; room: Room; error?: string }) => {
          set({ isLoading: false });
          if (res && res.success) {
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

  joinRoom: async (code) => {
    set({ isLoading: true, error: null });
    return new Promise((resolve, reject) => {
      socket.emit(
        SOCKET_EVENTS.JOIN_ROOM,
        { code: code.toUpperCase() },
        (res: { success: boolean; room: Room; error?: string }) => {
          set({ isLoading: false });
          if (res && res.success) {
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

  leaveRoom: () => {
    const active = get().activeRoom;
    if (active) {
      socket.emit(SOCKET_EVENTS.LEAVE_ROOM, { code: active.code });
      set({ activeRoom: null, isReady: false, countdown: null });
    }
  },

  toggleReady: () => {
    const active = get().activeRoom;
    if (active) {
      const nextReadyState = !get().isReady;
      set({ isReady: nextReadyState });
      socket.emit(SOCKET_EVENTS.READY_UP, { code: active.code, ready: nextReadyState });
    }
  },

  initRoomListeners: () => {
    // Clean first
    get().removeRoomListeners();

    // Listen to Room updates from server
    socket.on(SOCKET_EVENTS.ROOM_UPDATE, (room: Room | null) => {
      set({ activeRoom: room });
      if (!room) {
        set({ isReady: false, countdown: null });
      }
    });

    // Listen to Countdown events
    socket.on(SOCKET_EVENTS.COUNTDOWN, (data: { seconds: number }) => {
      set({ countdown: data.seconds });
    });

    // Refresh rooms list when public lobby updates
    socket.on('rooms:refresh', (rooms: Room[]) => {
      set({ roomsList: rooms });
    });
  },

  removeRoomListeners: () => {
    socket.off(SOCKET_EVENTS.ROOM_UPDATE);
    socket.off(SOCKET_EVENTS.COUNTDOWN);
    socket.off('rooms:refresh');
  }
}));
