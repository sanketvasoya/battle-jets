import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { RoomModule } from '../room/room.module';
import { PlayerModule } from '../player/player.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PlayerModule,
    forwardRef(() => RoomModule),
  ],
  providers: [GameService, GameGateway],
  exports: [GameService],
})
export class GameModule {}
