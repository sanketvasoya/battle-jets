import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PlayerModule } from './player/player.module';
import { RoomModule } from './room/room.module';
import { GameModule } from './game/game.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuthModule,
    PlayerModule,
    RoomModule,
    GameModule,
    LeaderboardModule,
    AdminModule,
  ],
})
export class AppModule {}
