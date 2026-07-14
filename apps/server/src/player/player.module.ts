import { Module } from '@nestjs/common';
import { PlayerService } from './player.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PlayerService],
  exports: [PlayerService],
})
export class PlayerModule {}
