import { Assets, Texture, Spritesheet } from 'pixi.js';

const ASSET_BASE = '/assets';

const MANIFEST = {
  spritesheets: {
    menu: `${ASSET_BASE}/spritesheets/menuTexture.json`,
    parts: `${ASSET_BASE}/spritesheets/partsTexture.json`,
  },
  textures: {
    bgStandard: `${ASSET_BASE}/backgrounds/bg_new.png`,
    bgSnow: `${ASSET_BASE}/backgrounds/bgSnow_new.png`,
    bgMoon: `${ASSET_BASE}/backgrounds/bgMoon_new.png`,
    bgDesert: `${ASSET_BASE}/backgrounds/bgDesert_new.png`,
    stars: `${ASSET_BASE}/backgrounds/stars.png`,
    worldMap: `${ASSET_BASE}/backgrounds/worldMap.png`,
    tileStandard: `${ASSET_BASE}/tilesets/tile64_new.png`,
    tileSnow: `${ASSET_BASE}/tilesets/tile64Snow_new.png`,
    tileMoon: `${ASSET_BASE}/tilesets/tile64Moon_new.png`,
    tileDesert: `${ASSET_BASE}/tilesets/tile64Desert_new.png`,
    player: `${ASSET_BASE}/characters/da_new.png`,
    jetpack: `${ASSET_BASE}/characters/propack_new.png`,
    zombie: `${ASSET_BASE}/characters/zombie_new.png`,
    blast: `${ASSET_BASE}/effects/blast_new.png`,
    smoke: `${ASSET_BASE}/effects/smoke_new.png`,
    smokey: `${ASSET_BASE}/effects/smokey_new.png`,
    spark: `${ASSET_BASE}/effects/spark_new.png`,
    streak: `${ASSET_BASE}/effects/streak_new.png`,
    shell: `${ASSET_BASE}/effects/shell_new.png`,
    shrapnel: `${ASSET_BASE}/effects/shrap_new.png`,
    rock: `${ASSET_BASE}/effects/rock_new.png`,
    blood: `${ASSET_BASE}/effects/blood_new.png`,
    crash: `${ASSET_BASE}/effects/crash_new.png`,
    splatter: `${ASSET_BASE}/effects/splatter_new.png`,
    blasticle: `${ASSET_BASE}/effects/blasticle_new.png`,
    ora: `${ASSET_BASE}/effects/ora_new.png`,
    trail: `${ASSET_BASE}/effects/path_new.png`,
    bullet: `${ASSET_BASE}/ui/bullet_new.png`,
    dot: `${ASSET_BASE}/ui/dot.png`,
    x: `${ASSET_BASE}/ui/x.png`,
    grass: `${ASSET_BASE}/ui/grass.png`,
    classic: `${ASSET_BASE}/ui/classic.png`,
    dialog: `${ASSET_BASE}/ui/dialog.png`,
    boxSquare: `${ASSET_BASE}/ui/b03_square.png`,
    ammoText: `${ASSET_BASE}/ui/ammoText_new.png`,
    font02: `${ASSET_BASE}/ui/font02_new.png`,
    nameplate1: `${ASSET_BASE}/ui/nameplate1.png`,
    nameplate2: `${ASSET_BASE}/ui/nameplate2.png`,
    nameplate3: `${ASSET_BASE}/ui/nameplate3.png`,
  },
};

const WEAPON_SPRITES: Record<string, { normal: string; empty: string; mag: string }> = {
  aa12: { normal: 'aa12.png', empty: 'aa12E.png', mag: 'aa12Mag.png' },
  ak47: { normal: 'ak47.png', empty: 'ak47E.png', mag: 'ak47Mag.png' },
  desertEagle: { normal: 'desertEagle.png', empty: 'desertEagleE.png', mag: 'desertEagleMag.png' },
  emp: { normal: 'emp.png', empty: 'empE.png', mag: 'empMag.png' },
};

let loaded = false;
export let menuSheet: Spritesheet | null = null;
export let partsSheet: Spritesheet | null = null;

export async function preloadAssets(onProgress?: (progress: number) => void): Promise<void> {
  if (loaded) return;

  const allEntries = [
    ...Object.values(MANIFEST.spritesheets),
    ...Object.values(MANIFEST.textures),
  ];
  const total = allEntries.length;
  let done = 0;

  const tick = () => {
    done++;
    onProgress?.(done / total);
  };

  await Assets.load(MANIFEST.spritesheets.menu);
  menuSheet = await Assets.load<Record<string, Texture>>(MANIFEST.spritesheets.menu) as unknown as Spritesheet;
  tick();

  partsSheet = await Assets.load<Record<string, Texture>>(MANIFEST.spritesheets.parts) as unknown as Spritesheet;
  tick();

  const texturePromises = Object.values(MANIFEST.textures).map(async (url) => {
    await Assets.load(url);
    tick();
  });
  await Promise.all(texturePromises);

  loaded = true;
}

export function getMenuFrame(name: string): Texture | null {
  if (!menuSheet) return null;
  const frames = menuSheet.data.frames as Record<string, any>;
  if (frames[name]) {
    return Texture.from(name);
  }
  return null;
}

export function getPartsFrame(name: string): Texture | null {
  if (!partsSheet) return null;
  const frames = partsSheet.data.frames as Record<string, any>;
  if (frames[name]) {
    return Texture.from(name);
  }
  return null;
}

export function getTexture(key: keyof typeof MANIFEST.textures): Texture {
  return Texture.from(MANIFEST.textures[key]);
}

export function getWeaponTexture(weapon: string): Texture | null {
  const sprite = WEAPON_SPRITES[weapon];
  if (!sprite) return null;
  return getMenuFrame(sprite.normal) ?? null;
}

export function isLoaded(): boolean {
  return loaded;
}
