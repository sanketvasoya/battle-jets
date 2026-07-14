import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 10;
    const players = await this.leaderboardService.getTopPlayers(take);
    return { success: true, players };
  }
}
