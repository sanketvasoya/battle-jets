import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlayerService } from '../player/player.service';
import { RoomService } from '../room/room.service';
import { createCrud, CrudOps } from './crud';

@Injectable()
export class AdminService {
  public weapons: ReturnType<typeof createCrud>;
  public maps: ReturnType<typeof createCrud>;
  public characters: ReturnType<typeof createCrud>;
  public characterParts: ReturnType<typeof createCrud>;
  public weaponSkins: ReturnType<typeof createCrud>;
  public crosshairs: ReturnType<typeof createCrud>;
  public jetpacks: ReturnType<typeof createCrud>;
  public powerUps: ReturnType<typeof createCrud>;
  public gameModes: ReturnType<typeof createCrud>;
  public themes: ReturnType<typeof createCrud>;
  public assets: ReturnType<typeof createCrud>;
  public scripts: ReturnType<typeof createCrud>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly playerService: PlayerService,
    private readonly roomService: RoomService,
  ) {
    const ops: CrudOps = { prisma: this.prisma, trackVersion: this.trackVersion.bind(this) };

    this.weapons = createCrud({ model: this.prisma.weapon, entityType: 'weapon', trackVersion: true }, ops);
    this.maps = createCrud({ model: this.prisma.map, entityType: 'map' }, ops);
    this.characters = createCrud({ model: this.prisma.character, entityType: 'character', trackVersion: true, include: { parts: true }, orderBy: { createdAt: 'desc' } }, ops);
    this.characterParts = createCrud({ model: this.prisma.characterPart, entityType: 'characterPart' }, ops);
    this.weaponSkins = createCrud({ model: this.prisma.weaponSkin, entityType: 'weaponSkin', orderBy: { createdAt: 'desc' } }, ops);
    this.crosshairs = createCrud({ model: this.prisma.crosshair, entityType: 'crosshair', trackVersion: true, orderBy: { createdAt: 'desc' } }, ops);
    this.jetpacks = createCrud({ model: this.prisma.jetpack, entityType: 'jetpack', trackVersion: true, orderBy: { createdAt: 'desc' } }, ops);
    this.powerUps = createCrud({ model: this.prisma.powerUp, entityType: 'powerUp', trackVersion: true, orderBy: { createdAt: 'desc' } }, ops);
    this.gameModes = createCrud({ model: this.prisma.gameModeConfig, entityType: 'gameModeConfig', trackVersion: true, orderBy: { createdAt: 'desc' } }, ops);
    this.themes = createCrud({ model: this.prisma.theme, entityType: 'theme', trackVersion: true, orderBy: { createdAt: 'desc' } }, ops);
    this.assets = createCrud({ model: this.prisma.asset, entityType: 'asset', orderBy: { createdAt: 'desc' } }, ops);
    this.scripts = createCrud({ model: this.prisma.script, entityType: 'script', trackVersion: true, orderBy: { createdAt: 'desc' } }, ops);
  }

  // Players (delegated to PlayerService)
  async getPlayers(take: number = 50, skip: number = 0) {
    return this.playerService.findAll(take, skip);
  }

  // Active games (delegated to RoomService)
  getLiveRooms() {
    return this.roomService.getAllRooms();
  }

  // ---- Version tracking ----

  async trackVersion(entityType: string, entityId: string, entityName: string, data: Record<string, unknown>) {
    const latest = await this.prisma.contentVersion.findFirst({
      where: { entityType, entityId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latest?.version || 0) + 1;
    return this.prisma.contentVersion.create({
      data: {
        entityType,
        entityId,
        entityName,
        version: nextVersion,
        data: data as any,
      },
    });
  }

  // ---- Content Versions ----

  async getVersions(entityType?: string, skip: number = 0, take: number = 50) {
    return this.prisma.contentVersion.findMany({
      where: entityType ? { entityType } : undefined,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async getVersion(id: string) {
    return this.prisma.contentVersion.findUnique({ where: { id } });
  }

  async createVersion(data: {
    entityType: string;
    entityId: string;
    entityName?: string;
    version?: number;
    data: any;
    changelog?: string;
  }) {
    return this.prisma.contentVersion.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName || '',
        version: data.version ?? 1,
        data: data.data,
        changelog: data.changelog || '',
      },
    });
  }

  async restoreVersion(id: string) {
    const version = await this.prisma.contentVersion.findUnique({ where: { id } });
    if (!version) throw new Error('Version not found');

    const modelMap: Record<string, any> = {
      character: this.prisma.character,
      weapon: this.prisma.weapon,
      crosshair: this.prisma.crosshair,
      jetpack: this.prisma.jetpack,
      powerUp: this.prisma.powerUp,
      gameModeConfig: this.prisma.gameModeConfig,
      theme: this.prisma.theme,
      script: this.prisma.script,
    };

    const model = modelMap[version.entityType];
    if (!model) throw new Error(`Unknown entity type: ${version.entityType}`);

    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = version.data as Record<string, any>;
    return model.update({ where: { id: version.entityId }, data: updateData });
  }

  async getLatestVersion(entityType: string, entityId: string) {
    return this.prisma.contentVersion.findFirst({
      where: { entityType, entityId },
      orderBy: { version: 'desc' },
    });
  }

  // ---- Game Settings ----

  async getSettings() {
    return this.prisma.gameSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async updateSetting(key: string, value: any) {
    return this.prisma.gameSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // ---- Admin Logs ----

  async log(action: string, entityType: string, entityId: string, entityName: string = '', data?: any) {
    return this.prisma.adminLog.create({
      data: { action, entityType, entityId, entityName, data: data ?? {} },
    });
  }

  // ---- Live Testing ----

  async startTestSession(config: { mapId: string; mode: string; maxPlayers: number }) {
    return {
      id: `test_${Date.now()}`,
      ...config,
      status: 'pending',
      players: [],
      createdAt: new Date().toISOString(),
    };
  }

  async getTestSessions() {
    return [];
  }

  async getTestResults() {
    return [];
  }

  async stopTestSession(id: string) {
    return { id, status: 'stopped' };
  }

  // ---- Publishing ----

  async getPublishChanges() {
    const versions = await this.prisma.contentVersion.findMany({
      orderBy: [{ entityType: 'asc' }, { entityId: 'asc' }, { version: 'desc' }],
    });

    const latest = new Map<string, any>();
    for (const v of versions) {
      const key = `${v.entityType}:${v.entityId}`;
      if (!latest.has(key)) latest.set(key, v);
    }

    return Array.from(latest.values()).map((v) => ({
      entityType: v.entityType,
      entityId: v.entityId,
      entityName: v.entityName,
      status: 'modified',
      lastPublished: null,
    }));
  }

  async publishEntity(entityType: string, entityId: string) {
    return this.trackVersion(entityType, entityId, 'published', { publishedAt: new Date().toISOString() });
  }

  async publishAll() {
    const changes = await this.getPublishChanges();
    for (const change of changes) {
      await this.publishEntity(change.entityType, change.entityId);
    }
    return { published: changes.length };
  }

  async getPublishHistory() {
    return this.prisma.contentVersion.findMany({
      where: { changelog: 'published' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
