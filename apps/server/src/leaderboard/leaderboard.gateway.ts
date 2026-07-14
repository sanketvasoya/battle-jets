import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { LeaderboardService } from './leaderboard.service';
import { SOCKET_EVENTS } from '@battle-jets/shared';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class LeaderboardGateway {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @SubscribeMessage(SOCKET_EVENTS.GET_LEADERBOARD)
  async handleGetLeaderboard(client: Socket, payload: { limit?: number }) {
    const limit = payload?.limit || 10;
    const players = await this.leaderboardService.getTopPlayers(limit);
    return { success: true, players };
  }
}
