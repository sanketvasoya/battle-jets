import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PlayerModule } from '../player/player.module';
import { RoomModule } from '../room/room.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AssetUploadModule } from './asset-upload.module';

@Module({
  imports: [PrismaModule, PlayerModule, RoomModule, AssetUploadModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
