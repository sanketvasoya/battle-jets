import planck from 'planck-js';
import { 
  GAME_CONSTANTS, 
  Vector2, 
  Platform, 
  JumpPad, 
  MovingPlatform, 
  Box, 
  MapData 
} from '@battle-jets/shared';

export const PHYSICS_SCALE = 30; // 30 pixels = 1 meter

export class PhysicsWorld {
  public world: planck.World;
  private players = new Map<string, planck.Body>();
  private platforms = new Map<string, planck.Body>();
  private jumpPads = new Map<string, planck.Body>();
  private movingPlatformsList: { body: planck.Body; data: MovingPlatform; targetIndex: number; direction: number }[] = [];
  private boxes = new Map<string, planck.Body>();
  private grenades = new Map<string, planck.Body>();

  constructor() {
    // low gravity
    this.world = planck.World({
      gravity: planck.Vec2(0, GAME_CONSTANTS.GRAVITY_Y)
    });

    this.setupCollisionHandlers();
  }

  private setupCollisionHandlers() {
    this.world.on('pre-solve', (contact) => {
      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();
      const bodyA = fixtureA.getBody();
      const bodyB = fixtureB.getBody();
      const userDataA = bodyA.getUserData() as any;
      const userDataB = bodyB.getUserData() as any;

      if (!userDataA || !userDataB) return;

      // 1. One-way platforms handling
      let playerBody: planck.Body | null = null;
      let platformBody: planck.Body | null = null;
      let platformData: any = null;

      if (userDataA.type === 'player' && userDataB.type === 'one_way') {
        playerBody = bodyA;
        platformBody = bodyB;
        platformData = userDataB;
      } else if (userDataB.type === 'player' && userDataA.type === 'one_way') {
        playerBody = bodyB;
        platformBody = bodyA;
        platformData = userDataA;
      }

      if (playerBody && platformBody && platformData) {
        const playerPos = playerBody.getPosition();
        const platformPos = platformBody.getPosition();
        const playerHalfHeight = (GAME_CONSTANTS.PLAYER_HEIGHT / 2) / PHYSICS_SCALE;
        const platformHalfHeight = (platformData.height / 2) / PHYSICS_SCALE;

        const playerBottom = playerPos.y - playerHalfHeight;
        const platformTop = platformPos.y + platformHalfHeight;
        const playerVel = playerBody.getLinearVelocity();

        // If player is moving up or their bottom is below platform top (minus small threshold), disable collision
        if (playerVel.y > 0.05 || playerBottom < platformTop - 0.15) {
          contact.setEnabled(false);
        }
      }
    });

    this.world.on('begin-contact', (contact) => {
      const fixtureA = contact.getFixtureA();
      const fixtureB = contact.getFixtureB();
      const bodyA = fixtureA.getBody();
      const bodyB = fixtureB.getBody();
      const userDataA = bodyA.getUserData() as any;
      const userDataB = bodyB.getUserData() as any;

      if (!userDataA || !userDataB) return;

      // Jump Pad handling
      let playerBody: planck.Body | null = null;
      let jumpPadData: any = null;

      if (userDataA.type === 'player' && userDataB.type === 'jump_pad') {
        playerBody = bodyA;
        jumpPadData = userDataB;
      } else if (userDataB.type === 'player' && userDataA.type === 'jump_pad') {
        playerBody = bodyB;
        jumpPadData = userDataB;
      }

      if (playerBody && jumpPadData) {
        // Apply upward velocity impulse
        const force = jumpPadData.force || GAME_CONSTANTS.JUMP_FORCE;
        playerBody.setLinearVelocity(planck.Vec2(
          playerBody.getLinearVelocity().x,
          force / PHYSICS_SCALE
        ));
      }
    });
  }

  public loadMap(mapData: MapData) {
    // Clear existing
    this.clear();

    // 1. Platforms
    mapData.platforms.forEach((platform) => {
      const halfWidth = (platform.width / 2) / PHYSICS_SCALE;
      const halfHeight = (platform.height / 2) / PHYSICS_SCALE;
      const px = (platform.x + platform.width / 2) / PHYSICS_SCALE;
      const py = (GAME_CONSTANTS.MAP_HEIGHT - (platform.y + platform.height / 2)) / PHYSICS_SCALE;

      const body = this.world.createBody({
        type: 'static',
        position: planck.Vec2(px, py),
        userData: {
          id: platform.id,
          type: platform.type, // 'solid' or 'one_way'
          width: platform.width,
          height: platform.height
        }
      });

      body.createFixture({
        shape: planck.Box(halfWidth, halfHeight),
        friction: 0.1,
        restitution: 0
      });

      this.platforms.set(platform.id, body);
    });

    // 2. Jump Pads
    mapData.jumpPads.forEach((pad) => {
      const padWidth = 40;
      const padHeight = 10;
      const halfWidth = (padWidth / 2) / PHYSICS_SCALE;
      const halfHeight = (padHeight / 2) / PHYSICS_SCALE;
      const px = pad.x / PHYSICS_SCALE;
      const py = (GAME_CONSTANTS.MAP_HEIGHT - pad.y) / PHYSICS_SCALE;

      const body = this.world.createBody({
        type: 'static',
        position: planck.Vec2(px, py),
        userData: {
          id: pad.id,
          type: 'jump_pad',
          force: pad.force
        }
      });

      body.createFixture({
        shape: planck.Box(halfWidth, halfHeight),
        isSensor: true
      });

      this.jumpPads.set(pad.id, body);
    });

    // 3. Moving Platforms
    mapData.movingPlatforms.forEach((platform) => {
      const halfWidth = (platform.width / 2) / PHYSICS_SCALE;
      const halfHeight = (platform.height / 2) / PHYSICS_SCALE;
      const px = (platform.x + platform.width / 2) / PHYSICS_SCALE;
      const py = (GAME_CONSTANTS.MAP_HEIGHT - (platform.y + platform.height / 2)) / PHYSICS_SCALE;

      const body = this.world.createBody({
        type: 'kinematic',
        position: planck.Vec2(px, py),
        userData: {
          id: platform.id,
          type: 'moving_platform',
          width: platform.width,
          height: platform.height
        }
      });

      body.createFixture({
        shape: planck.Box(halfWidth, halfHeight),
        friction: 0.8,
        restitution: 0
      });

      this.movingPlatformsList.push({
        body,
        data: platform,
        targetIndex: 0,
        direction: 1
      });
    });

    // 4. Boxes
    mapData.boxes.forEach((box) => {
      const halfWidth = (box.width / 2) / PHYSICS_SCALE;
      const halfHeight = (box.height / 2) / PHYSICS_SCALE;
      const px = (box.x + box.width / 2) / PHYSICS_SCALE;
      const py = (GAME_CONSTANTS.MAP_HEIGHT - (box.y + box.height / 2)) / PHYSICS_SCALE;

      const body = this.world.createBody({
        type: 'static',
        position: planck.Vec2(px, py),
        userData: {
          id: box.id,
          type: 'box',
          health: box.health,
          maxHealth: box.health
        }
      });

      body.createFixture({
        shape: planck.Box(halfWidth, halfHeight),
        friction: 0.4,
        restitution: 0.1
      });

      this.boxes.set(box.id, body);
    });
  }

  public addPlayer(playerId: string, x: number, y: number): planck.Body {
    const halfWidth = (GAME_CONSTANTS.PLAYER_WIDTH / 2) / PHYSICS_SCALE;
    const halfHeight = (GAME_CONSTANTS.PLAYER_HEIGHT / 2) / PHYSICS_SCALE;
    const px = x / PHYSICS_SCALE;
    const py = (GAME_CONSTANTS.MAP_HEIGHT - y) / PHYSICS_SCALE;

    const body = this.world.createBody({
      type: 'dynamic',
      position: planck.Vec2(px, py),
      fixedRotation: true,
      userData: {
        id: playerId,
        type: 'player'
      }
    });

    body.createFixture({
      shape: planck.Box(halfWidth, halfHeight),
      density: 1.0,
      friction: 0.0, // Avoid sticking to walls
      restitution: 0.0
    });

    this.players.set(playerId, body);
    return body;
  }

  public removePlayer(playerId: string) {
    const body = this.players.get(playerId);
    if (body) {
      this.world.destroyBody(body);
      this.players.delete(playerId);
    }
  }

  public getPlayerBody(playerId: string): planck.Body | undefined {
    return this.players.get(playerId);
  }

  public addGrenade(grenadeId: string, ownerId: string, x: number, y: number, vx: number, vy: number): planck.Body {
    const px = x / PHYSICS_SCALE;
    const py = (GAME_CONSTANTS.MAP_HEIGHT - y) / PHYSICS_SCALE;
    const pvx = vx / PHYSICS_SCALE;
    const pvy = -vy / PHYSICS_SCALE; // Invert velocity Y for standard physics

    const body = this.world.createBody({
      type: 'dynamic',
      position: planck.Vec2(px, py),
      linearVelocity: planck.Vec2(pvx, pvy),
      userData: {
        id: grenadeId,
        ownerId,
        type: 'grenade'
      }
    });

    body.createFixture({
      shape: planck.Circle(0.25), // 0.25 meter radius (about 7.5px)
      density: 1.5,
      friction: 0.2,
      restitution: 0.4 // bouncy!
    });

    this.grenades.set(grenadeId, body);
    return body;
  }

  public removeGrenade(grenadeId: string) {
    const body = this.grenades.get(grenadeId);
    if (body) {
      this.world.destroyBody(body);
      this.grenades.delete(grenadeId);
    }
  }

  public getGrenadeBody(grenadeId: string): planck.Body | undefined {
    return this.grenades.get(grenadeId);
  }

  public isPlayerGrounded(playerId: string): boolean {
    const body = this.players.get(playerId);
    if (!body) return false;

    // Iterate through contact list
    for (let ce = body.getContactList(); ce; ce = ce.next ?? null) {
      const contact = ce.contact;
      if (contact.isTouching()) {
        const fixtureA = contact.getFixtureA();
        const fixtureB = contact.getFixtureB();

        // Skip sensors (like jump pads)
        if (fixtureA.isSensor() || fixtureB.isSensor()) continue;

        const worldManifold = contact.getWorldManifold(null);
        if (!worldManifold) continue;
        const normal = worldManifold.normal;

        const bodyA = fixtureA.getBody();
        if (bodyA === body) {
          // If bodyA is player and contact normal y is negative, player is resting on top of bodyB
          if (normal.y < -0.5) return true;
        } else {
          // If bodyB is player and contact normal y is positive, player is resting on top of bodyA
          if (normal.y > 0.5) return true;
        }
      }
    }
    return false;
  }

  public step(dt: number) {
    // 1. Move Kinematic platforms
    this.updateMovingPlatforms(dt);

    // 2. Step physics simulation
    // 6 velocity iterations, 2 position iterations are standard Box2D defaults
    this.world.step(dt, 6, 2);
  }

  private updateMovingPlatforms(dt: number) {
    this.movingPlatformsList.forEach((mp) => {
      const body = mp.body;
      const platform = mp.data;
      if (platform.path.length < 2) return;

      const currentPos = body.getPosition();
      const targetNode = platform.path[mp.targetIndex];
      const targetX = targetNode.x / PHYSICS_SCALE;
      const targetY = (GAME_CONSTANTS.MAP_HEIGHT - targetNode.y) / PHYSICS_SCALE;

      const dx = targetX - currentPos.x;
      const dy = targetY - currentPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.1) {
        // Node reached, proceed to next
        mp.targetIndex += mp.direction;
        if (mp.targetIndex >= platform.path.length || mp.targetIndex < 0) {
          // Ping pong behavior
          mp.direction *= -1;
          mp.targetIndex += mp.direction * 2;
          // Clamp index
          mp.targetIndex = Math.max(0, Math.min(platform.path.length - 1, mp.targetIndex));
        }
        return;
      }

      // Calculate direction and velocity
      const speed = platform.speed / PHYSICS_SCALE;
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;

      body.setLinearVelocity(planck.Vec2(vx, vy));
    });
  }

  public getPlayerPosition(playerId: string): Vector2 | null {
    const body = this.players.get(playerId);
    if (!body) return null;
    const pos = body.getPosition();
    return {
      x: pos.x * PHYSICS_SCALE,
      y: GAME_CONSTANTS.MAP_HEIGHT - (pos.y * PHYSICS_SCALE)
    };
  }

  public getPlayerVelocity(playerId: string): Vector2 | null {
    const body = this.players.get(playerId);
    if (!body) return null;
    const vel = body.getLinearVelocity();
    return {
      x: vel.x * PHYSICS_SCALE,
      y: -vel.y * PHYSICS_SCALE // Invert Y velocity back to screen space
    };
  }

  public setPlayerVelocity(playerId: string, vx: number, vy: number) {
    const body = this.players.get(playerId);
    if (body) {
      body.setLinearVelocity(planck.Vec2(vx / PHYSICS_SCALE, -vy / PHYSICS_SCALE));
    }
  }

  public applyPlayerForce(playerId: string, fx: number, fy: number) {
    const body = this.players.get(playerId);
    if (body) {
      body.applyForceToCenter(planck.Vec2(fx / PHYSICS_SCALE, -fy / PHYSICS_SCALE), true);
    }
  }

  public getGrenadePosition(grenadeId: string): Vector2 | null {
    const body = this.grenades.get(grenadeId);
    if (!body) return null;
    const pos = body.getPosition();
    return {
      x: pos.x * PHYSICS_SCALE,
      y: GAME_CONSTANTS.MAP_HEIGHT - (pos.y * PHYSICS_SCALE)
    };
  }

  public getGrenadeVelocity(grenadeId: string): Vector2 | null {
    const body = this.grenades.get(grenadeId);
    if (!body) return null;
    const vel = body.getLinearVelocity();
    return {
      x: vel.x * PHYSICS_SCALE,
      y: -vel.y * PHYSICS_SCALE
    };
  }

  public getMovingPlatformsState(): { id: string; position: Vector2; velocity: Vector2 }[] {
    return this.movingPlatformsList.map((mp) => {
      const pos = mp.body.getPosition();
      const vel = mp.body.getLinearVelocity();
      return {
        id: mp.data.id,
        position: {
          x: pos.x * PHYSICS_SCALE,
          y: GAME_CONSTANTS.MAP_HEIGHT - (pos.y * PHYSICS_SCALE)
        },
        velocity: {
          x: vel.x * PHYSICS_SCALE,
          y: -vel.y * PHYSICS_SCALE
        }
      };
    });
  }

  public clear() {
    this.players.forEach((body) => this.world.destroyBody(body));
    this.players.clear();

    this.platforms.forEach((body) => this.world.destroyBody(body));
    this.platforms.clear();

    this.jumpPads.forEach((body) => this.world.destroyBody(body));
    this.jumpPads.clear();

    this.movingPlatformsList.forEach((mp) => this.world.destroyBody(mp.body));
    this.movingPlatformsList = [];

    this.boxes.forEach((body) => this.world.destroyBody(body));
    this.boxes.clear();

    this.grenades.forEach((body) => this.world.destroyBody(body));
    this.grenades.clear();
  }
}
