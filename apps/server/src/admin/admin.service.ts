import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlayerService } from '../player/player.service';
import { RoomService } from '../room/room.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playerService: PlayerService,
    private readonly roomService: RoomService,
  ) {}

  // Players
  async getPlayers(take: number = 50, skip: number = 0) {
    return this.playerService.findAll(take, skip);
  }

  // Active games
  getLiveRooms() {
    return this.roomService.getAllRooms();
  }

  // Weapons CRUD
  async getWeapons() {
    return this.prisma.weapon.findMany();
  }

  async createWeapon(data: {
    id: string;
    name: string;
    damage: number;
    fireRate: number;
    range: number;
    spread: number;
    pellets?: number;
    explosionRadius?: number;
    projectileSpeed?: number;
    image?: string;
    sound?: string;
  }) {
    const weapon = await this.prisma.weapon.create({ data });
    await this.trackVersion('weapon', weapon.id, weapon.name, weapon as any);
    return weapon;
  }

  async updateWeapon(
    id: string,
    data: {
      name?: string;
      damage?: number;
      fireRate?: number;
      range?: number;
      spread?: number;
      pellets?: number;
      explosionRadius?: number;
      projectileSpeed?: number;
      image?: string;
      sound?: string;
    },
  ) {
    const weapon = await this.prisma.weapon.update({
      where: { id },
      data,
    });
    await this.trackVersion('weapon', weapon.id, weapon.name, weapon as any);
    return weapon;
  }

  async deleteWeapon(id: string) {
    return this.prisma.weapon.delete({ where: { id } });
  }

  // Maps CRUD
  async getMaps() {
    return this.prisma.map.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createMap(data: { name: string; width?: number; height?: number; json: any; image?: string }) {
    return this.prisma.map.create({
      data: {
        name: data.name,
        width: data.width || 3000,
        height: data.height || 1600,
        json: data.json,
        image: data.image || '',
      },
    });
  }

  async updateMap(
    id: string,
    data: {
      name?: string;
      width?: number;
      height?: number;
      json?: any;
      image?: string;
      isActive?: boolean;
    },
  ) {
    return this.prisma.map.update({
      where: { id },
      data,
    });
  }

  async deleteMap(id: string) {
    return this.prisma.map.delete({ where: { id } });
  }

  // ============================================================
  // PHASE 2: CHARACTERS
  // ============================================================

  async getCharacters() {
    return this.prisma.character.findMany({
      include: { parts: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCharacter(id: string) {
    return this.prisma.character.findUnique({
      where: { id },
      include: { parts: true },
    });
  }

  async createCharacter(data: {
    name: string;
    description?: string;
    thumbnail?: string;
    baseHealth?: number;
    speed?: number;
    isPublished?: boolean;
    isActive?: boolean;
    parts?: {
      slot: string;
      name: string;
      assetPath?: string;
      offsetX?: number;
      offsetY?: number;
      scale?: number;
      rotation?: number;
      color?: string;
      zIndex?: number;
    }[];
  }) {
    const character = await this.prisma.character.create({
      data: {
        name: data.name,
        description: data.description || '',
        thumbnail: data.thumbnail || '',
        baseHealth: data.baseHealth ?? 100,
        speed: data.speed ?? 200,
        isPublished: data.isPublished ?? true,
        isActive: data.isActive ?? true,
        ...(data.parts && data.parts.length > 0
          ? {
              parts: {
                create: data.parts.map((part) => ({
                  slot: part.slot,
                  name: part.name,
                  assetPath: part.assetPath || '',
                  offsetX: part.offsetX ?? 0,
                  offsetY: part.offsetY ?? 0,
                  scale: part.scale ?? 1,
                  rotation: part.rotation ?? 0,
                  color: part.color || '#FFFFFF',
                  zIndex: part.zIndex ?? 0,
                })),
              },
            }
          : {}),
      },
      include: { parts: true },
    });
    await this.trackVersion('character', character.id, character.name, character as any);
    return character;
  }

  async updateCharacter(
    id: string,
    data: {
      name?: string;
      description?: string;
      thumbnail?: string;
      baseHealth?: number;
      speed?: number;
      isPublished?: boolean;
      isActive?: boolean;
    },
  ) {
    const character = await this.prisma.character.update({
      where: { id },
      data,
      include: { parts: true },
    });
    await this.trackVersion('character', character.id, character.name, character as any);
    return character;
  }

  async deleteCharacter(id: string) {
    return this.prisma.character.delete({ where: { id } });
  }

  // ============================================================
  // PHASE 2: CHARACTER PARTS
  // ============================================================

  async createCharacterPart(
    characterId: string,
    data: {
      slot: string;
      name: string;
      assetPath?: string;
      offsetX?: number;
      offsetY?: number;
      scale?: number;
      rotation?: number;
      color?: string;
      zIndex?: number;
    },
  ) {
    return this.prisma.characterPart.create({
      data: {
        characterId,
        slot: data.slot,
        name: data.name,
        assetPath: data.assetPath || '',
        offsetX: data.offsetX ?? 0,
        offsetY: data.offsetY ?? 0,
        scale: data.scale ?? 1,
        rotation: data.rotation ?? 0,
        color: data.color || '#FFFFFF',
        zIndex: data.zIndex ?? 0,
      },
    });
  }

  async updateCharacterPart(
    id: string,
    data: {
      slot?: string;
      name?: string;
      assetPath?: string;
      offsetX?: number;
      offsetY?: number;
      scale?: number;
      rotation?: number;
      color?: string;
      zIndex?: number;
    },
  ) {
    return this.prisma.characterPart.update({
      where: { id },
      data,
    });
  }

  async deleteCharacterPart(id: string) {
    return this.prisma.characterPart.delete({ where: { id } });
  }

  // ============================================================
  // PHASE 2: WEAPON SKINS
  // ============================================================

  async getWeaponSkins(weaponId?: string) {
    return this.prisma.weaponSkin.findMany({
      where: weaponId ? { weaponId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createWeaponSkin(data: {
    weaponId: string;
    name: string;
    assetPath?: string;
    rarity?: string;
    isDefault?: boolean;
    isPublished?: boolean;
  }) {
    return this.prisma.weaponSkin.create({
      data: {
        weaponId: data.weaponId,
        name: data.name,
        assetPath: data.assetPath || '',
        rarity: data.rarity || 'common',
        isDefault: data.isDefault ?? false,
        isPublished: data.isPublished ?? true,
      },
    });
  }

  async updateWeaponSkin(
    id: string,
    data: {
      name?: string;
      assetPath?: string;
      rarity?: string;
      isDefault?: boolean;
      isPublished?: boolean;
    },
  ) {
    return this.prisma.weaponSkin.update({
      where: { id },
      data,
    });
  }

  async deleteWeaponSkin(id: string) {
    return this.prisma.weaponSkin.delete({ where: { id } });
  }

  // ============================================================
  // PHASE 2: CROSSHAIRS
  // ============================================================

  async getCrosshairs() {
    return this.prisma.crosshair.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCrosshair(data: {
    name: string;
    style?: string;
    color?: string;
    size?: number;
    thickness?: number;
    gap?: number;
    dot?: boolean;
    assetPath?: string;
    isDefault?: boolean;
    isPublished?: boolean;
  }) {
    const crosshair = await this.prisma.crosshair.create({
      data: {
        name: data.name,
        style: data.style || 'cross',
        color: data.color || '#FFFFFF',
        size: data.size ?? 20,
        thickness: data.thickness ?? 2,
        gap: data.gap ?? 4,
        dot: data.dot ?? false,
        assetPath: data.assetPath || '',
        isDefault: data.isDefault ?? false,
        isPublished: data.isPublished ?? true,
      },
    });
    await this.trackVersion('crosshair', crosshair.id, crosshair.name, crosshair as any);
    return crosshair;
  }

  async updateCrosshair(
    id: string,
    data: {
      name?: string;
      style?: string;
      color?: string;
      size?: number;
      thickness?: number;
      gap?: number;
      dot?: boolean;
      assetPath?: string;
      isDefault?: boolean;
      isPublished?: boolean;
    },
  ) {
    const crosshair = await this.prisma.crosshair.update({
      where: { id },
      data,
    });
    await this.trackVersion('crosshair', crosshair.id, crosshair.name, crosshair as any);
    return crosshair;
  }

  async deleteCrosshair(id: string) {
    return this.prisma.crosshair.delete({ where: { id } });
  }

  // ============================================================
  // PHASE 2: JETPACKS
  // ============================================================

  async getJetpacks() {
    return this.prisma.jetpack.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createJetpack(data: {
    name: string;
    description?: string;
    fuel?: number;
    thrust?: number;
    rechargeRate?: number;
    burnRate?: number;
    assetPath?: string;
    particleColor?: string;
    trailLength?: number;
    isDefault?: boolean;
    isPublished?: boolean;
  }) {
    const jetpack = await this.prisma.jetpack.create({
      data: {
        name: data.name,
        description: data.description || '',
        fuel: data.fuel ?? 100,
        thrust: data.thrust ?? 300,
        rechargeRate: data.rechargeRate ?? 20,
        burnRate: data.burnRate ?? 30,
        assetPath: data.assetPath || '',
        particleColor: data.particleColor || '#FF6B00',
        trailLength: data.trailLength ?? 10,
        isDefault: data.isDefault ?? false,
        isPublished: data.isPublished ?? true,
      },
    });
    await this.trackVersion('jetpack', jetpack.id, jetpack.name, jetpack as any);
    return jetpack;
  }

  async updateJetpack(
    id: string,
    data: {
      name?: string;
      description?: string;
      fuel?: number;
      thrust?: number;
      rechargeRate?: number;
      burnRate?: number;
      assetPath?: string;
      particleColor?: string;
      trailLength?: number;
      isDefault?: boolean;
      isPublished?: boolean;
    },
  ) {
    const jetpack = await this.prisma.jetpack.update({
      where: { id },
      data,
    });
    await this.trackVersion('jetpack', jetpack.id, jetpack.name, jetpack as any);
    return jetpack;
  }

  async deleteJetpack(id: string) {
    return this.prisma.jetpack.delete({ where: { id } });
  }

  // ============================================================
  // PHASE 2: POWER-UPS
  // ============================================================

  async getPowerUps() {
    return this.prisma.powerUp.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPowerUp(data: {
    name: string;
    description?: string;
    type: string;
    duration?: number;
    magnitude?: number;
    effect?: string;
    assetPath?: string;
    color?: string;
    spawnWeight?: number;
    isPublished?: boolean;
    isActive?: boolean;
  }) {
    const powerUp = await this.prisma.powerUp.create({
      data: {
        name: data.name,
        description: data.description || '',
        type: data.type,
        duration: data.duration ?? 10,
        magnitude: data.magnitude ?? 1.5,
        effect: data.effect || '',
        assetPath: data.assetPath || '',
        color: data.color || '#22C55E',
        spawnWeight: data.spawnWeight ?? 1,
        isPublished: data.isPublished ?? true,
        isActive: data.isActive ?? true,
      },
    });
    await this.trackVersion('powerUp', powerUp.id, powerUp.name, powerUp as any);
    return powerUp;
  }

  async updatePowerUp(
    id: string,
    data: {
      name?: string;
      description?: string;
      type?: string;
      duration?: number;
      magnitude?: number;
      effect?: string;
      assetPath?: string;
      color?: string;
      spawnWeight?: number;
      isPublished?: boolean;
      isActive?: boolean;
    },
  ) {
    const powerUp = await this.prisma.powerUp.update({
      where: { id },
      data,
    });
    await this.trackVersion('powerUp', powerUp.id, powerUp.name, powerUp as any);
    return powerUp;
  }

  async deletePowerUp(id: string) {
    return this.prisma.powerUp.delete({ where: { id } });
  }

  // ============================================================
  // PHASE 2: GAME MODE CONFIGS
  // ============================================================

  async getGameModes() {
    return this.prisma.gameModeConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGameMode(data: {
    name: string;
    description?: string;
    timer?: number;
    maxPlayers?: number;
    minPlayers?: number;
    scoringType?: string;
    rules?: any;
    isPublished?: boolean;
    isActive?: boolean;
  }) {
    const gameMode = await this.prisma.gameModeConfig.create({
      data: {
        name: data.name,
        description: data.description || '',
        timer: data.timer ?? 600,
        maxPlayers: data.maxPlayers ?? 8,
        minPlayers: data.minPlayers ?? 2,
        scoringType: data.scoringType || 'kills',
        rules: data.rules ?? {},
        isPublished: data.isPublished ?? true,
        isActive: data.isActive ?? true,
      },
    });
    await this.trackVersion('gameModeConfig', gameMode.id, gameMode.name, gameMode as any);
    return gameMode;
  }

  async updateGameMode(
    id: string,
    data: {
      name?: string;
      description?: string;
      timer?: number;
      maxPlayers?: number;
      minPlayers?: number;
      scoringType?: string;
      rules?: any;
      isPublished?: boolean;
      isActive?: boolean;
    },
  ) {
    const gameMode = await this.prisma.gameModeConfig.update({
      where: { id },
      data,
    });
    await this.trackVersion('gameModeConfig', gameMode.id, gameMode.name, gameMode as any);
    return gameMode;
  }

  async deleteGameMode(id: string) {
    return this.prisma.gameModeConfig.delete({ where: { id } });
  }

  // ============================================================
  // PHASE 2: THEMES
  // ============================================================

  async getThemes() {
    return this.prisma.theme.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createTheme(data: {
    name: string;
    description?: string;
    colors: any;
    isDefault?: boolean;
    isPublished?: boolean;
  }) {
    const theme = await this.prisma.theme.create({
      data: {
        name: data.name,
        description: data.description || '',
        colors: data.colors,
        isDefault: data.isDefault ?? false,
        isPublished: data.isPublished ?? true,
      },
    });
    await this.trackVersion('theme', theme.id, theme.name, theme as any);
    return theme;
  }

  async updateTheme(
    id: string,
    data: {
      name?: string;
      description?: string;
      colors?: any;
      isDefault?: boolean;
      isPublished?: boolean;
    },
  ) {
    const theme = await this.prisma.theme.update({
      where: { id },
      data,
    });
    await this.trackVersion('theme', theme.id, theme.name, theme as any);
    return theme;
  }

  async deleteTheme(id: string) {
    return this.prisma.theme.delete({ where: { id } });
  }

  // ============================================================
  // PHASE 2: ASSETS
  // ============================================================

  async getAssets(type?: string) {
    return this.prisma.asset.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAsset(data: {
    name: string;
    type: string;
    path: string;
    mimeType?: string;
    size?: number;
    width?: number;
    height?: number;
    metadata?: any;
  }) {
    return this.prisma.asset.create({
      data: {
        name: data.name,
        type: data.type,
        path: data.path,
        mimeType: data.mimeType || '',
        size: data.size ?? 0,
        width: data.width ?? null,
        height: data.height ?? null,
        metadata: data.metadata ?? {},
      },
    });
  }

  async deleteAsset(id: string) {
    return this.prisma.asset.delete({ where: { id } });
  }

  // ============================================================
  // PHASE 2: SCRIPTS
  // ============================================================

  async getScripts() {
    return this.prisma.script.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getScript(id: string) {
    return this.prisma.script.findUnique({
      where: { id },
    });
  }

  async createScript(data: {
    name: string;
    type: string;
    language?: string;
    code?: string;
    isPublished?: boolean;
  }) {
    const script = await this.prisma.script.create({
      data: {
        name: data.name,
        type: data.type,
        language: data.language || 'javascript',
        code: data.code || '',
        isPublished: data.isPublished ?? true,
      },
    });
    await this.trackVersion('script', script.id, script.name, script as any);
    return script;
  }

  async updateScript(
    id: string,
    data: {
      name?: string;
      type?: string;
      language?: string;
      code?: string;
      version?: number;
      isPublished?: boolean;
    },
  ) {
    const script = await this.prisma.script.update({
      where: { id },
      data,
    });
    await this.trackVersion('script', script.id, script.name, script as any);
    return script;
  }

  async deleteScript(id: string) {
    return this.prisma.script.delete({ where: { id } });
  }

  // ============================================================
  // PHASE 2: CONTENT VERSIONS
  // ============================================================

  async getVersions(entityType?: string, skip: number = 0, take: number = 50) {
    return this.prisma.contentVersion.findMany({
      where: entityType ? { entityType } : undefined,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async getVersion(id: string) {
    return this.prisma.contentVersion.findUnique({
      where: { id },
    });
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
    const version = await this.prisma.contentVersion.findUnique({
      where: { id },
    });

    if (!version) {
      throw new Error('Version not found');
    }

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
    if (!model) {
      throw new Error(`Unknown entity type: ${version.entityType}`);
    }

    const versionData = version.data as Record<string, any>;
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = versionData;

    return model.update({
      where: { id: version.entityId },
      data: updateData,
    });
  }

  async getLatestVersion(entityType: string, entityId: string) {
    return this.prisma.contentVersion.findFirst({
      where: { entityType, entityId },
      orderBy: { version: 'desc' },
    });
  }

  // ============================================================
  // PHASE 2: GAME SETTINGS
  // ============================================================

  async getSettings() {
    return this.prisma.gameSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async updateSetting(key: string, value: any) {
    return this.prisma.gameSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  // ============================================================
  // PHASE 2: ADMIN LOGS
  // ============================================================

  async log(
    action: string,
    entityType: string,
    entityId: string,
    entityName: string = '',
    data?: any,
  ) {
    return this.prisma.adminLog.create({
      data: {
        action,
        entityType,
        entityId,
        entityName,
        data: data ?? {},
      },
    });
  }

  // ============================================================
  // VERSION TRACKING
  // ============================================================

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

  // ============================================================
  // LIVE TESTING
  // ============================================================

  async startTestSession(config: { mapId: string; mode: string; maxPlayers: number }) {
    const session = {
      id: `test_${Date.now()}`,
      mapId: config.mapId,
      mode: config.mode,
      maxPlayers: config.maxPlayers,
      status: 'pending',
      players: [],
      createdAt: new Date().toISOString(),
    };
    return session;
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

  // ============================================================
  // PUBLISHING
  // ============================================================

  async getPublishChanges() {
    const versions = await this.prisma.contentVersion.findMany({
      orderBy: [{ entityType: 'asc' }, { entityId: 'asc' }, { version: 'desc' }],
    });

    const latest = new Map<string, any>();
    for (const v of versions) {
      const key = `${v.entityType}:${v.entityId}`;
      if (!latest.has(key)) {
        latest.set(key, v);
      }
    }

    return Array.from(latest.values()).map(v => ({
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
    const versions = await this.prisma.contentVersion.findMany({
      where: { changelog: 'published' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return versions;
  }
}
