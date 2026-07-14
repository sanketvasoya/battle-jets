import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { RoomService } from '../room/room.service';
import { SOCKET_EVENTS } from '@battle-jets/shared';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly roomService: RoomService,
  ) {}

  handleConnection(client: Socket) {}

  handleDisconnect(client: Socket) {}

  @SubscribeMessage(SOCKET_EVENTS.PLAYER_INPUT)
  handlePlayerInput(client: Socket, payload: any) {
    const playerId = client.data.playerId;
    if (!playerId) return;

    // Find the player's active room
    const room = this.roomService.getRoomByPlayerId(playerId);
    if (room && room.status === 'playing') {
      this.gameService.handlePlayerInput(room.code, playerId, payload);
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.SWITCH_WEAPON)
  handleSwitchWeapon(client: Socket, payload: any) {
    const playerId = client.data.playerId;
    if (!playerId) return;

    const room = this.roomService.getRoomByPlayerId(playerId);
    if (room && room.status === 'playing') {
      this.gameService.handlePlayerAction(room.code, playerId, 'weapon', payload);
    }
  }

  @SubscribeMessage(SOCKET_EVENTS.THROW_GRENADE)
  handleThrowGrenade(client: Socket, payload: any) {
    const playerId = client.data.playerId;
    if (!playerId) return;

    const room = this.roomService.getRoomByPlayerId(playerId);
    if (room && room.status === 'playing') {
      this.gameService.handlePlayerAction(room.code, playerId, 'grenade', payload);
    }
  }
}
