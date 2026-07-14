export interface Weapon {
  id: string;
  name: string;
  damage: number;
  fireRate: number;
  range: number;
  spread: number;
  pellets: number;
  explosionRadius: number;
  projectileSpeed: number;
  image: string;
  sound: string;
  ammo: number;
  reloadTime: number;
  damageType: string;
  knockback: number;
  isPublished: boolean;
  skins?: WeaponSkin[];
}

export interface WeaponSkin {
  id: string;
  weaponId: string;
  name: string;
  assetPath: string;
  rarity: string;
  isDefault: boolean;
  isPublished: boolean;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  json: MapData;
  image: string;
  isActive: boolean;
  createdAt: string;
}

export interface MapData {
  platforms: Platform[];
  spawnPoints: { x: number; y: number }[];
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
  speed: number;
  path: { x: number; y: number }[];
}

export interface Box {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
}

export interface Player {
  id: string;
  username: string;
  avatar: string;
  level: number;
  wins: number;
  losses: number;
  xp: number;
  createdAt: string;
}

export interface Room {
  code: string;
  status: string;
  players: { id?: string; username: string }[];
  mode: string;
}

export interface Character {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  baseHealth: number;
  speed: number;
  isPublished: boolean;
  isActive: boolean;
  createdAt: string;
  parts: CharacterPart[];
}

export interface CharacterPart {
  id: string;
  characterId: string;
  slot: string;
  name: string;
  assetPath: string;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotation: number;
  color: string;
  zIndex: number;
}

export interface Crosshair {
  id: string;
  name: string;
  style: string;
  color: string;
  size: number;
  thickness: number;
  gap: number;
  dot: boolean;
  assetPath: string;
  isDefault: boolean;
  isPublished: boolean;
}

export interface Jetpack {
  id: string;
  name: string;
  description: string;
  fuel: number;
  thrust: number;
  rechargeRate: number;
  burnRate: number;
  assetPath: string;
  particleColor: string;
  trailLength: number;
  isDefault: boolean;
  isPublished: boolean;
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  type: string;
  duration: number;
  magnitude: number;
  effect: string;
  assetPath: string;
  color: string;
  spawnWeight: number;
  isPublished: boolean;
  isActive: boolean;
}

export interface GameModeConfig {
  id: string;
  name: string;
  description: string;
  timer: number;
  maxPlayers: number;
  minPlayers: number;
  scoringType: string;
  rules: string | Record<string, unknown>;
  isPublished: boolean;
  isActive: boolean;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: string | Record<string, string>;
  isDefault: boolean;
  isPublished: boolean;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  path: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Script {
  id: string;
  name: string;
  type: string;
  language: string;
  code: string;
  version: number;
  isPublished: boolean;
}

export interface ContentVersion {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  version: number;
  data: Record<string, unknown>;
  changelog: string;
  createdAt: string;
}

export interface GameSetting {
  id: string;
  key: string;
  value: unknown;
}

export type NavSection =
  | 'dashboard'
  | 'characters'
  | 'weapons'
  | 'maps'
  | 'crosshairs'
  | 'jetpacks'
  | 'powerups'
  | 'gamemodes'
  | 'themes'
  | 'assets'
  | 'scripts'
  | 'versions'
  | 'testing'
  | 'publishing'
  | 'players'
  | 'live'
  | 'settings';
