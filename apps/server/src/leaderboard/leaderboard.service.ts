import { Injectable } from '@nestjs/common';
import { PlayerService } from '../player/player.service';

@Injectable()
export class LeaderboardService {
  constructor(private readonly playerService: PlayerService) {}

  async getTopPlayers(limit: number = 10) {
    return this.playerService.getTopPlayers(limit);
  }
}
