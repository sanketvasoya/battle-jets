import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';
import { SOCKET_EVENTS, GAME_CONSTANTS } from '@battle-jets/shared';
import { Inject, forwardRef } from '@nestjs/common';
import { GameService } from '../game/game.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private countdownTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly roomService: RoomService,
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
  ) {}

  handleConnection(client: Socket) {
    // Handled by AuthGateway or connection logger
  }

  handleDisconnect(client: Socket) {
    const playerId = client.data.playerId;
    if (playerId) {
      const room = this.roomService.getRoomByPlayerId(playerId);
      if (room) {
        this.handleLeaveRoom(client, { code: room.code });
      }
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.CREATE_ROOM)
  handleCreateRoom(
    client: Socket,
    payload: { isPublic?: boolean; mapId?: string },
  ) {
    const playerId = client.data.playerId;
    const username = client.data.username;
    if (!playerId || !username) {
      return { success: false, error: 'Unauthorized' };
    }

    const isPublic = payload.isPublic !== false;
    const mapId = payload.mapId || 'sky_base'; // default map ID

    const room = this.roomService.createRoom(
      playerId,
      username,
      client.data.avatar || 'commander_alpha',
      isPublic,
      mapId,
    );

    client.join(room.code);
    this.server.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATE, room);

    return { success: true, room };
  }

  @SubscribeMessage(SOCKET_EVENTS.JOIN_ROOM)
  handleJoinRoom(client: Socket, payload: { code: string }) {
    const playerId = client.data.playerId;
    const username = client.data.username;
    if (!playerId || !username) {
      return { success: false, error: 'Unauthorized' };
    }

    const { room, error } = this.roomService.joinRoom(
      payload.code,
      playerId,
      username,
      client.data.avatar || 'commander_alpha',
    );

    if (error) {
      return { success: false, error };
    }

    client.join(room.code);
    this.server.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATE, room);

    return { success: true, room };
  }

  @SubscribeMessage(SOCKET_EVENTS.LEAVE_ROOM)
  handleLeaveRoom(client: Socket, payload: { code: string }) {
    const playerId = client.data.playerId;
    if (!playerId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Cancel countdown if active
    this.cancelCountdown(payload.code);

    const updatedRoom = this.roomService.leaveRoom(payload.code, playerId);
    client.leave(payload.code);

    if (updatedRoom) {
      this.server.to(payload.code).emit(SOCKET_EVENTS.ROOM_UPDATE, updatedRoom);
    } else {
      // Room was destroyed (last player left)
      this.server.to(payload.code).emit(SOCKET_EVENTS.ROOM_UPDATE, null);
    }

    return { success: true };
  }

  @SubscribeMessage(SOCKET_EVENTS.READY_UP)
  handleReadyUp(client: Socket, payload: { code: string; ready: boolean }) {
    const playerId = client.data.playerId;
    if (!playerId) {
      return { success: false, error: 'Unauthorized' };
    }

    const room = this.roomService.setReady(payload.code, playerId, payload.ready);
    if (!room) {
      return { success: false, error: 'Room not found' };
    }

    this.server.to(room.code).emit(SOCKET_EVENTS.ROOM_UPDATE, room);

    // Check if everyone is ready to start countdown
    if (this.roomService.areAllReady(room.code)) {
      this.startCountdown(room.code);
    } else {
      this.cancelCountdown(room.code);
    }

    return { success: true, room };
  }

  @SubscribeMessage(SOCKET_EVENTS.GET_ROOMS)
  handleGetRooms() {
    const rooms = this.roomService.getPublicRooms();
    return { success: true, rooms };
  }

  private startCountdown(roomCode: string) {
    if (this.countdownTimers.has(roomCode)) return;

    let timeRemaining = GAME_CONSTANTS.COUNTDOWN_TIME;
    this.roomService.setRoomStatus(roomCode, 'countdown');

    // Notify clients of status change
    const room = this.roomService.getRoom(roomCode);
    if (room) {
      this.server.to(roomCode).emit(SOCKET_EVENTS.ROOM_UPDATE, room);
    }

    this.server.to(roomCode).emit(SOCKET_EVENTS.COUNTDOWN, { seconds: timeRemaining });

    const timer = setInterval(async () => {
      timeRemaining--;
      if (timeRemaining > 0) {
        this.server.to(roomCode).emit(SOCKET_EVENTS.COUNTDOWN, { seconds: timeRemaining });
      } else {
        clearInterval(timer);
        this.countdownTimers.delete(roomCode);
        
        // Start match authoritatively!
        this.roomService.setRoomStatus(roomCode, 'playing');
        const finalRoom = this.roomService.getRoom(roomCode);
        if (finalRoom) {
          this.server.to(roomCode).emit(SOCKET_EVENTS.ROOM_UPDATE, finalRoom);
          this.server.to(roomCode).emit(SOCKET_EVENTS.MATCH_START);
          
          // Let GameService handle real-time simulation
          await this.gameService.startMatch(finalRoom, this.server);
        }
      }
    }, 1000);

    this.countdownTimers.set(roomCode, timer);
  }

  private cancelCountdown(roomCode: string) {
    const timer = this.countdownTimers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      this.countdownTimers.delete(roomCode);

      const room = this.roomService.getRoom(roomCode);
      if (room && room.status === 'countdown') {
        this.roomService.setRoomStatus(roomCode, 'waiting');
        this.server.to(roomCode).emit(SOCKET_EVENTS.ROOM_UPDATE, room);
      }
    }
  }
}
