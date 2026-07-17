import {
  GAME_CONSTANTS,
  POWER_UP_CONFIG,
  PlayerState,
  PowerUpState,
  PowerUpType,
  MapData,
  distance,
} from '@battle-jets/shared';

export interface PowerUpWorld {
  players: Map<string, PlayerState>;
  powerUps: PowerUpState[];
  activePowerUps: Map<string, Map<PowerUpType, number>>;
  mapData: MapData | null;
}

export function spawnPowerUp(
  world: PowerUpWorld,
  timer: { value: number },
  nextId: { value: number },
): PowerUpState | null {
  timer.value++;
  if (timer.value < GAME_CONSTANTS.POWER_UP_SPAWN_INTERVAL * 60) return null;
  if (world.powerUps.filter((p) => p.active).length >= GAME_CONSTANTS.POWER_UP_MAX_ACTIVE) return null;

  timer.value = 0;

  if (!world.mapData || world.mapData.spawnPoints.length === 0) return null;

  const spawn = world.mapData.spawnPoints[Math.floor(Math.random() * world.mapData.spawnPoints.length)];
  const types: PowerUpType[] = ['health', 'speed', 'damage', 'shield', 'jetpack_fuel'];
  const type = types[Math.floor(Math.random() * types.length)];
  const config = POWER_UP_CONFIG[type];

  nextId.value++;
  return {
    id: `pu_${nextId.value}`,
    type,
    position: { x: spawn.x, y: spawn.y - 30 },
    active: true,
    duration: config.duration,
    magnitude: config.magnitude,
  };
}

export function checkPowerUpPickup(
  world: PowerUpWorld,
  playerId: string,
): PowerUpState | null {
  const player = world.players.get(playerId);
  if (!player || !player.isAlive) return null;

  for (const powerUp of world.powerUps) {
    if (!powerUp.active) continue;
    const dist = distance(player.position, powerUp.position);
    if (dist <= GAME_CONSTANTS.POWER_UP_PICKUP_RADIUS) {
      powerUp.active = false;
      return powerUp;
    }
  }

  return null;
}

export function applyPowerUp(
  player: PlayerState,
  pows: Map<PowerUpType, number>,
  powerUp: PowerUpState,
) {
  if (powerUp.type === 'health') {
    player.health = Math.min(player.maxHealth, player.health + POWER_UP_CONFIG.health.magnitude);
    return;
  }

  if (powerUp.type === 'jetpack_fuel') {
    player.jetpackFuel = Math.min(
      GAME_CONSTANTS.JETPACK_MAX_FUEL,
      player.jetpackFuel + POWER_UP_CONFIG.jetpack_fuel.magnitude,
    );
    return;
  }

  if (powerUp.type === 'shield') {
    player.maxHealth = GAME_CONSTANTS.MAX_HEALTH * 2;
    player.health = Math.min(player.health + GAME_CONSTANTS.MAX_HEALTH, player.maxHealth);
  }

  pows.set(powerUp.type, powerUp.duration);
}

export function applyPowerUpEnd(player: PlayerState, type: PowerUpType) {
  if (type === 'shield') {
    player.maxHealth = GAME_CONSTANTS.MAX_HEALTH;
    player.health = Math.min(player.health, player.maxHealth);
  }
}

export function tickPowerUpTimers(
  world: PowerUpWorld,
  playerId: string,
): PowerUpType[] {
  const pows = world.activePowerUps.get(playerId);
  if (!pows) return [];

  const expired: PowerUpType[] = [];
  for (const [type, timer] of pows) {
    if (timer > 0) {
      pows.set(type, timer - 1 / 60);
      if (pows.get(type)! <= 0) {
        pows.delete(type);
        expired.push(type);
      }
    }
  }
  return expired;
}
