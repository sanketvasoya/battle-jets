import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { GameSimulation } from '@battle-jets/game-engine';
import { Room, RoomCode, MapData, SOCKET_EVENTS, WeaponType, PlayerInput, GAME_CONSTANTS } from '@battle-jets/shared';
import { Server } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { PlayerService } from '../player/player.service';
import { RoomService } from '../room/room.service';

@Injectable()
export class GameService {
  private activeSimulations = new Map<RoomCode, GameSimulation>();
  private matchIntervals = new Map<RoomCode, NodeJS.Timeout>();
  private clientInputQueues = new Map<RoomCode, Map<string, any[]>>(); // roomCode -> playerId -> inputQueue

  constructor(
    private readonly prisma: PrismaService,
    private readonly playerService: PlayerService,
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,
  ) {}

  async loadContent() {
    const [weapons, maps, characters, crosshairs, jetpacks, powerups, gameModes, themes] = await Promise.all([
      this.prisma.weapon.findMany({ where: { isPublished: true } }),
      this.prisma.map.findMany({ where: { isActive: true } }),
      this.prisma.character.findMany({ where: { isPublished: true, isActive: true }, include: { parts: true } }),
      this.prisma.crosshair.findMany({ where: { isPublished: true } }),
      this.prisma.jetpack.findMany({ where: { isPublished: true } }),
      this.prisma.powerUp.findMany({ where: { isPublished: true, isActive: true } }),
      this.prisma.gameModeConfig.findMany({ where: { isPublished: true, isActive: true } }),
      this.prisma.theme.findMany({ where: { isPublished: true } }),
    ]);

    return { weapons, maps, characters, crosshairs, jetpacks, powerups, gameModes, themes };
  }

  public async startMatch(room: Room, io: Server) {
    // 1. Fetch map data from database
    let mapData: MapData | null = null;
    try {
      const mapRecord = await this.prisma.map.findFirst({
        where: { OR: [{ id: room.mapId }, { name: room.mapId }] },
      });

      if (mapRecord) {
        mapData = mapRecord.json as unknown as MapData;
        mapData.id = mapRecord.id;
        mapData.name = mapRecord.name;
      }
    } catch (e) {
      console.error('Failed to load map from DB, using fallback map', e);
    }

    if (!mapData) {
      // Fallback Sky Base map data
      mapData = this.getFallbackMapData();
    }

    // 2. Create Match record in database
    let matchRecord: any = null;
    try {
      // Find room in database if recorded, else create matching record
      let dbRoom = await this.prisma.room.findUnique({ where: { code: room.code } });
      if (!dbRoom) {
        // Create map if needed
        let dbMap = await this.prisma.map.findFirst();
        if (!dbMap) {
          dbMap = await this.prisma.map.create({
            data: {
              name: 'Sky Base',
              json: this.getFallbackMapData() as any,
            },
          });
        }
        dbRoom = await this.prisma.room.create({
          data: {
            code: room.code,
            hostId: room.hostId,
            mapId: dbMap.id,
            status: 'playing',
            mode: 'deathmatch',
          },
        });
      }

      matchRecord = await this.prisma.match.create({
        data: {
          roomId: dbRoom.id,
          mode: 'deathmatch',
          kills: 0,
          duration: 0,
        },
      });
    } catch (e) {
      console.error('Failed to create match record in DB', e);
    }

    const matchId = matchRecord?.id || `match_${Math.random().toString(36).substring(2, 11)}`;

    // 3. Create simulation
    const simulation = new GameSimulation(matchId, mapData);
    this.activeSimulations.set(room.code, simulation);
    this.clientInputQueues.set(room.code, new Map());

    // Add players to simulation
    room.players.forEach((p) => {
      simulation.addPlayer(p.id, p.username, p.avatar);
    });

    // Setup callbacks
    simulation.setCallbacks({
      onKill: (killerId, killerName, victimId, victimName, weapon) => {
        io.to(room.code).emit(SOCKET_EVENTS.KILL_FEED, {
          killerId,
          killerName,
          victimId,
          victimName,
          weapon,
          timestamp: Date.now(),
        });
      },
      onDeath: (playerId) => {
        io.to(room.code).emit(SOCKET_EVENTS.PLAYER_DIED, { playerId });
      },
      onRespawn: (playerId, pos) => {
        io.to(room.code).emit(SOCKET_EVENTS.PLAYER_RESPAWNED, { playerId, position: pos });
      },
    });

    // 4. Run Game Loop (60 ticks/second) with drift correction
    const tickIntervalMs = 1000 / 60;
    let lastTickTime = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickTime;
      if (elapsed >= tickIntervalMs * 0.8) {
        lastTickTime = now;
        this.gameTick(room.code, io);
      }
    }, tickIntervalMs / 2);

    this.matchIntervals.set(room.code, timer);
  }

  private gameTick(roomCode: RoomCode, io: Server) {
    const sim = this.activeSimulations.get(roomCode);
    if (!sim) return;

    const inputsMap = this.clientInputQueues.get(roomCode);

    sim.players.forEach((player, playerId) => {
      if (!player.isAlive) return;

      const queue = inputsMap?.get(playerId) || [];
      if (queue.length > 0) {
        const maxInputsPerTick = 3;
        let processed = 0;
        while (queue.length > 0 && processed < maxInputsPerTick) {
          const input = queue.shift();
          sim.processInput(playerId, input);
          processed++;
        }
        if (queue.length > 0) {
          queue.length = 0;
        }
      } else {
        sim.processInput(playerId, {
          tick: sim.tickCount,
          moveX: 0,
          moveY: 0,
          aimX: 1,
          aimY: 0,
          shoot: false,
          grenade: false,
          jetpack: false,
          switchWeapon: null,
        });
      }
    });

    sim.tick();

    const state = sim.getSerializableState();
    io.to(roomCode).emit(SOCKET_EVENTS.MATCH_STATE, state);

    if (sim.isFinished) {
      this.endMatch(roomCode, io);
    }
  }

  private async endMatch(roomCode: RoomCode, io: Server) {
    const sim = this.activeSimulations.get(roomCode);
    const timer = this.matchIntervals.get(roomCode);

    if (timer) clearInterval(timer);
    this.matchIntervals.delete(roomCode);
    this.activeSimulations.delete(roomCode);
    this.clientInputQueues.delete(roomCode);

    if (!sim) return;

    // Calculate match results
    let winnerId: string | null = null;
    let winnerName = 'No one';
    let maxKills = -1;

    const results: { playerId: string; username: string; kills: number; deaths: number }[] = [];

    sim.players.forEach((player, id) => {
      results.push({
        playerId: id,
        username: player.username,
        kills: player.kills,
        deaths: player.deaths,
      });

      if (player.kills > maxKills) {
        maxKills = player.kills;
        winnerId = id;
        winnerName = player.username;
      }
    });

    // Update Room Status back to finished/waiting in RoomService
    this.roomService.setRoomStatus(roomCode, 'finished');
    const room = this.roomService.getRoom(roomCode);

    // Broadcast match end results
    io.to(roomCode).emit(SOCKET_EVENTS.MATCH_END, {
      matchId: sim.matchId,
      winnerId,
      winnerName,
      results,
    });

    if (room) {
      // Trigger a room update to lobby
      io.to(roomCode).emit(SOCKET_EVENTS.ROOM_UPDATE, room);
    }

    // Persist stats in background
    try {
      // Update winner
      if (winnerId) {
        await this.playerService.incrementWins(winnerId);
      }

      // Update losses and XP/coins for everyone else
      for (const [id, player] of sim.players.entries()) {
        if (id !== winnerId) {
          await this.playerService.incrementLosses(id);
        }
        
        // Award XP and coins
        const xpEarned = player.kills * 10 + 10;
        const coinsEarned = player.kills * 5 + 5;
        const dbPlayer = await this.playerService.findById(id);
        if (dbPlayer) {
          await this.playerService.updateStats(id, {
            xp: dbPlayer.xp + xpEarned,
            coins: dbPlayer.coins + coinsEarned,
          });
        }
      }

      // Record match details
      if (sim.matchId.startsWith('match_') === false) {
        const totalKills = results.reduce((acc, curr) => acc + curr.kills, 0);
        const duration = GAME_CONSTANTS.MATCH_DURATION - sim.timeRemaining;
        
        await this.prisma.match.update({
          where: { id: sim.matchId },
          data: {
            winnerId,
            kills: totalKills,
            duration,
          },
        });
      }
    } catch (e) {
      console.error('Failed to update stats in DB at match end', e);
    }
  }

  public handlePlayerInput(roomCode: RoomCode, playerId: string, input: any) {
    const sim = this.activeSimulations.get(roomCode);
    if (!sim) return;

    const roomQueues = this.clientInputQueues.get(roomCode);
    if (roomQueues) {
      let queue = roomQueues.get(playerId);
      if (!queue) {
        queue = [];
        roomQueues.set(playerId, queue);
      }
      
      // Basic rate limiting to prevent input spamming
      if (queue.length < GAME_CONSTANTS.INPUT_BUFFER_SIZE) {
        queue.push(input);
      }
    }
  }

  public handlePlayerAction(roomCode: RoomCode, playerId: string, actionType: 'weapon' | 'grenade', payload: any) {
    const sim = this.activeSimulations.get(roomCode);
    if (!sim) return;

    if (actionType === 'weapon') {
      const input: PlayerInput = {
        tick: sim.tickCount,
        moveX: 0,
        moveY: 0,
        aimX: 1,
        aimY: 0,
        shoot: false,
        grenade: false,
        jetpack: false,
        switchWeapon: payload as WeaponType,
      };
      this.handlePlayerInput(roomCode, playerId, input);
    } else if (actionType === 'grenade') {
      const input: PlayerInput = {
        tick: sim.tickCount,
        moveX: 0,
        moveY: 0,
        aimX: Math.cos(payload.angle || 0),
        aimY: Math.sin(payload.angle || 0),
        shoot: false,
        grenade: true,
        jetpack: false,
        switchWeapon: null,
      };
      this.handlePlayerInput(roomCode, playerId, input);
    }
  }

  public getFallbackMapData(): MapData {
    return {
      id: 'sky_base',
      name: 'Sky Base',
      width: GAME_CONSTANTS.MAP_WIDTH,
      height: GAME_CONSTANTS.MAP_HEIGHT,
      platforms: [
        // Solid bottom floor
        { id: 'floor_left', x: 100, y: 1400, width: 900, height: 40, type: 'solid' },
        { id: 'floor_center', x: 1200, y: 1500, width: 600, height: 40, type: 'solid' },
        { id: 'floor_right', x: 2000, y: 1400, width: 900, height: 40, type: 'solid' },
        
        // Mid level floating platforms
        { id: 'plat_left_mid', x: 300, y: 1000, width: 400, height: 30, type: 'one_way' },
        { id: 'plat_right_mid', x: 2300, y: 1000, width: 400, height: 30, type: 'one_way' },
        
        // Center structure platforms
        { id: 'center_base', x: 1100, y: 1100, width: 800, height: 30, type: 'solid' },
        { id: 'center_tower_1', x: 1300, y: 800, width: 400, height: 30, type: 'one_way' },
        { id: 'center_tower_2', x: 1400, y: 500, width: 200, height: 30, type: 'one_way' },
      ],
      spawnPoints: [
        { x: 200, y: 1200 },
        { x: 600, y: 800 },
        { x: 1500, y: 400 },
        { x: 2800, y: 1200 },
        { x: 2400, y: 800 },
        { x: 1500, y: 900 },
      ],
      jumpPads: [
        { id: 'j_left', x: 150, y: 1390, force: 750 },
        { id: 'j_right', x: 2850, y: 1390, force: 750 },
      ],
      movingPlatforms: [
        {
          id: 'mp_left',
          x: 800,
          y: 700,
          width: 150,
          height: 20,
          speed: 120,
          path: [
            { x: 800, y: 700 },
            { x: 1200, y: 700 },
          ],
        },
        {
          id: 'mp_right',
          x: 2050,
          y: 700,
          width: 150,
          height: 20,
          speed: 120,
          path: [
            { x: 2050, y: 700 },
            { x: 1650, y: 700 },
          ],
        },
      ],
      boxes: [
        { id: 'b_left_1', x: 450, y: 1340, width: 60, height: 60, health: 100 },
        { id: 'b_left_2', x: 510, y: 1340, width: 60, height: 60, health: 100 },
        { id: 'b_right_1', x: 2450, y: 1340, width: 60, height: 60, health: 100 },
      ],
    };
  }
}
