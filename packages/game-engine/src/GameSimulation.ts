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
  intersectSegmentBox,
} from '@battle-jets/shared';
import { PhysicsWorld } from '@battle-jets/physics';
import planck from 'planck-js';
import {
  CombatState,
  startReload,
  fireWeapon,
  applyKnockback,
  damagePlayer,
  killPlayer,
} from './combat';
import {
  ProjectileWorld,
  updateProjectiles,
  triggerRocketExplosion,
} from './projectile';
import {
  GrenadeWorld,
  throwGrenade,
  updateGrenades,
  explodeGrenade,
} from './grenade';
import {
  PowerUpWorld,
  spawnPowerUp,
  checkPowerUpPickup,
  applyPowerUp,
  applyPowerUpEnd,
  tickPowerUpTimers,
} from './powerup';
import {
  LifecycleWorld,
  respawnPlayer,
  addPlayer as lifecycleAddPlayer,
  removePlayer as lifecycleRemovePlayer,
  damageBox,
  damageBoxAtPosition,
  updateBoxState,
  getMovingPlatformsState,
} from './lifecycle';

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

  private powerUpSpawnTimer = { value: 0 };
  private nextPowerUpId = { value: 0 };

  public tickCount = 0;
  public matchId: string;
  public startTime: number;
  public timeRemaining: number;
  public isFinished = false;
  public killFeed: KillFeedEntry[] = [];

  private onKillCallback?: (
    killerId: string,
    killerName: string,
    victimId: string,
    victimName: string,
    weapon: WeaponType,
  ) => void;
  private onDeathCallback?: (playerId: string) => void;
  private onRespawnCallback?: (playerId: string, pos: Vector2) => void;

  constructor(matchId: string, mapData: MapData) {
    this.matchId = matchId;
    this.physicsWorld = new PhysicsWorld();
    this.loadMap(mapData);
    this.startTime = Date.now();
    this.timeRemaining = GAME_CONSTANTS.MATCH_DURATION;
  }

  private get combatState(): CombatState {
    return {
      players: this.players,
      playerBodies: this.playerBodies,
      playerShootCooldowns: this.playerShootCooldowns,
      activePowerUps: this.activePowerUps,
      physicsWorld: this.physicsWorld,
      killFeed: this.killFeed,
    };
  }

  private get projectileWorld(): ProjectileWorld {
    return {
      players: this.players,
      projectiles: this.projectiles,
      boxes: this.boxes,
      mapData: this.mapData,
    };
  }

  private get grenadeWorld(): GrenadeWorld {
    return {
      players: this.players,
      grenades: this.grenades,
      physicsWorld: this.physicsWorld,
    };
  }

  private get powerUpWorld(): PowerUpWorld {
    return {
      players: this.players,
      powerUps: this.powerUps,
      activePowerUps: this.activePowerUps,
      mapData: this.mapData,
    };
  }

  private get lifecycleWorld(): LifecycleWorld {
    return {
      players: this.players,
      playerBodies: this.playerBodies,
      playerRespawnTimers: this.playerRespawnTimers,
      playerShootCooldowns: this.playerShootCooldowns,
      activePowerUps: this.activePowerUps,
      boxes: this.boxes,
      physicsWorld: this.physicsWorld,
      mapData: this.mapData,
    };
  }

  private handleDamageBox = (boxId: string, dmg: number) => {
    damageBox(this.boxes, this.physicsWorld, boxId, dmg);
  };

  private handleDamageBoxAt = (pos: Vector2, radius: number, dmg: number) => {
    damageBoxAtPosition(this.boxes, this.physicsWorld, pos, radius, dmg);
  };

  private handleKnockback = (targetId: string, attackerId: string, knockback: number, sourcePos?: Vector2) => {
    applyKnockback(this.combatState, targetId, attackerId, knockback, sourcePos);
  };

  private handleDamage = (playerId: string, amount: number, attackerId: string, weapon?: WeaponType) => {
    const died = damagePlayer(this.combatState, playerId, amount, attackerId, weapon);
    if (died) {
      killPlayer(this.combatState, playerId, attackerId, weapon || 'assault_rifle');
      if (this.onKillCallback) {
        const killer = this.players.get(attackerId);
        const victim = this.players.get(playerId);
        if (killer && attackerId !== playerId) {
          this.onKillCallback(attackerId, killer.username, playerId, victim?.username || '', weapon || 'assault_rifle');
        } else {
          this.onKillCallback('environment', 'Environment', playerId, victim?.username || '', weapon || 'assault_rifle');
        }
      }
      if (this.onDeathCallback) {
        this.onDeathCallback(playerId);
      }
      const respawnTicks = Math.ceil((GAME_CONSTANTS.RESPAWN_TIME / 1000) * 60);
      this.playerRespawnTimers.set(playerId, respawnTicks);
    }
  };

  private handleRocketExplosion = (pos: Vector2, ownerId: string) => {
    triggerRocketExplosion(this.players, pos, ownerId, {
      onKnockback: this.handleKnockback,
      onDamage: this.handleDamage,
      onBoxDamageAt: this.handleDamageBoxAt,
    });
  };

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

  public addPlayer(playerId: string, username: string, avatar: string): boolean {
    return lifecycleAddPlayer(this.lifecycleWorld, playerId, username, avatar);
  }

  public removePlayer(playerId: string) {
    lifecycleRemovePlayer(this.lifecycleWorld, playerId);
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

    if (player.isReloading) {
      player.reloadTimer -= 1 / 60;
      if (player.reloadTimer <= 0) {
        player.isReloading = false;
        player.ammo = player.maxAmmo;
      }
    }

    const expired = tickPowerUpTimers(this.powerUpWorld, playerId);
    for (const type of expired) {
      applyPowerUpEnd(player, type);
    }

    player.aimAngle = Math.atan2(input.aimY, input.aimX);

    const currentVel = body.getLinearVelocity();
    let walkSpeed = GAME_CONSTANTS.PLAYER_SPEED;
    const pows = this.activePowerUps.get(playerId);
    if (pows?.has('speed')) {
      walkSpeed *= POWER_UP_CONFIG.speed.magnitude;
    }
    const targetVx = input.moveX * walkSpeed;
    this.physicsWorld.setPlayerVelocity(playerId, targetVx, -currentVel.y * 30);

    const isGrounded = this.physicsWorld.isPlayerGrounded(playerId);
    if (input.moveY < -0.5 && isGrounded) {
      this.physicsWorld.setPlayerVelocity(playerId, targetVx, GAME_CONSTANTS.JUMP_FORCE);
    }

    player.jetpackActive = input.jetpack;
    if (input.jetpack && player.jetpackFuel > 0) {
      const mass = body.getMass();
      body.applyForceToCenter(planck.Vec2(0, 22 * mass), true);
      player.jetpackFuel = Math.max(0, player.jetpackFuel - GAME_CONSTANTS.JETPACK_FUEL_DRAIN / 60);
    } else if (!input.jetpack) {
      player.jetpackFuel = Math.min(
        GAME_CONSTANTS.JETPACK_MAX_FUEL,
        player.jetpackFuel + GAME_CONSTANTS.JETPACK_FUEL_REGEN / 60,
      );
    }

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

    const cooldown = this.playerShootCooldowns.get(playerId) || 0;
    if (input.shoot && cooldown <= 0 && !player.isReloading) {
      if (player.ammo > 0 || player.weapon === 'melee') {
        const result = fireWeapon(this.combatState, playerId);
        for (const proj of result.projectiles) {
          this.projectiles.push(proj as any);
        }
        if (result.grenade) {
          this.physicsWorld.addGrenade(
            result.grenade.id,
            result.grenade.ownerId,
            result.grenade.position.x,
            result.grenade.position.y,
            result.grenade.velocity.x,
            result.grenade.velocity.y,
          );
          this.grenades.push(result.grenade as any);
        }
      } else {
        startReload(player);
      }
    }

    if (input.shoot && player.ammo <= 0 && !player.isReloading && player.weapon !== 'melee') {
      startReload(player);
    }

    if (input.grenade && player.grenades > 0) {
      const g = throwGrenade(this.grenadeWorld, playerId);
      if (g) {
        this.grenades.push(g as any);
      }
    }

    const pickedUp = checkPowerUpPickup(this.powerUpWorld, playerId);
    if (pickedUp) {
      const powsMap = this.activePowerUps.get(playerId);
      if (powsMap) {
        applyPowerUp(player, powsMap, pickedUp);
      }
    }
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
            const spawn = respawnPlayer(this.lifecycleWorld, playerId);
            if (spawn && this.onRespawnCallback) {
              this.onRespawnCallback(playerId, spawn);
            }
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
        this.handleDamage(playerId, 9999, 'environment');
      }
    });

    this.grenades = updateGrenades(this.grenadeWorld, {
      onExplode: (g) => explodeGrenade(this.grenadeWorld, g, {
        onKnockback: this.handleKnockback,
        onDamage: this.handleDamage,
        onBoxDamageAt: this.handleDamageBoxAt,
      }),
    }) as any;

    this.projectiles = updateProjectiles(this.projectileWorld, {
      onHitPlayer: this.handleDamage,
      onKnockback: this.handleKnockback,
      onRocketExplosion: this.handleRocketExplosion,
      onBoxDamage: this.handleDamageBox,
    }) as any;

    updateBoxState(this.boxes, this.physicsWorld, this.mapData);

    const newPowerUp = spawnPowerUp(this.powerUpWorld, this.powerUpSpawnTimer, this.nextPowerUpId);
    if (newPowerUp) {
      this.powerUps.push(newPowerUp);
    }

    if (this.tickCount % 60 === 0 && this.timeRemaining > 0) {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.isFinished = true;
      }
    }
  }

  public getSerializableState(): any {
    const playersObj: Record<string, any> = {};
    this.players.forEach((p, id) => {
      playersObj[id] = { ...p };
    });

    const movingPlatforms = getMovingPlatformsState(this.physicsWorld);

    return {
      matchId: this.matchId,
      players: playersObj,
      projectiles: this.projectiles,
      grenades: this.grenades,
      boxes: this.boxes,
      powerUps: this.powerUps.filter((p) => p.active),
      movingPlatforms,
      mapData: this.mapData
        ? {
            id: this.mapData.id,
            name: this.mapData.name,
            width: this.mapData.width,
            height: this.mapData.height,
            platforms: this.mapData.platforms,
            spawnPoints: this.mapData.spawnPoints,
            jumpPads: this.mapData.jumpPads,
            movingPlatforms: this.mapData.movingPlatforms,
            boxes: this.mapData.boxes,
          }
        : null,
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
