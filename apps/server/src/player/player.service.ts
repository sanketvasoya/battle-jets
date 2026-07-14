import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.player.findUnique({ where: { id } });
  }

  async findByUsername(username: string) {
    return this.prisma.player.findUnique({ where: { username } });
  }

  async create(data: { username: string; avatar?: string }) {
    return this.prisma.player.create({
      data: {
        username: data.username,
        avatar: data.avatar || 'commander_alpha',
      },
    });
  }

  async updateStats(
    id: string,
    stats: { wins?: number; losses?: number; xp?: number; coins?: number },
  ) {
    return this.prisma.player.update({
      where: { id },
      data: stats,
    });
  }

  async incrementWins(id: string) {
    return this.prisma.player.update({
      where: { id },
      data: { wins: { increment: 1 }, xp: { increment: 50 } },
    });
  }

  async incrementLosses(id: string) {
    return this.prisma.player.update({
      where: { id },
      data: { losses: { increment: 1 }, xp: { increment: 10 } },
    });
  }

  async getTopPlayers(take: number = 10) {
    return this.prisma.player.findMany({
      orderBy: { wins: 'desc' },
      take,
      select: {
        id: true,
        username: true,
        avatar: true,
        level: true,
        wins: true,
        losses: true,
        xp: true,
      },
    });
  }

  async findAll(take: number = 50, skip: number = 0) {
    return this.prisma.player.findMany({
      take,
      skip,
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string) {
    return this.prisma.player.delete({ where: { id } });
  }
}
