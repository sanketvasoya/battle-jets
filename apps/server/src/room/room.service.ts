import { Injectable } from '@nestjs/common';
import {
  Room,
  RoomPlayer,
  RoomCode,
  PlayerId,
  GAME_CONSTANTS,
} from '@battle-jets/shared';
import { generateRoomCode } from '@battle-jets/shared';

@Injectable()
export class RoomService {
  private rooms = new Map<RoomCode, Room>();

  createRoom(
    hostId: PlayerId,
    hostUsername: string,
    hostAvatar: string,
    isPublic: boolean = true,
    mapId: string = 'default',
  ): Room {
    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const room: Room = {
      code,
      hostId,
      players: [
        {
          id: hostId,
          username: hostUsername,
          avatar: hostAvatar,
          ready: false,
        },
      ],
      maxPlayers: GAME_CONSTANTS.MAX_PLAYERS,
      status: 'waiting',
      mapId,
      mode: 'deathmatch',
      isPublic,
    };

    this.rooms.set(code, room);
    return room;
  }

  joinRoom(
    code: RoomCode,
    playerId: PlayerId,
    username: string,
    avatar: string,
  ): { room: Room; error?: string } {
    const room = this.rooms.get(code);

    if (!room) {
      return { room: null as any, error: 'Room not found' };
    }

    if (room.status !== 'waiting') {
      return { room, error: 'Game already in progress' };
    }

    if (room.players.length >= room.maxPlayers) {
      return { room, error: 'Room is full' };
    }

    const existing = room.players.find((p) => p.id === playerId);
    if (existing) {
      return { room };
    }

    room.players.push({
      id: playerId,
      username,
      avatar,
      ready: false,
    });

    return { room };
  }

  leaveRoom(code: RoomCode, playerId: PlayerId): Room | null {
    const room = this.rooms.get(code);
    if (!room) return null;

    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.players.length === 0) {
      this.rooms.delete(code);
      return null;
    }

    if (room.hostId === playerId) {
      room.hostId = room.players[0].id;
    }

    return room;
  }

  getPublicRooms(): Room[] {
    const publicRooms: Room[] = [];
    this.rooms.forEach((room) => {
      if (room.isPublic && room.status === 'waiting') {
        publicRooms.push(room);
      }
    });
    return publicRooms;
  }

  getRoom(code: RoomCode): Room | undefined {
    return this.rooms.get(code);
  }

  setReady(
    code: RoomCode,
    playerId: PlayerId,
    ready: boolean,
  ): Room | null {
    const room = this.rooms.get(code);
    if (!room) return null;

    const player = room.players.find((p) => p.id === playerId);
    if (player) {
      player.ready = ready;
    }

    return room;
  }

  areAllReady(code: RoomCode): boolean {
    const room = this.rooms.get(code);
    if (!room) return false;
    return (
      room.players.length >= GAME_CONSTANTS.MIN_PLAYERS &&
      room.players.every((p) => p.ready)
    );
  }

  setRoomStatus(code: RoomCode, status: Room['status']): void {
    const room = this.rooms.get(code);
    if (room) {
      room.status = status;
    }
  }

  getRoomByPlayerId(playerId: PlayerId): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.some((p) => p.id === playerId)) {
        return room;
      }
    }
    return undefined;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}
