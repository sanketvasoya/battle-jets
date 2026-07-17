import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from './auth.service';
import { SOCKET_EVENTS } from '@battle-jets/shared';
import { corsConfig } from '../cors.config';

@WebSocketGateway({ cors: corsConfig })
export class AuthGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly authService: AuthService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(SOCKET_EVENTS.GUEST_LOGIN)
  async handleGuestLogin(
    client: Socket,
    payload: { username?: string; avatar?: string },
  ) {
    try {
      const player = await this.authService.guestLogin(
        payload?.username,
        payload?.avatar,
      );

      client.data.playerId = player.id;
      client.data.username = player.username;

      client.emit(SOCKET_EVENTS.AUTH_SUCCESS, {
        success: true,
        player,
      });

      return { success: true, player };
    } catch (error) {
      client.emit(SOCKET_EVENTS.ERROR, {
        success: false,
        message: 'Login failed',
      });
      return { success: false, message: 'Login failed' };
    }
  }
}
