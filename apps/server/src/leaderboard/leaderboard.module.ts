import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardGateway } from './leaderboard.gateway';
import { PlayerModule } from '../player/player.module';

@Module({
  imports: [PlayerModule],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, LeaderboardGateway],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
