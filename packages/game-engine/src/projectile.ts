import {
  GAME_CONSTANTS,
  WEAPONS,
  Vector2,
  PlayerState,
  ProjectileState,
  BoxState,
  WeaponType,
  distance,
  intersectSegmentBox,
} from '@battle-jets/shared';

export interface ProjectileWorld {
  players: Map<string, PlayerState>;
  projectiles: ProjectileState[];
  boxes: BoxState[];
  mapData: { platforms: any[] } | null;
}

export function updateProjectiles(
  world: ProjectileWorld,
  callbacks: {
    onHitPlayer: (playerId: string, damage: number, attackerId: string, weapon: WeaponType) => void;
    onKnockback: (targetId: string, attackerId: string, knockback: number, sourcePos?: Vector2) => void;
    onRocketExplosion: (pos: Vector2, ownerId: string) => void;
    onBoxDamage: (boxId: string, damage: number) => void;
  },
): ProjectileState[] {
  const activeProjectiles: ProjectileState[] = [];

  world.projectiles.forEach((proj) => {
    const oldPos = { ...proj.position };
    const dt = 1 / 60;
    proj.position.x += proj.velocity.x * dt;
    proj.position.y += proj.velocity.y * dt;

    let collided = false;

    for (const [playerId, player] of world.players.entries()) {
      if (!player.isAlive || playerId === proj.ownerId) continue;

      const halfW = GAME_CONSTANTS.PLAYER_WIDTH / 2;
      const halfH = GAME_CONSTANTS.PLAYER_HEIGHT / 2;
      const boxMin = { x: player.position.x - halfW, y: player.position.y - halfH };
      const boxMax = { x: player.position.x + halfW, y: player.position.y + halfH };

      if (intersectSegmentBox(oldPos, proj.position, boxMin, boxMax)) {
        callbacks.onHitPlayer(playerId, proj.damage, proj.ownerId, proj.weapon);
        callbacks.onKnockback(playerId, proj.ownerId, WEAPONS[proj.weapon]?.knockback || 0);
        collided = true;
        break;
      }
    }

    if (collided) {
      if (proj.weapon === 'rocket_launcher') {
        callbacks.onRocketExplosion(proj.position, proj.ownerId);
      }
      return;
    }

    if (world.mapData) {
      for (const platform of world.mapData.platforms) {
        if (platform.type === 'one_way') continue;

        const boxMin = { x: platform.x, y: platform.y };
        const boxMax = { x: platform.x + platform.width, y: platform.y + platform.height };

        if (intersectSegmentBox(oldPos, proj.position, boxMin, boxMax)) {
          collided = true;
          break;
        }
      }
    }

    if (collided) {
      if (proj.weapon === 'rocket_launcher') {
        callbacks.onRocketExplosion(proj.position, proj.ownerId);
      }
      return;
    }

    for (const box of world.boxes) {
      if (box.isDestroyed) continue;
      const boxMin = { x: box.x, y: box.y };
      const boxMax = { x: box.x + box.width, y: box.y + box.height };
      if (intersectSegmentBox(oldPos, proj.position, boxMin, boxMax)) {
        callbacks.onBoxDamage(box.id, proj.damage);
        if (proj.weapon === 'rocket_launcher') {
          callbacks.onRocketExplosion(proj.position, proj.ownerId);
        }
        collided = true;
        break;
      }
    }

    if (collided) return;

    const limitRange = WEAPONS[proj.weapon]?.range || 1000;
    const traveled = distance(oldPos, proj.position);
    if (traveled > limitRange) return;

    if (
      proj.position.x < -200 ||
      proj.position.x > GAME_CONSTANTS.MAP_WIDTH + 200 ||
      proj.position.y < -200 ||
      proj.position.y > GAME_CONSTANTS.MAP_HEIGHT + 200
    ) {
      if (proj.weapon === 'rocket_launcher') {
        callbacks.onRocketExplosion(proj.position, proj.ownerId);
      }
      return;
    }

    activeProjectiles.push(proj);
  });

  return activeProjectiles;
}

export function triggerRocketExplosion(
  players: Map<string, PlayerState>,
  explosionPos: Vector2,
  ownerId: string,
  callbacks: {
    onKnockback: (targetId: string, attackerId: string, knockback: number, sourcePos?: Vector2) => void;
    onDamage: (playerId: string, damage: number, attackerId: string, weapon: WeaponType) => void;
    onBoxDamageAt: (pos: Vector2, radius: number, damage: number) => void;
  },
) {
  const weaponData = WEAPONS.rocket_launcher;
  const radius = weaponData.explosionRadius;
  const maxDamage = weaponData.damage;

  players.forEach((player, playerId) => {
    if (!player.isAlive) return;

    const dist = distance(player.position, explosionPos);
    if (dist <= radius) {
      const falloff = 1 - dist / radius;
      const damage = Math.round(maxDamage * falloff);

      callbacks.onKnockback(playerId, ownerId, 25, explosionPos);
      callbacks.onDamage(playerId, damage, ownerId, 'rocket_launcher');
    }
  });

  callbacks.onBoxDamageAt(explosionPos, radius, 60);
}
