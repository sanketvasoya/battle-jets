export type PlayerId = string;
export type RoomCode = string;
export type MatchId = string;

export interface Vector2 {
  x: number;
  y: number;
}

export interface PlayerState {
  id: PlayerId;
  username: string;
  avatar: string;
  position: Vector2;
  velocity: Vector2;
  aimAngle: number;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  kills: number;
  deaths: number;
  weapon: WeaponType;
  grenades: number;
  jetpackActive: boolean;
  jetpackFuel: number;
  lastInputTick: number;
}

export interface ProjectileState {
  id: string;
  ownerId: PlayerId;
  position: Vector2;
  velocity: Vector2;
  weapon: WeaponType;
  damage: number;
  createdAt: number;
}

export interface GrenadeState {
  id: string;
  ownerId: PlayerId;
  position: Vector2;
  velocity: Vector2;
  fuseTimer: number;
  createdAt: number;
}

export interface GameState {
  matchId: MatchId;
  players: Map<PlayerId, PlayerState>;
  projectiles: ProjectileState[];
  grenades: GrenadeState[];
  tick: number;
  startTime: number;
  timeRemaining: number;
  mapId: string;
  mode: GameMode;
}

export type WeaponType = 'assault_rifle' | 'shotgun' | 'sniper' | 'rocket_launcher';

export type GameMode = 'deathmatch';

export type RoomStatus = 'waiting' | 'countdown' | 'playing' | 'finished';

export interface Room {
  code: RoomCode;
  hostId: PlayerId;
  players: RoomPlayer[];
  maxPlayers: number;
  status: RoomStatus;
  mapId: string;
  mode: GameMode;
  isPublic: boolean;
}

export interface RoomPlayer {
  id: PlayerId;
  username: string;
  avatar: string;
  ready: boolean;
}

export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  platforms: Platform[];
  spawnPoints: Vector2[];
  jumpPads: JumpPad[];
  movingPlatforms: MovingPlatform[];
  boxes: Box[];
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'one_way';
}

export interface JumpPad {
  id: string;
  x: number;
  y: number;
  force: number;
}

export interface MovingPlatform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  path: Vector2[];
  speed: number;
}

export interface Box {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
}

export interface WeaponData {
  id: WeaponType;
  name: string;
  damage: number;
  fireRate: number;
  spread: number;
  range: number;
  pellets: number;
  explosionRadius: number;
  projectileSpeed: number;
}

export interface PlayerInput {
  tick: number;
  moveX: number;
  moveY: number;
  aimX: number;
  aimY: number;
  shoot: boolean;
  grenade: boolean;
  jetpack: boolean;
  switchWeapon: WeaponType | null;
}

export interface KillFeedEntry {
  killerId: PlayerId;
  killerName: string;
  victimId: PlayerId;
  victimName: string;
  weapon: WeaponType;
  timestamp: number;
}
