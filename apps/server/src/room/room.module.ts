import { Module, forwardRef } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { GameModule } from '../game/game.module';

@Module({
  imports: [PrismaModule, forwardRef(() => GameModule)],
  providers: [RoomService, RoomGateway],
  exports: [RoomService],
})
export class RoomModule {}
