import { 
  GAME_CONSTANTS, 
  WEAPONS, 
  POWER_UP_CONFIG,
  Vector2, 
  PlayerState, 
  ProjectileState, 
  GrenadeState, 
  GameState, 
  PlayerInput, 
  MapData, 
  WeaponType, 
  KillFeedEntry,
  BoxState,
  PowerUpState,
  PowerUpType,
  MovingPlatformState,
  distance,
  normalize,
  generateId
} from '@battle-jets/shared';
import { PhysicsWorld } from '@battle-jets/physics';
import planck from 'planck-js';

export function intersectSegmentBox(
  p0: Vector2,
  p1: Vector2,
  boxMin: Vector2,
  boxMax: Vector2
): boolean {
  let tmin = 0;
  let tmax = 1;
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;

  if (Math.abs(dx) < 0.000001) {
    if (p0.x < boxMin.x || p0.x > boxMax.x) return false;
  } else {
    const ood = 1 / dx;
    let t1 = (boxMin.x - p0.x) * ood;
    let t2 = (boxMax.x - p0.x) * ood;
    if (t1 > t2) { const temp = t1; t1 = t2; t2 = temp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }

  if (Math.abs(dy) < 0.000001) {
    if (p0.y < boxMin.y || p0.y > boxMax.y) return false;
  } else {
    const ood = 1 / dy;
    let t1 = (boxMin.y - p0.y) * ood;
    let t2 = (boxMax.y - p0.y) * ood;
    if (t1 > t2) { const temp = t1; t1 = t2; t2 = temp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }

  return true;
}

export class GameSimulation {
  public physicsWorld: PhysicsWorld;
  public mapData: MapData | null = null;
  
  public players = new Map<string, PlayerState>();
  public projectiles: ProjectileState[] = [];
  public grenades: GrenadeState[] = [];
  public boxes: BoxState[] = [];
  public powerUps: PowerUpState[] = [];
  
  private playerBodies = new Map<string, planck.Body>();
  private playerShootCooldowns = new Map<string, number>();
  private playerRespawnTimers = new Map<string, number>();
  private activePowerUps = new Map<string, Map<PowerUpType, number>>();
  
  private powerUpSpawnTimer = 0;
  private nextPowerUpId = 0;
  
  public tickCount = 0;
  public matchId: string;
  public startTime: number;
  public timeRemaining: number;
  public isFinished = false;
  public killFeed: KillFeedEntry[] = [];
  
  private onKillCallback?: (killerId: string, killerName: string, victimId: string, victimName: string, weapon: WeaponType) => void;
  private onDeathCallback?: (playerId: string) => void;
  private onRespawnCallback?: (playerId: string, pos: Vector2) => void;

  constructor(matchId: string, mapData: MapData) {
    this.matchId = matchId;
    this.physicsWorld = new PhysicsWorld();
    this.loadMap(mapData);
    this.startTime = Date.now();
    this.timeRemaining = GAME_CONSTANTS.MATCH_DURATION;
  }

  public loadMap(mapData: MapData) {
    this.mapData = mapData;
    this.physicsWorld.loadMap(mapData);
    this.boxes = mapData.boxes.map((b) => ({
      id: b.id,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      health: b.health,
      maxHealth: b.health,
      isDestroyed: false,
    }));
  }

  public addPlayer(playerId: string, username: string, avatar: string) {
    const spawn = this.getRandomSpawnPoint();
    const body = this.physicsWorld.addPlayer(playerId, spawn.x, spawn.y);
    this.playerBodies.set(playerId, body);

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

    this.players.set(playerId, playerState);
    this.playerShootCooldowns.set(playerId, 0);
    this.activePowerUps.set(playerId, new Map());
  }

  public removePlayer(playerId: string) {
    this.players.delete(playerId);
    this.playerBodies.delete(playerId);
    this.physicsWorld.removePlayer(playerId);
    this.playerShootCooldowns.delete(playerId);
    this.playerRespawnTimers.delete(playerId);
    this.activePowerUps.delete(playerId);
  }

  public setCallbacks(callbacks: {
    onKill?: (killerId: string, killerName: string, victimId: string, victimName: string, weapon: WeaponType) => void;
    onDeath?: (playerId: string) => void;
    onRespawn?: (playerId: string, pos: Vector2) => void;
  }) {
    this.onKillCallback = callbacks.onKill;
    this.onDeathCallback = callbacks.onDeath;
    this.onRespawnCallback = callbacks.onRespawn;
  }

  public processInput(playerId: string, input: PlayerInput) {
    const player = this.players.get(playerId);
    const body = this.playerBodies.get(playerId);

    if (!player || !player.isAlive || !body) return;

    player.lastInputTick = input.tick;

    // Decrement reload timer
    if (player.isReloading) {
      player.reloadTimer -= 1 / 60;
      if (player.reloadTimer <= 0) {
        player.isReloading = false;
        player.ammo = player.maxAmmo;
      }
    }

    // Decrement power-up timers
    const pows = this.activePowerUps.get(playerId);
    if (pows) {
      for (const [type, timer] of pows) {
        if (timer > 0) {
          pows.set(type, timer - 1 / 60);
          if (pows.get(type)! <= 0) {
            pows.delete(type);
            this.applyPowerUpEnd(playerId, type);
          }
        }
      }
    }

    // 1. Aim Angle
    player.aimAngle = Math.atan2(input.aimY, input.aimX);

    // 2. Walk Movement
    const currentVel = body.getLinearVelocity();
    let walkSpeed = GAME_CONSTANTS.PLAYER_SPEED;
    if (pows?.has('speed')) {
      walkSpeed *= POWER_UP_CONFIG.speed.magnitude;
    }
    const targetVx = input.moveX * walkSpeed;
    this.physicsWorld.setPlayerVelocity(playerId, targetVx, -currentVel.y * 30);

    // 3. Jump
    const isGrounded = this.physicsWorld.isPlayerGrounded(playerId);
    if (input.moveY < -0.5 && isGrounded) {
      this.physicsWorld.setPlayerVelocity(playerId, targetVx, GAME_CONSTANTS.JUMP_FORCE);
    }

    // 4. Jetpack with fuel
    player.jetpackActive = input.jetpack;
    if (input.jetpack && player.jetpackFuel > 0) {
      const mass = body.getMass();
      body.applyForceToCenter(planck.Vec2(0, 22 * mass), true);
      player.jetpackFuel = Math.max(0, player.jetpackFuel - GAME_CONSTANTS.JETPACK_FUEL_DRAIN / 60);
    } else if (!input.jetpack) {
      player.jetpackFuel = Math.min(
        GAME_CONSTANTS.JETPACK_MAX_FUEL,
        player.jetpackFuel + GAME_CONSTANTS.JETPACK_FUEL_REGEN / 60
      );
    }

    // 5. Weapon Switch
    if (input.switchWeapon && input.switchWeapon !== player.weapon) {
      const newWeaponData = WEAPONS[input.switchWeapon];
      if (newWeaponData) {
        player.weapon = input.switchWeapon;
        player.ammo = newWeaponData.ammo;
        player.maxAmmo = newWeaponData.ammo;
        player.isReloading = false;
        player.reloadTimer = 0;
        this.playerShootCooldowns.set(playerId, 10);
      }
    }

    // 6. Shooting (with ammo)
    const cooldown = this.playerShootCooldowns.get(playerId) || 0;
    if (input.shoot && cooldown <= 0 && !player.isReloading) {
      if (player.ammo > 0 || player.weapon === 'melee') {
        this.fireWeapon(playerId);
      } else {
        this.startReload(playerId);
      }
    }

    // 7. Auto-reload when empty and trying to shoot
    if (input.shoot && player.ammo <= 0 && !player.isReloading && player.weapon !== 'melee') {
      this.startReload(playerId);
    }

    // 8. Grenade
    if (input.grenade && player.grenades > 0) {
      this.throwGrenade(playerId);
    }

    // 9. Check power-up pickup
    this.checkPowerUpPickup(playerId);
  }

  private startReload(playerId: string) {
    const player = this.players.get(playerId);
    if (!player || player.isReloading) return;
    const weaponData = WEAPONS[player.weapon];
    if (!weaponData || weaponData.ammo === Infinity) return;
    player.isReloading = true;
    player.reloadTimer = weaponData.reloadTime;
  }

  private fireWeapon(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    const weaponData = WEAPONS[player.weapon];
    if (!weaponData) return;

    if (player.weapon !== 'melee') {
      player.ammo--;
    }

    const cooldownTicks = Math.ceil(60 / weaponData.fireRate);
    this.playerShootCooldowns.set(playerId, cooldownTicks);

    const gunBarrelOffset = 25;
    const angle = player.aimAngle;
    const spawnX = player.position.x + Math.cos(angle) * gunBarrelOffset;
    const spawnY = player.position.y + Math.sin(angle) * gunBarrelOffset;

    let damageMultiplier = 1;
    if (this.activePowerUps.get(playerId)?.has('damage')) {
      damageMultiplier = POWER_UP_CONFIG.damage.magnitude;
    }

    if (player.weapon === 'melee') {
      this.meleeAttack(playerId, spawnX, spawnY, angle, damageMultiplier);
      return;
    }

    if (player.weapon === 'grenade_launcher') {
      const grenadeId = generateId();
      const speed = weaponData.projectileSpeed;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.physicsWorld.addGrenade(grenadeId, playerId, spawnX, spawnY, vx, vy);
      this.grenades.push({
        id: grenadeId,
        ownerId: playerId,
        position: { x: spawnX, y: spawnY },
        velocity: { x: vx, y: vy },
        fuseTimer: GAME_CONSTANTS.GRENADE_FUSE_TIME,
        createdAt: Date.now(),
      });
      return;
    }

    if (player.weapon === 'shotgun') {
      for (let i = 0; i < weaponData.pellets; i++) {
        const pelletAngle = angle + (Math.random() - 0.5) * weaponData.spread;
        const speed = weaponData.projectileSpeed;
        this.projectiles.push({
          id: generateId(),
          ownerId: playerId,
          position: { x: spawnX, y: spawnY },
          velocity: { x: Math.cos(pelletAngle) * speed, y: Math.sin(pelletAngle) * speed },
          weapon: player.weapon,
          damage: Math.round(weaponData.damage * damageMultiplier),
          createdAt: Date.now(),
        });
      }
    } else {
      const bulletAngle = angle + (Math.random() - 0.5) * weaponData.spread;
      const speed = weaponData.projectileSpeed;
      this.projectiles.push({
        id: generateId(),
        ownerId: playerId,
        position: { x: spawnX, y: spawnY },
        velocity: { x: Math.cos(bulletAngle) * speed, y: Math.sin(bulletAngle) * speed },
        weapon: player.weapon,
        damage: Math.round(weaponData.damage * damageMultiplier),
        createdAt: Date.now(),
      });
    }
  }

  private meleeAttack(playerId: string, spawnX: number, spawnY: number, angle: number, damageMultiplier: number) {
    const weaponData = WEAPONS['melee'];
    const range = weaponData.range;

    this.players.forEach((target, targetId) => {
      if (!target.isAlive || targetId === playerId) return;
      const dist = distance({ x: spawnX, y: spawnY }, target.position);
      if (dist <= range) {
        const dir = normalize({ x: target.position.x - spawnX, y: target.position.y - spawnY });
        const dot = dir.x * Math.cos(angle) + dir.y * Math.sin(angle);
        if (dot > 0.5) {
          const damage = Math.round(weaponData.damage * damageMultiplier);
          this.damagePlayer(targetId, damage, playerId, 'melee');
          this.applyKnockback(targetId, playerId, weaponData.knockback);
        }
      }
    });
  }

  private throwGrenade(playerId: string) {
    const player = this.players.get(playerId);
    if (!player || player.grenades <= 0) return;

    player.grenades--;

    const angle = player.aimAngle;
    const spawnOffset = 30;
    const spawnX = player.position.x + Math.cos(angle) * spawnOffset;
    const spawnY = player.position.y + Math.sin(angle) * spawnOffset;

    const speed = GAME_CONSTANTS.GRENADE_SPEED;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const grenadeId = generateId();
    this.physicsWorld.addGrenade(grenadeId, playerId, spawnX, spawnY, vx, vy);

    this.grenades.push({
      id: grenadeId,
      ownerId: playerId,
      position: { x: spawnX, y: spawnY },
      velocity: { x: vx, y: vy },
      fuseTimer: GAME_CONSTANTS.GRENADE_FUSE_TIME,
      createdAt: Date.now(),
    });
  }

  public tick() {
    this.tickCount++;

    this.physicsWorld.step(1 / 60);

    this.playerShootCooldowns.forEach((cooldown, playerId) => {
      if (cooldown > 0) {
        this.playerShootCooldowns.set(playerId, cooldown - 1);
      }
    });

    this.players.forEach((player, playerId) => {
      if (!player.isAlive) {
        let timer = this.playerRespawnTimers.get(playerId) || 0;
        if (timer > 0) {
          timer--;
          this.playerRespawnTimers.set(playerId, timer);
          if (timer <= 0) {
            this.respawnPlayer(playerId);
          }
        }
        return;
      }

      const pPos = this.physicsWorld.getPlayerPosition(playerId);
      const pVel = this.physicsWorld.getPlayerVelocity(playerId);

      if (pPos && pVel) {
        player.position = pPos;
        player.velocity = pVel;
      }

      if (player.position.y > GAME_CONSTANTS.MAP_HEIGHT + 200) {
        this.damagePlayer(playerId, 9999, 'environment');
      }
    });

    this.updateGrenades();
    this.updateProjectiles();
    this.updateBoxState();
    this.spawnPowerUps();

    if (this.tickCount % 60 === 0 && this.timeRemaining > 0) {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.isFinished = true;
      }
    }
  }

  private updateGrenades() {
    const activeGrenades: GrenadeState[] = [];

    this.grenades.forEach((grenade) => {
      const gPos = this.physicsWorld.getGrenadePosition(grenade.id);
      const gVel = this.physicsWorld.getGrenadeVelocity(grenade.id);

      if (gPos && gVel) {
        grenade.position = gPos;
        grenade.velocity = gVel;
      }

      grenade.fuseTimer -= 1 / 60;
      if (grenade.fuseTimer <= 0) {
        this.explodeGrenade(grenade);
      } else {
        activeGrenades.push(grenade);
      }
    });

    this.grenades = activeGrenades;
  }

  private explodeGrenade(grenade: GrenadeState) {
    const explosionPos = grenade.position;
    const radius = GAME_CONSTANTS.GRENADE_EXPLOSION_RADIUS;
    const maxDamage = GAME_CONSTANTS.GRENADE_DAMAGE;

    this.players.forEach((player, playerId) => {
      if (!player.isAlive) return;

      const dist = distance(player.position, explosionPos);
      if (dist <= radius) {
        const falloff = 1 - (dist / radius);
        const damage = Math.round(maxDamage * falloff);

        this.applyKnockback(playerId, grenade.ownerId, 20, explosionPos);
        this.damagePlayer(playerId, damage, grenade.ownerId, 'rocket_launcher');
      }
    });

    this.damageBoxAtPosition(explosionPos, radius, 80);

    this.physicsWorld.removeGrenade(grenade.id);
  }

  private updateProjectiles() {
    const activeProjectiles: ProjectileState[] = [];

    this.projectiles.forEach((proj) => {
      const oldPos = { ...proj.position };
      const dt = 1 / 60;
      proj.position.x += proj.velocity.x * dt;
      proj.position.y += proj.velocity.y * dt;

      let collided = false;

      for (const [playerId, player] of this.players.entries()) {
        if (!player.isAlive || playerId === proj.ownerId) continue;

        const halfW = GAME_CONSTANTS.PLAYER_WIDTH / 2;
        const halfH = GAME_CONSTANTS.PLAYER_HEIGHT / 2;
        const boxMin = { x: player.position.x - halfW, y: player.position.y - halfH };
        const boxMax = { x: player.position.x + halfW, y: player.position.y + halfH };

        if (intersectSegmentBox(oldPos, proj.position, boxMin, boxMax)) {
          this.damagePlayer(playerId, proj.damage, proj.ownerId, proj.weapon);
          this.applyKnockback(playerId, proj.ownerId, WEAPONS[proj.weapon]?.knockback || 0);
          collided = true;
          break;
        }
      }

      if (collided) {
        if (proj.weapon === 'rocket_launcher') {
          this.triggerRocketExplosion(proj.position, proj.ownerId);
        }
        return;
      }

      if (this.mapData) {
        for (const platform of this.mapData.platforms) {
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
          this.triggerRocketExplosion(proj.position, proj.ownerId);
        }
        return;
      }

      for (const box of this.boxes) {
        if (box.isDestroyed) continue;
        const boxMin = { x: box.x, y: box.y };
        const boxMax = { x: box.x + box.width, y: box.y + box.height };
        if (intersectSegmentBox(oldPos, proj.position, boxMin, boxMax)) {
          this.damageBox(box.id, proj.damage);
          if (proj.weapon === 'rocket_launcher') {
            this.triggerRocketExplosion(proj.position, proj.ownerId);
          }
          collided = true;
          break;
        }
      }

      if (collided) return;

      const limitRange = WEAPONS[proj.weapon]?.range || 1000;
      const traveled = distance(oldPos, proj.position);
      if (traveled > limitRange) return;

      if (proj.position.x < -200 || proj.position.x > GAME_CONSTANTS.MAP_WIDTH + 200 ||
          proj.position.y < -200 || proj.position.y > GAME_CONSTANTS.MAP_HEIGHT + 200) {
        if (proj.weapon === 'rocket_launcher') {
          this.triggerRocketExplosion(proj.position, proj.ownerId);
        }
        return;
      }

      activeProjectiles.push(proj);
    });

    this.projectiles = activeProjectiles;
  }

  private triggerRocketExplosion(explosionPos: Vector2, ownerId: string) {
    const weaponData = WEAPONS.rocket_launcher;
    const radius = weaponData.explosionRadius;
    const maxDamage = weaponData.damage;

    this.players.forEach((player, playerId) => {
      if (!player.isAlive) return;

      const dist = distance(player.position, explosionPos);
      if (dist <= radius) {
        const falloff = 1 - (dist / radius);
        const damage = Math.round(maxDamage * falloff);

        this.applyKnockback(playerId, ownerId, 25, explosionPos);
        this.damagePlayer(playerId, damage, ownerId, 'rocket_launcher');
      }
    });

    this.damageBoxAtPosition(explosionPos, radius, 60);
  }

  private applyKnockback(targetId: string, attackerId: string, knockbackForce: number, sourcePos?: Vector2) {
    const target = this.players.get(targetId);
    const body = this.playerBodies.get(targetId);
    if (!target || !body || !target.isAlive) return;

    let dir: Vector2;
    if (sourcePos) {
      dir = normalize({ x: target.position.x - sourcePos.x, y: target.position.y - sourcePos.y });
    } else {
      const attacker = this.players.get(attackerId);
      if (!attacker) return;
      dir = normalize({ x: target.position.x - attacker.position.x, y: target.position.y - attacker.position.y });
    }

    const shieldActive = this.activePowerUps.get(targetId)?.has('shield');
    const multiplier = shieldActive ? 0.3 : 1;
    const impulseStrength = knockbackForce * GAME_CONSTANTS.KNOCKBACK_SCALE * body.getMass() * multiplier;

    body.applyLinearImpulse(
      planck.Vec2(dir.x * impulseStrength, -dir.y * impulseStrength),
      body.getWorldCenter(),
      true
    );
  }

  private damageBox(boxId: string, damage: number) {
    const box = this.boxes.find((b) => b.id === boxId);
    if (!box || box.isDestroyed) return;

    box.health -= damage;
    if (box.health <= 0) {
      box.health = 0;
      box.isDestroyed = true;
      this.physicsWorld.removeBox(boxId);
    }
  }

  private damageBoxAtPosition(pos: Vector2, radius: number, damage: number) {
    for (const box of this.boxes) {
      if (box.isDestroyed) continue;
      const boxCenter = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
      const dist = distance(pos, boxCenter);
      if (dist <= radius + Math.max(box.width, box.height) / 2) {
        const falloff = 1 - (dist / (radius + Math.max(box.width, box.height) / 2));
        this.damageBox(box.id, Math.round(damage * falloff));
      }
    }
  }

  private updateBoxState() {
    if (this.mapData) {
      for (const box of this.boxes) {
        if (!box.isDestroyed) {
          const physHealth = this.physicsWorld.getBoxHealth(box.id);
          if (physHealth !== null && physHealth !== box.health) {
            box.health = physHealth;
            if (box.health <= 0) {
              box.isDestroyed = true;
            }
          }
        }
      }
    }
  }

  private spawnPowerUps() {
    this.powerUpSpawnTimer++;
    if (this.powerUpSpawnTimer < GAME_CONSTANTS.POWER_UP_SPAWN_INTERVAL * 60) return;
    if (this.powerUps.filter((p) => p.active).length >= GAME_CONSTANTS.POWER_UP_MAX_ACTIVE) return;

    this.powerUpSpawnTimer = 0;

    if (!this.mapData || this.mapData.spawnPoints.length === 0) return;

    const spawn = this.mapData.spawnPoints[Math.floor(Math.random() * this.mapData.spawnPoints.length)];
    const types: PowerUpType[] = ['health', 'speed', 'damage', 'shield', 'jetpack_fuel'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWER_UP_CONFIG[type];

    this.nextPowerUpId++;
    this.powerUps.push({
      id: `pu_${this.nextPowerUpId}`,
      type,
      position: { x: spawn.x, y: spawn.y - 30 },
      active: true,
      duration: config.duration,
      magnitude: config.magnitude,
    });
  }

  private checkPowerUpPickup(playerId: string) {
    const player = this.players.get(playerId);
    if (!player || !player.isAlive) return;

    for (const powerUp of this.powerUps) {
      if (!powerUp.active) continue;
      const dist = distance(player.position, powerUp.position);
      if (dist <= GAME_CONSTANTS.POWER_UP_PICKUP_RADIUS) {
        powerUp.active = false;
        this.applyPowerUp(playerId, powerUp);
      }
    }
  }

  private applyPowerUp(playerId: string, powerUp: PowerUpState) {
    const player = this.players.get(playerId);
    if (!player) return;

    const pows = this.activePowerUps.get(playerId);
    if (!pows) return;

    if (powerUp.type === 'health') {
      player.health = Math.min(player.maxHealth, player.health + POWER_UP_CONFIG.health.magnitude);
      return;
    }

    if (powerUp.type === 'jetpack_fuel') {
      player.jetpackFuel = Math.min(GAME_CONSTANTS.JETPACK_MAX_FUEL, player.jetpackFuel + POWER_UP_CONFIG.jetpack_fuel.magnitude);
      return;
    }

    if (powerUp.type === 'shield') {
      player.maxHealth = GAME_CONSTANTS.MAX_HEALTH * 2;
      player.health = Math.min(player.health + GAME_CONSTANTS.MAX_HEALTH, player.maxHealth);
    }

    pows.set(powerUp.type, powerUp.duration);
  }

  private applyPowerUpEnd(playerId: string, type: PowerUpType) {
    const player = this.players.get(playerId);
    if (!player) return;

    if (type === 'shield') {
      player.maxHealth = GAME_CONSTANTS.MAX_HEALTH;
      player.health = Math.min(player.health, player.maxHealth);
    }
  }

  private damagePlayer(playerId: string, amount: number, attackerId: string, weapon?: WeaponType) {
    const player = this.players.get(playerId);
    if (!player || !player.isAlive) return;

    let finalDamage = amount;
    if (weapon) {
      const weaponData = WEAPONS[weapon];
      if (weaponData?.damageType === 'energy') {
        finalDamage = Math.round(amount * 0.7);
      }
    }

    const shieldActive = this.activePowerUps.get(playerId)?.has('shield');
    if (shieldActive) {
      finalDamage = Math.round(finalDamage * POWER_UP_CONFIG.shield.magnitude);
    }

    player.health = Math.max(0, player.health - finalDamage);
    if (player.health <= 0) {
      this.killPlayer(playerId, attackerId, weapon || 'assault_rifle');
    }
  }

  private killPlayer(victimId: string, killerId: string, weapon: WeaponType) {
    const victim = this.players.get(victimId);
    if (!victim || !victim.isAlive) return;

    victim.isAlive = false;
    victim.deaths++;
    victim.health = 0;

    this.physicsWorld.removePlayer(victimId);
    this.playerBodies.delete(victimId);

    this.playerRespawnTimers.set(victimId, 180);

    let killerName = 'Environment';
    const killer = this.players.get(killerId);
    if (killer && killerId !== victimId) {
      killer.kills++;
      killerName = killer.username;
      
      if (this.onKillCallback) {
        this.onKillCallback(killerId, killerName, victimId, victim.username, weapon);
      }
    } else {
      if (this.onKillCallback) {
        this.onKillCallback('environment', 'Environment', victimId, victim.username, weapon);
      }
    }

    if (this.onDeathCallback) {
      this.onDeathCallback(victimId);
    }

    this.killFeed.push({
      killerId: killerId === victimId ? 'environment' : killerId,
      killerName,
      victimId,
      victimName: victim.username,
      weapon,
      timestamp: Date.now(),
    });

    if (this.killFeed.length > 5) {
      this.killFeed.shift();
    }
  }

  private respawnPlayer(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    const spawn = this.getRandomSpawnPoint();
    const body = this.physicsWorld.addPlayer(playerId, spawn.x, spawn.y);
    this.playerBodies.set(playerId, body);

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

    this.playerRespawnTimers.delete(playerId);
    this.playerShootCooldowns.set(playerId, 0);
    this.activePowerUps.set(playerId, new Map());

    if (this.onRespawnCallback) {
      this.onRespawnCallback(playerId, spawn);
    }
  }

  private getRandomSpawnPoint(): Vector2 {
    if (this.mapData && this.mapData.spawnPoints.length > 0) {
      const idx = Math.floor(Math.random() * this.mapData.spawnPoints.length);
      return this.mapData.spawnPoints[idx];
    }
    return { x: 1500, y: 300 };
  }

  public getSerializableState(): any {
    const playersObj: Record<string, any> = {};
    this.players.forEach((p, id) => {
      playersObj[id] = { ...p };
    });

    const movingPlatforms: MovingPlatformState[] = this.physicsWorld.getMovingPlatformsState().map((mp) => ({
      id: mp.id,
      position: mp.position,
      width: 150,
      height: 20,
    }));

    return {
      matchId: this.matchId,
      players: playersObj,
      projectiles: this.projectiles,
      grenades: this.grenades,
      boxes: this.boxes,
      powerUps: this.powerUps.filter((p) => p.active),
      movingPlatforms,
      mapData: this.mapData ? {
        id: this.mapData.id,
        name: this.mapData.name,
        width: this.mapData.width,
        height: this.mapData.height,
        platforms: this.mapData.platforms,
        spawnPoints: this.mapData.spawnPoints,
        jumpPads: this.mapData.jumpPads,
        movingPlatforms: this.mapData.movingPlatforms,
        boxes: this.mapData.boxes,
      } : null,
      tick: this.tickCount,
      startTime: this.startTime,
      timeRemaining: this.timeRemaining,
      mapId: this.mapData?.id || 'default',
      mode: 'deathmatch',
    };
  }

  public clear() {
    this.physicsWorld.clear();
    this.players.clear();
    this.playerBodies.clear();
    this.playerShootCooldowns.clear();
    this.playerRespawnTimers.clear();
    this.activePowerUps.clear();
    this.projectiles = [];
    this.grenades = [];
    this.boxes = [];
    this.powerUps = [];
    this.killFeed = [];
  }
}
