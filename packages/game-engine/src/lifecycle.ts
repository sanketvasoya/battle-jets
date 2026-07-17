import {
  GAME_CONSTANTS,
  WEAPONS,
  Vector2,
  PlayerState,
  BoxState,
  MapData,
  MovingPlatformState,
  distance,
} from '@battle-jets/shared';
import { PhysicsWorld } from '@battle-jets/physics';

export interface LifecycleWorld {
  players: Map<string, PlayerState>;
  playerBodies: Map<string, any>;
  playerRespawnTimers: Map<string, number>;
  playerShootCooldowns: Map<string, number>;
  activePowerUps: Map<string, Map<string, number>>;
  boxes: BoxState[];
  physicsWorld: PhysicsWorld;
  mapData: MapData | null;
}

export function respawnPlayer(
  world: LifecycleWorld,
  playerId: string,
): Vector2 | null {
  const player = world.players.get(playerId);
  if (!player) return null;

  const spawn = getRandomSpawnPoint(world.mapData);
  const body = world.physicsWorld.addPlayer(playerId, spawn.x, spawn.y);
  world.playerBodies.set(playerId, body);

  const weaponData = WEAPONS['assault_rifle'];
  player.position = { x: spawn.x, y: spawn.y };
  player.velocity = { x: 0, y: 0 };
  player.health = GAME_CONSTANTS.MAX_HEALTH;
  player.isAlive = true;
  player.grenades = GAME_CONSTANTS.MAX_GRENADES;
  player.jetpackFuel = GAME_CONSTANTS.JETPACK_MAX_FUEL;
  player.weapon = 'assault_rifle';
  player.ammo = weaponData.ammo;
  player.maxAmmo = weaponData.ammo;
  player.isReloading = false;
  player.reloadTimer = 0;

  world.playerRespawnTimers.delete(playerId);
  world.playerShootCooldowns.set(playerId, 0);
  world.activePowerUps.set(playerId, new Map());

  return spawn;
}

export function getRandomSpawnPoint(mapData: MapData | null): Vector2 {
  if (mapData && mapData.spawnPoints.length > 0) {
    const idx = Math.floor(Math.random() * mapData.spawnPoints.length);
    return mapData.spawnPoints[idx];
  }
  return { x: 1500, y: 300 };
}

export function damageBox(boxes: BoxState[], physicsWorld: PhysicsWorld, boxId: string, damage: number) {
  const box = boxes.find((b) => b.id === boxId);
  if (!box || box.isDestroyed) return;

  box.health -= damage;
  if (box.health <= 0) {
    box.health = 0;
    box.isDestroyed = true;
    physicsWorld.removeBox(boxId);
  }
}

export function damageBoxAtPosition(
  boxes: BoxState[],
  physicsWorld: PhysicsWorld,
  pos: Vector2,
  radius: number,
  damage: number,
) {
  for (const box of boxes) {
    if (box.isDestroyed) continue;
    const boxCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const dist = distance(pos, boxCenter);
    if (dist <= radius + Math.max(box.width, box.height) / 2) {
      const falloff = 1 - dist / (radius + Math.max(box.width, box.height) / 2);
      damageBox(boxes, physicsWorld, box.id, Math.round(damage * falloff));
    }
  }
}

export function updateBoxState(
  boxes: BoxState[],
  physicsWorld: PhysicsWorld,
  mapData: MapData | null,
) {
  if (!mapData) return;
  for (const box of boxes) {
    if (!box.isDestroyed) {
      const physHealth = physicsWorld.getBoxHealth(box.id);
      if (physHealth !== null && physHealth !== box.health) {
        box.health = physHealth;
        if (box.health <= 0) {
          box.isDestroyed = true;
        }
      }
    }
  }
}

export function addPlayer(
  world: LifecycleWorld,
  playerId: string,
  username: string,
  avatar: string,
): boolean {
  if (world.players.size >= GAME_CONSTANTS.MAX_PLAYERS) return false;

  const spawn = getRandomSpawnPoint(world.mapData);
  const body = world.physicsWorld.addPlayer(playerId, spawn.x, spawn.y);
  world.playerBodies.set(playerId, body);

  const weaponData = WEAPONS['assault_rifle'];
  const playerState: PlayerState = {
    id: playerId,
    username,
    avatar,
    position: { x: spawn.x, y: spawn.y },
    velocity: { x: 0, y: 0 },
    aimAngle: 0,
    health: GAME_CONSTANTS.MAX_HEALTH,
    maxHealth: GAME_CONSTANTS.MAX_HEALTH,
    isAlive: true,
    kills: 0,
    deaths: 0,
    weapon: 'assault_rifle',
    grenades: GAME_CONSTANTS.MAX_GRENADES,
    jetpackActive: false,
    jetpackFuel: GAME_CONSTANTS.JETPACK_MAX_FUEL,
    lastInputTick: 0,
    ammo: weaponData.ammo,
    maxAmmo: weaponData.ammo,
    isReloading: false,
    reloadTimer: 0,
    knockbackMultiplier: 1,
  };

  world.players.set(playerId, playerState);
  world.playerShootCooldowns.set(playerId, 0);
  world.activePowerUps.set(playerId, new Map());
  return true;
}

export function removePlayer(
  world: LifecycleWorld,
  playerId: string,
) {
  world.players.delete(playerId);
  world.playerBodies.delete(playerId);
  world.physicsWorld.removePlayer(playerId);
  world.playerShootCooldowns.delete(playerId);
  world.playerRespawnTimers.delete(playerId);
  world.activePowerUps.delete(playerId);
}

export function getMovingPlatformsState(physicsWorld: PhysicsWorld): MovingPlatformState[] {
  return physicsWorld.getMovingPlatformsState().map((mp) => ({
    id: mp.id,
    position: mp.position,
    width: 150,
    height: 20,
  }));
}
