import {
  GAME_CONSTANTS,
  WEAPONS,
  POWER_UP_CONFIG,
  Vector2,
  PlayerState,
  WeaponType,
  KillFeedEntry,
  distance,
  normalize,
  generateId,
} from '@battle-jets/shared';
import { PhysicsWorld } from '@battle-jets/physics';
import planck from 'planck-js';

export interface CombatState {
  players: Map<string, PlayerState>;
  playerBodies: Map<string, planck.Body>;
  playerShootCooldowns: Map<string, number>;
  activePowerUps: Map<string, Map<string, number>>;
  physicsWorld: PhysicsWorld;
  killFeed: KillFeedEntry[];
}

export function startReload(player: PlayerState) {
  if (player.isReloading) return;
  const weaponData = WEAPONS[player.weapon];
  if (!weaponData || weaponData.ammo === Infinity) return;
  player.isReloading = true;
  player.reloadTimer = weaponData.reloadTime;
}

export function fireWeapon(
  state: CombatState,
  playerId: string,
): { projectiles: ProjectileData[]; grenade?: any } {
  const player = state.players.get(playerId);
  if (!player) return { projectiles: [] };

  const weaponData = WEAPONS[player.weapon];
  if (!weaponData) return { projectiles: [] };

  if (player.weapon !== 'melee') {
    player.ammo--;
  }

  const cooldownTicks = Math.ceil(60 / weaponData.fireRate);
  state.playerShootCooldowns.set(playerId, cooldownTicks);

  const gunBarrelOffset = 25;
  const angle = player.aimAngle;
  const spawnX = player.position.x + Math.cos(angle) * gunBarrelOffset;
  const spawnY = player.position.y + Math.sin(angle) * gunBarrelOffset;

  let damageMultiplier = 1;
  if (state.activePowerUps.get(playerId)?.has('damage')) {
    damageMultiplier = POWER_UP_CONFIG.damage.magnitude;
  }

  if (player.weapon === 'melee') {
    meleeAttack(state, playerId, spawnX, spawnY, angle, damageMultiplier);
    return { projectiles: [] };
  }

  if (player.weapon === 'grenade_launcher') {
    const grenade = createGrenadeProjectile(playerId, spawnX, spawnY, angle, weaponData.projectileSpeed);
    return { projectiles: [], grenade };
  }

  const projectiles = createProjectiles(player, playerId, spawnX, spawnY, angle, weaponData, damageMultiplier);
  return { projectiles };
}

interface ProjectileData {
  id: string;
  ownerId: string;
  position: Vector2;
  velocity: Vector2;
  weapon: WeaponType;
  damage: number;
  createdAt: number;
}

function createProjectile(
  ownerId: string,
  x: number,
  y: number,
  angle: number,
  weapon: WeaponType,
  speed: number,
  damage: number,
): ProjectileData {
  return {
    id: generateId(),
    ownerId,
    position: { x, y },
    velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
    weapon,
    damage,
    createdAt: Date.now(),
  };
}

function createProjectiles(
  player: PlayerState,
  playerId: string,
  spawnX: number,
  spawnY: number,
  angle: number,
  weaponData: any,
  damageMultiplier: number,
): ProjectileData[] {
  const speed = weaponData.projectileSpeed;
  const damage = Math.round(weaponData.damage * damageMultiplier);

  if (player.weapon === 'shotgun') {
    const pellets: any[] = [];
    for (let i = 0; i < weaponData.pellets; i++) {
      const pelletAngle = angle + (Math.random() - 0.5) * weaponData.spread;
      pellets.push(createProjectile(playerId, spawnX, spawnY, pelletAngle, player.weapon, speed, damage));
    }
    return pellets;
  }

  const bulletAngle = angle + (Math.random() - 0.5) * weaponData.spread;
  return [createProjectile(playerId, spawnX, spawnY, bulletAngle, player.weapon, speed, damage)];
}

function createGrenadeProjectile(
  ownerId: string,
  spawnX: number,
  spawnY: number,
  angle: number,
  speed: number,
) {
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  return {
    id: generateId(),
    ownerId,
    position: { x: spawnX, y: spawnY },
    velocity: { x: vx, y: vy },
    fuseTimer: GAME_CONSTANTS.GRENADE_FUSE_TIME,
    createdAt: Date.now(),
  };
}

function meleeAttack(
  state: CombatState,
  playerId: string,
  spawnX: number,
  spawnY: number,
  angle: number,
  damageMultiplier: number,
) {
  const weaponData = WEAPONS['melee'];
  const range = weaponData.range;
  const results: { targetId: string; damage: number; knockback: number }[] = [];

  state.players.forEach((target, targetId) => {
    if (!target.isAlive || targetId === playerId) return;
    const dist = distance({ x: spawnX, y: spawnY }, target.position);
    if (dist <= range) {
      const dir = normalize({ x: target.position.x - spawnX, y: target.position.y - spawnY });
      const dot = dir.x * Math.cos(angle) + dir.y * Math.sin(angle);
      if (dot > 0.5) {
        results.push({
          targetId,
          damage: Math.round(weaponData.damage * damageMultiplier),
          knockback: weaponData.knockback,
        });
      }
    }
  });

  return results;
}

export function applyKnockback(
  state: CombatState,
  targetId: string,
  attackerId: string,
  knockbackForce: number,
  sourcePos?: Vector2,
) {
  const target = state.players.get(targetId);
  const body = state.playerBodies.get(targetId);
  if (!target || !body || !target.isAlive) return;

  let dir: Vector2;
  if (sourcePos) {
    dir = normalize({ x: target.position.x - sourcePos.x, y: target.position.y - sourcePos.y });
  } else {
    const attacker = state.players.get(attackerId);
    if (!attacker) return;
    dir = normalize({ x: target.position.x - attacker.position.x, y: target.position.y - attacker.position.y });
  }

  const shieldActive = state.activePowerUps.get(targetId)?.has('shield');
  const multiplier = shieldActive ? 0.3 : 1;
  const impulseStrength = knockbackForce * GAME_CONSTANTS.KNOCKBACK_SCALE * body.getMass() * multiplier;

  body.applyLinearImpulse(
    planck.Vec2(dir.x * impulseStrength, -dir.y * impulseStrength),
    body.getWorldCenter(),
    true,
  );
}

export function damagePlayer(
  state: CombatState,
  playerId: string,
  amount: number,
  attackerId: string,
  weapon?: WeaponType,
): boolean {
  const player = state.players.get(playerId);
  if (!player || !player.isAlive) return false;

  let finalDamage = amount;
  if (weapon) {
    const weaponData = WEAPONS[weapon];
    if (weaponData?.damageType === 'energy') {
      finalDamage = Math.round(amount * 0.7);
    }
  }

  const shieldActive = state.activePowerUps.get(playerId)?.has('shield');
  if (shieldActive) {
    finalDamage = Math.round(finalDamage * POWER_UP_CONFIG.shield.magnitude);
  }

  player.health = Math.max(0, player.health - finalDamage);
  return player.health <= 0;
}

export function killPlayer(
  state: CombatState,
  victimId: string,
  killerId: string,
  weapon: WeaponType,
): void {
  const victim = state.players.get(victimId);
  if (!victim || !victim.isAlive) return;

  victim.isAlive = false;
  victim.deaths++;
  victim.health = 0;

  state.physicsWorld.removePlayer(victimId);
  state.playerBodies.delete(victimId);

  let killerName = 'Environment';
  const killer = state.players.get(killerId);
  if (killer && killerId !== victimId) {
    killer.kills++;
    killerName = killer.username;
  }

  state.killFeed.push({
    killerId: killerId === victimId ? 'environment' : killerId,
    killerName,
    victimId,
    victimName: victim.username,
    weapon,
    timestamp: Date.now(),
  });

  if (state.killFeed.length > 5) {
    state.killFeed.shift();
  }
}
