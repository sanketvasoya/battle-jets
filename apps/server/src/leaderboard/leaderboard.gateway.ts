import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { LeaderboardService } from './leaderboard.service';
import { SOCKET_EVENTS } from '@battle-jets/shared';
import { corsConfig } from '../cors.config';

@WebSocketGateway({ cors: corsConfig })
export class LeaderboardGateway {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @SubscribeMessage(SOCKET_EVENTS.GET_LEADERBOARD)
  async handleGetLeaderboard(client: Socket, payload: { limit?: number }) {
    const limit = payload?.limit || 10;
    const players = await this.leaderboardService.getTopPlayers(limit);
    return { success: true, players };
  }
}
