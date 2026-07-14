import { 
  GAME_CONSTANTS, 
  WEAPONS, 
  Vector2, 
  PlayerState, 
  ProjectileState, 
  GrenadeState, 
  GameState, 
  PlayerInput, 
  MapData, 
  WeaponType, 
  KillFeedEntry,
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

  // X axis
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

  // Y axis
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
  
  private playerBodies = new Map<string, planck.Body>();
  private playerShootCooldowns = new Map<string, number>(); // in ticks
  private playerRespawnTimers = new Map<string, number>(); // in ticks
  
  public tickCount = 0;
  public matchId: string;
  public startTime: number;
  public timeRemaining: number; // in seconds
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
  }

  public addPlayer(playerId: string, username: string, avatar: string) {
    const spawn = this.getRandomSpawnPoint();
    const body = this.physicsWorld.addPlayer(playerId, spawn.x, spawn.y);
    this.playerBodies.set(playerId, body);

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
      lastInputTick: 0
    };

    this.players.set(playerId, playerState);
    this.playerShootCooldowns.set(playerId, 0);
  }

  public removePlayer(playerId: string) {
    this.players.delete(playerId);
    this.playerBodies.delete(playerId);
    this.physicsWorld.removePlayer(playerId);
    this.playerShootCooldowns.delete(playerId);
    this.playerRespawnTimers.delete(playerId);
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

    // 1. Aim Angle
    player.aimAngle = Math.atan2(input.aimY, input.aimX);

    // 2. Walk Movement (Horizontal)
    const isGrounded = this.physicsWorld.isPlayerGrounded(playerId);
    const currentVel = body.getLinearVelocity();
    
    let walkSpeed = GAME_CONSTANTS.PLAYER_SPEED;
    // Check if sprinting (if walking same direction and player input indicates sprint speed, or we can just stick to default speed)
    // Let's use simple walk speed
    const targetVx = input.moveX * walkSpeed;
    
    // Set horizontal velocity directly to make platforming feel crisp
    this.physicsWorld.setPlayerVelocity(playerId, targetVx, -currentVel.y * 30); // maintain gravity/jump Y velocity

    // 3. Jump
    if (input.moveY < -0.5 && isGrounded) {
      this.physicsWorld.setPlayerVelocity(
        playerId,
        targetVx,
        GAME_CONSTANTS.JUMP_FORCE
      );
    }

    // 4. Jetpack
    player.jetpackActive = input.jetpack;
    if (input.jetpack) {
      // In Phase 1, fuel is infinite, so we don't drain fuel, but we apply steady upward force/velocity
      const jetpackForceY = GAME_CONSTANTS.JETPACK_FORCE;
      
      // Apply upward force center (combatting gravity which is negative)
      // Since Planck gravity is -12 m/s2 (about -360 px/s2), we need an upward force that accelerates player upward.
      // Alternatively, we can just add upward velocity directly or apply an upward force:
      const mass = body.getMass();
      // gravity acceleration is 12 m/s2 downwards. Let's apply upward acceleration of 22 m/s2 so they rise at 10 m/s2.
      body.applyForceToCenter(planck.Vec2(0, 22 * mass), true);
    }

    // 5. Weapon Switch
    if (input.switchWeapon && input.switchWeapon !== player.weapon) {
      player.weapon = input.switchWeapon;
      this.playerShootCooldowns.set(playerId, 10); // small delay when switching
    }

    // 6. Shooting
    const cooldown = this.playerShootCooldowns.get(playerId) || 0;
    if (input.shoot && cooldown <= 0) {
      this.fireWeapon(playerId);
    }

    // 7. Grenade
    if (input.grenade && player.grenades > 0) {
      // In Phase 1 grenade throw speed is fixed, let's limit grenade rate
      // Let's check cooldown or throw
      this.throwGrenade(playerId);
    }
  }

  private fireWeapon(playerId: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    const weaponData = WEAPONS[player.weapon];
    if (!weaponData) return;

    // Reset cooldown (60 ticks per second)
    const cooldownTicks = Math.ceil(60 / weaponData.fireRate);
    this.playerShootCooldowns.set(playerId, cooldownTicks);

    const gunBarrelOffset = 25; // distance from center of player to barrel
    const angle = player.aimAngle;
    const spawnX = player.position.x + Math.cos(angle) * gunBarrelOffset;
    const spawnY = player.position.y + Math.sin(angle) * gunBarrelOffset;

    if (player.weapon === 'shotgun') {
      // Shotgun fires multiple pellets
      for (let i = 0; i < weaponData.pellets; i++) {
        // Spread is randomized angle
        const pelletAngle = angle + (Math.random() - 0.5) * weaponData.spread;
        const speed = weaponData.projectileSpeed;
        const vx = Math.cos(pelletAngle) * speed;
        const vy = Math.sin(pelletAngle) * speed;

        this.projectiles.push({
          id: generateId(),
          ownerId: playerId,
          position: { x: spawnX, y: spawnY },
          velocity: { x: vx, y: vy },
          weapon: player.weapon,
          damage: weaponData.damage,
          createdAt: Date.now()
        });
      }
    } else {
      // Normal bullet (AR, Sniper, Rocket)
      const bulletAngle = angle + (Math.random() - 0.5) * weaponData.spread;
      const speed = weaponData.projectileSpeed;
      const vx = Math.cos(bulletAngle) * speed;
      const vy = Math.sin(bulletAngle) * speed;

      this.projectiles.push({
        id: generateId(),
        ownerId: playerId,
        position: { x: spawnX, y: spawnY },
        velocity: { x: vx, y: vy },
        weapon: player.weapon,
        damage: weaponData.damage,
        createdAt: Date.now()
      });
    }
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
    
    // Spawn in physics world
    this.physicsWorld.addGrenade(grenadeId, playerId, spawnX, spawnY, vx, vy);

    this.grenades.push({
      id: grenadeId,
      ownerId: playerId,
      position: { x: spawnX, y: spawnY },
      velocity: { x: vx, y: vy },
      fuseTimer: GAME_CONSTANTS.GRENADE_FUSE_TIME,
      createdAt: Date.now()
    });
  }

  public tick() {
    this.tickCount++;

    // 1. Step physics
    // Standard delta time is 1/60th of a second (16.67ms)
    this.physicsWorld.step(1 / 60);

    // 2. Decrement shoot cooldowns
    this.playerShootCooldowns.forEach((cooldown, playerId) => {
      if (cooldown > 0) {
        this.playerShootCooldowns.set(playerId, cooldown - 1);
      }
    });

    // 3. Update player positions/velocities from physics bodies
    this.players.forEach((player, playerId) => {
      if (!player.isAlive) {
        // Handle respawn timer
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

      // Check map boundary death (falling out of map)
      // Map height is 1600px. Standard top is 0, bottom is 1600.
      // If player y goes below bottom limit (e.g. y > 1800), they die!
      if (player.position.y > GAME_CONSTANTS.MAP_HEIGHT + 200) {
        this.damagePlayer(playerId, 9999, 'environment');
      }
    });

    // 4. Update and step Grenades
    this.updateGrenades();

    // 5. Update and collide Projectiles
    this.updateProjectiles();

    // 6. Update moving platforms position (already handled in physicsWorld.step)

    // 7. Decrement match timer (every 60 ticks is 1 second)
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
      const gBody = this.physicsWorld.getGrenadeBody(grenade.id);
      if (!gBody) return;

      const gPos = this.physicsWorld.getGrenadePosition(grenade.id);
      const gVel = this.physicsWorld.getGrenadeVelocity(grenade.id);

      if (gPos && gVel) {
        grenade.position = gPos;
        grenade.velocity = gVel;
      }

      // Decrement fuse timer
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

    // Apply damage to players in radius
    this.players.forEach((player, playerId) => {
      if (!player.isAlive) return;

      const dist = distance(player.position, explosionPos);
      if (dist <= radius) {
        const falloff = 1 - (dist / radius);
        const damage = Math.round(maxDamage * falloff);

        // Apply physical pushback
        const body = this.playerBodies.get(playerId);
        if (body && dist > 1) {
          const dir = normalize({
            x: player.position.x - explosionPos.x,
            y: player.position.y - explosionPos.y
          });
          // Apply impulse (standard screen coordinate mapping inverted in physics)
          const impulseStrength = falloff * 20.0 * body.getMass();
          body.applyLinearImpulse(
            planck.Vec2(dir.x * impulseStrength, -dir.y * impulseStrength),
            body.getWorldCenter(),
            true
          );
        }

        this.damagePlayer(playerId, damage, grenade.ownerId, 'rocket_launcher'); // treat grenade explosion similar to rocket explosion
      }
    });

    // Remove from physics world
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

      // 1. Collide with players
      for (const [playerId, player] of this.players.entries()) {
        if (!player.isAlive || playerId === proj.ownerId) continue;

        // Player AABB box dimensions
        const halfW = GAME_CONSTANTS.PLAYER_WIDTH / 2;
        const halfH = GAME_CONSTANTS.PLAYER_HEIGHT / 2;
        const boxMin = { x: player.position.x - halfW, y: player.position.y - halfH };
        const boxMax = { x: player.position.x + halfW, y: player.position.y + halfH };

        if (intersectSegmentBox(oldPos, proj.position, boxMin, boxMax)) {
          this.damagePlayer(playerId, proj.damage, proj.ownerId, proj.weapon);
          collided = true;
          break;
        }
      }

      if (collided) {
        if (proj.weapon === 'rocket_launcher') {
          this.triggerRocketExplosion(proj.position, proj.ownerId);
        }
        return; // Destroy projectile
      }

      // 2. Collide with map platforms
      if (this.mapData) {
        for (const platform of this.mapData.platforms) {
          // If it's a one-way platform, projectiles fly right through!
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
        return; // Destroy projectile
      }

      // 3. Collide with boundary or range limit
      const startDist = distance(oldPos, proj.position); // approximate
      const limitRange = WEAPONS[proj.weapon]?.range || 1000;
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

        const body = this.playerBodies.get(playerId);
        if (body && dist > 1) {
          const dir = normalize({
            x: player.position.x - explosionPos.x,
            y: player.position.y - explosionPos.y
          });
          // Apply outward impulse
          const impulseStrength = falloff * 25.0 * body.getMass();
          body.applyLinearImpulse(
            planck.Vec2(dir.x * impulseStrength, -dir.y * impulseStrength),
            body.getWorldCenter(),
            true
          );
        }

        this.damagePlayer(playerId, damage, ownerId, 'rocket_launcher');
      }
    });
  }

  private damagePlayer(playerId: string, amount: number, attackerId: string, weapon?: WeaponType) {
    const player = this.players.get(playerId);
    if (!player || !player.isAlive) return;

    player.health = Math.max(0, player.health - amount);
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

    // Remove physics body
    this.physicsWorld.removePlayer(victimId);
    this.playerBodies.delete(victimId);

    // Set respawn timer (3 seconds = 180 ticks)
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

    // Add to local kill feed
    this.killFeed.push({
      killerId: killerId === victimId ? 'environment' : killerId,
      killerName,
      victimId,
      victimName: victim.username,
      weapon,
      timestamp: Date.now()
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

    player.position = { x: spawn.x, y: spawn.y };
    player.velocity = { x: 0, y: 0 };
    player.health = GAME_CONSTANTS.MAX_HEALTH;
    player.isAlive = true;
    player.grenades = GAME_CONSTANTS.MAX_GRENADES;

    this.playerRespawnTimers.delete(playerId);
    this.playerShootCooldowns.set(playerId, 0);

    if (this.onRespawnCallback) {
      this.onRespawnCallback(playerId, spawn);
    }
  }

  private getRandomSpawnPoint(): Vector2 {
    if (this.mapData && this.mapData.spawnPoints.length > 0) {
      const idx = Math.floor(Math.random() * this.mapData.spawnPoints.length);
      return this.mapData.spawnPoints[idx];
    }
    // Fallback default spawn
    return { x: 1500, y: 300 };
  }

  public getSerializableState(): any {
    const playersObj: Record<string, any> = {};
    this.players.forEach((p, id) => {
      playersObj[id] = {
        ...p,
        // Ensure no Map types exist
      };
    });

    return {
      matchId: this.matchId,
      players: playersObj,
      projectiles: this.projectiles,
      grenades: this.grenades,
      tick: this.tickCount,
      startTime: this.startTime,
      timeRemaining: this.timeRemaining,
      mapId: this.mapData?.id || 'default',
      mode: 'deathmatch'
    };
  }

  public clear() {
    this.physicsWorld.clear();
    this.players.clear();
    this.playerBodies.clear();
    this.playerShootCooldowns.clear();
    this.playerRespawnTimers.clear();
    this.projectiles = [];
    this.grenades = [];
    this.killFeed = [];
  }
}
