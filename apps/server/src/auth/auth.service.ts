import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async guestLogin(username?: string, avatar?: string) {
    const guestName =
      username || `Pilot_${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`;
    const guestAvatar = avatar || 'commander_alpha';

    // Try to find existing player, or create new one
    let player = await this.prisma.player.findUnique({
      where: { username: guestName },
    });

    if (player) {
      // Returning player — update avatar if changed
      player = await this.prisma.player.update({
        where: { id: player.id },
        data: { avatar: guestAvatar },
      });
    } else {
      player = await this.prisma.player.create({
        data: {
          username: guestName,
          avatar: guestAvatar,
        },
      });
    }

    return {
      id: player.id,
      username: player.username,
      avatar: player.avatar,
      level: player.level,
      coins: player.coins,
      wins: player.wins,
      losses: player.losses,
      xp: player.xp,
      token: Buffer.from(player.id).toString('base64'),
    };
  }

  async validateToken(token: string) {
    try {
      const playerId = Buffer.from(token, 'base64').toString('utf-8');
      const player = await this.prisma.player.findUnique({
        where: { id: playerId },
      });
      return player;
    } catch {
      return null;
    }
  }
}
