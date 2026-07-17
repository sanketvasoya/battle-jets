import {
  GAME_CONSTANTS,
  Vector2,
  PlayerState,
  GrenadeState,
  WeaponType,
  distance,
  generateId,
} from '@battle-jets/shared';
import { PhysicsWorld } from '@battle-jets/physics';

export interface GrenadeWorld {
  players: Map<string, PlayerState>;
  grenades: GrenadeState[];
  physicsWorld: PhysicsWorld;
}

export function throwGrenade(
  world: GrenadeWorld,
  playerId: string,
): GrenadeState | null {
  const player = world.players.get(playerId);
  if (!player || player.grenades <= 0) return null;

  player.grenades--;

  const angle = player.aimAngle;
  const spawnOffset = 30;
  const spawnX = player.position.x + Math.cos(angle) * spawnOffset;
  const spawnY = player.position.y + Math.sin(angle) * spawnOffset;

  const speed = GAME_CONSTANTS.GRENADE_SPEED;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  const grenadeId = generateId();
  world.physicsWorld.addGrenade(grenadeId, playerId, spawnX, spawnY, vx, vy);

  return {
    id: grenadeId,
    ownerId: playerId,
    position: { x: spawnX, y: spawnY },
    velocity: { x: vx, y: vy },
    fuseTimer: GAME_CONSTANTS.GRENADE_FUSE_TIME,
    createdAt: Date.now(),
  };
}

export function updateGrenades(
  world: GrenadeWorld,
  callbacks: {
    onExplode: (grenade: GrenadeState) => void;
  },
): GrenadeState[] {
  const activeGrenades: GrenadeState[] = [];

  world.grenades.forEach((grenade) => {
    const gPos = world.physicsWorld.getGrenadePosition(grenade.id);
    const gVel = world.physicsWorld.getGrenadeVelocity(grenade.id);

    if (gPos && gVel) {
      grenade.position = gPos;
      grenade.velocity = gVel;
    }

    grenade.fuseTimer -= 1 / 60;
    if (grenade.fuseTimer <= 0) {
      callbacks.onExplode(grenade);
    } else {
      activeGrenades.push(grenade);
    }
  });

  return activeGrenades;
}

export function explodeGrenade(
  world: GrenadeWorld,
  grenade: GrenadeState,
  callbacks: {
    onKnockback: (targetId: string, attackerId: string, knockback: number, sourcePos?: Vector2) => void;
    onDamage: (playerId: string, damage: number, attackerId: string, weapon: WeaponType) => void;
    onBoxDamageAt: (pos: Vector2, radius: number, damage: number) => void;
  },
) {
  const explosionPos = grenade.position;
  const radius = GAME_CONSTANTS.GRENADE_EXPLOSION_RADIUS;
  const maxDamage = GAME_CONSTANTS.GRENADE_DAMAGE;

  world.players.forEach((player, playerId) => {
    if (!player.isAlive) return;

    const dist = distance(player.position, explosionPos);
    if (dist <= radius) {
      const falloff = 1 - dist / radius;
      const damage = Math.round(maxDamage * falloff);

      callbacks.onKnockback(playerId, grenade.ownerId, 20, explosionPos);
      callbacks.onDamage(playerId, damage, grenade.ownerId, 'grenade_launcher');
    }
  });

  callbacks.onBoxDamageAt(explosionPos, radius, 80);
  world.physicsWorld.removeGrenade(grenade.id);
}
