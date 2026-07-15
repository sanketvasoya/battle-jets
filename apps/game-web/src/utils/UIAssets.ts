import { Texture } from 'pixi.js';
import { menuSheet, partsSheet, isLoaded } from './AssetLoader';

export function isUIAssetsLoaded(): boolean {
  return isLoaded();
}

const frameCache = new Map<string, string>();

function extractFrameAsDataUrl(texture: Texture, maxSize: number = 48): string {
  const frame = texture.frame;
  if (!frame) return '';

  const canvas = document.createElement('canvas');
  const scale = Math.min(maxSize / frame.width, maxSize / frame.height, 1);
  canvas.width = Math.round(frame.width * scale);
  canvas.height = Math.round(frame.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const source = texture.baseTexture.resource.source;
  if (!source) return '';

  ctx.drawImage(
    source as HTMLImageElement | HTMLCanvasElement,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL('image/png');
}

export function getMenuFrameUrl(frameName: string, maxSize: number = 48): string {
  if (!menuSheet) return '';
  const cacheKey = `menu:${frameName}:${maxSize}`;
  if (frameCache.has(cacheKey)) return frameCache.get(cacheKey)!;

  const frames = menuSheet.data.frames as Record<string, any>;
  if (!frames[frameName]) return '';

  const texture = Texture.from(frameName);
  const url = extractFrameAsDataUrl(texture, maxSize);
  frameCache.set(cacheKey, url);
  return url;
}

export function getPartsFrameUrl(frameName: string, maxSize: number = 48): string {
  if (!partsSheet) return '';
  const cacheKey = `parts:${frameName}:${maxSize}`;
  if (frameCache.has(cacheKey)) return frameCache.get(cacheKey)!;

  const frames = partsSheet.data.frames as Record<string, any>;
  if (!frames[frameName]) return '';

  const texture = Texture.from(frameName);
  const url = extractFrameAsDataUrl(texture, maxSize);
  frameCache.set(cacheKey, url);
  return url;
}

export function getWeaponIconUrl(weapon: string, maxSize: number = 40): string {
  const WEAPON_FRAME_MAP: Record<string, string> = {
    assault_rifle: 'ak47.png',
    shotgun: 'shotgun.png',
    sniper: 'sniper.png',
    rocket_launcher: 'rocket.png',
    smg: 'mp5.png',
    pistol: 'desertEagle.png',
    energy_rifle: 'emp.png',
    melee: 'machete.png',
    grenade_launcher: 'grenade.png',
    laser: 'laser.png',
  };

  const frame = WEAPON_FRAME_MAP[weapon];
  return frame ? getMenuFrameUrl(frame, maxSize) : '';
}

export function getAvatarHeadUrl(headIndex: number, maxSize: number = 48): string {
  const frameName = `head${Math.max(1, Math.min(17, headIndex))}.png`;
  return getMenuFrameUrl(frameName, maxSize);
}

const AVATAR_HEAD_MAP: Record<string, number> = {
  commander_alpha: 1,
  scout_delta: 3,
  heavy_bravo: 5,
  medic_echo: 7,
  sniper_foxtrot: 9,
};

export function getAvatarUrl(avatar: string, maxSize: number = 48): string {
  const headIdx = AVATAR_HEAD_MAP[avatar] ?? 1;
  return getAvatarHeadUrl(headIdx, maxSize);
}

export function clearFrameCache(): void {
  frameCache.clear();
}
