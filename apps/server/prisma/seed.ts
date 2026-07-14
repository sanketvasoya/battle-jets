import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed Weapons (with new fields)
  const weapons = [
    {
      id: 'assault_rifle',
      name: 'Assault Rifle',
      damage: 15,
      fireRate: 8,
      range: 500,
      spread: 0.05,
      pellets: 1,
      explosionRadius: 0,
      projectileSpeed: 600,
      image: 'assault_rifle',
      sound: 'shoot_ar',
      ammo: 30,
      reloadTime: 2.0,
      damageType: 'bullet',
      knockback: 5,
    },
    {
      id: 'shotgun',
      name: 'Shotgun',
      damage: 45,
      fireRate: 1,
      range: 250,
      spread: 0.15,
      pellets: 6,
      explosionRadius: 0,
      projectileSpeed: 500,
      image: 'shotgun',
      sound: 'shoot_shotgun',
      ammo: 8,
      reloadTime: 2.5,
      damageType: 'bullet',
      knockback: 20,
    },
    {
      id: 'sniper',
      name: 'Sniper',
      damage: 80,
      fireRate: 0.8,
      range: 1200,
      spread: 0.01,
      pellets: 1,
      explosionRadius: 0,
      projectileSpeed: 1200,
      image: 'sniper',
      sound: 'shoot_sniper',
      ammo: 5,
      reloadTime: 3.0,
      damageType: 'bullet',
      knockback: 15,
    },
    {
      id: 'rocket_launcher',
      name: 'Rocket Launcher',
      damage: 90,
      fireRate: 0.5,
      range: 800,
      spread: 0.02,
      pellets: 1,
      explosionRadius: 80,
      projectileSpeed: 350,
      image: 'rocket_launcher',
      sound: 'shoot_rocket',
      ammo: 4,
      reloadTime: 3.5,
      damageType: 'explosive',
      knockback: 40,
    },
  ];

  for (const w of weapons) {
    await prisma.weapon.upsert({
      where: { id: w.id },
      update: w,
      create: w,
    });
  }
  console.log('Seeded 4 weapons.');

  // 2. Seed Default Map: Sky Base
  const mapData = {
    name: 'Sky Base',
    width: 3000,
    height: 1600,
    image: 'sky_base_bg',
    json: {
      platforms: [
        { id: 'floor_left', x: 100, y: 1400, width: 900, height: 40, type: 'solid' },
        { id: 'floor_center', x: 1200, y: 1500, width: 600, height: 40, type: 'solid' },
        { id: 'floor_right', x: 2000, y: 1400, width: 900, height: 40, type: 'solid' },
        { id: 'plat_left_mid', x: 300, y: 1000, width: 400, height: 30, type: 'one_way' },
        { id: 'plat_right_mid', x: 2300, y: 1000, width: 400, height: 30, type: 'one_way' },
        { id: 'center_base', x: 1100, y: 1100, width: 800, height: 30, type: 'solid' },
        { id: 'center_tower_1', x: 1300, y: 800, width: 400, height: 30, type: 'one_way' },
        { id: 'center_tower_2', x: 1400, y: 500, width: 200, height: 30, type: 'one_way' },
      ],
      spawnPoints: [
        { x: 200, y: 1200 },
        { x: 600, y: 800 },
        { x: 1500, y: 400 },
        { x: 2800, y: 1200 },
        { x: 2400, y: 800 },
        { x: 1500, y: 900 },
      ],
      jumpPads: [
        { id: 'j_left', x: 150, y: 1390, force: 750 },
        { id: 'j_right', x: 2850, y: 1390, force: 750 },
      ],
      movingPlatforms: [
        {
          id: 'mp_left',
          x: 800, y: 700, width: 150, height: 20, speed: 120,
          path: [{ x: 800, y: 700 }, { x: 1200, y: 700 }],
        },
        {
          id: 'mp_right',
          x: 2050, y: 700, width: 150, height: 20, speed: 120,
          path: [{ x: 2050, y: 700 }, { x: 1650, y: 700 }],
        },
      ],
      boxes: [
        { id: 'b_left_1', x: 450, y: 1340, width: 60, height: 60, health: 100 },
        { id: 'b_left_2', x: 510, y: 1340, width: 60, height: 60, health: 100 },
        { id: 'b_right_1', x: 2450, y: 1340, width: 60, height: 60, health: 100 },
      ],
    },
  };

  const existingMap = await prisma.map.findFirst({ where: { name: 'Sky Base' } });
  if (!existingMap) {
    await prisma.map.create({
      data: {
        name: mapData.name,
        width: mapData.width,
        height: mapData.height,
        image: mapData.image,
        json: mapData.json as any,
      },
    });
    console.log('Seeded map: Sky Base');
  } else {
    await prisma.map.update({
      where: { id: existingMap.id },
      data: { json: mapData.json as any },
    });
    console.log('Updated existing map: Sky Base');
  }

  // 3. Seed Characters
  const characters = [
    {
      id: 'commander_alpha',
      name: 'Commander Alpha',
      description: 'The default assault class. Balanced stats for all combat situations.',
      baseHealth: 100,
      speed: 200,
      parts: [
        { slot: 'head', name: 'Tactical Helmet', offsetX: 0, offsetY: -25, scale: 1, color: '#2F80ED', zIndex: 3 },
        { slot: 'body', name: 'Combat Armor', offsetX: 0, offsetY: 0, scale: 1, color: '#334155', zIndex: 2 },
        { slot: 'arms', name: 'Arm Cannons', offsetX: 0, offsetY: -5, scale: 0.8, color: '#475569', zIndex: 1 },
        { slot: 'legs', name: 'Jet Boots', offsetX: 0, offsetY: 20, scale: 0.9, color: '#1E293B', zIndex: 1 },
        { slot: 'wing', name: 'Standard Wings', offsetX: -15, offsetY: -10, scale: 1, color: '#2F80ED', zIndex: 0 },
      ],
    },
    {
      id: 'ghost_recon',
      name: 'Ghost Recon',
      description: 'Stealth operative. Faster movement but lower health.',
      baseHealth: 75,
      speed: 250,
      parts: [
        { slot: 'head', name: 'Stealth Visor', offsetX: 0, offsetY: -25, scale: 0.9, color: '#1E293B', zIndex: 3 },
        { slot: 'body', name: 'Shadow Suit', offsetX: 0, offsetY: 0, scale: 0.95, color: '#0F172A', zIndex: 2 },
        { slot: 'arms', name: 'Silencer Arms', offsetX: 0, offsetY: -5, scale: 0.8, color: '#1E293B', zIndex: 1 },
        { slot: 'legs', name: 'Sprint Boots', offsetX: 0, offsetY: 20, scale: 0.85, color: '#0F172A', zIndex: 1 },
        { slot: 'wing', name: 'Stealth Cloak', offsetX: -15, offsetY: -10, scale: 1.1, color: '#334155', zIndex: 0 },
      ],
    },
    {
      id: 'heavy_titan',
      name: 'Heavy Titan',
      description: 'Tank class. High health and knockback resistance, but slower.',
      baseHealth: 150,
      speed: 150,
      parts: [
        { slot: 'head', name: 'Heavy Helm', offsetX: 0, offsetY: -28, scale: 1.2, color: '#FF6B00', zIndex: 3 },
        { slot: 'body', name: 'Titan Plate', offsetX: 0, offsetY: 0, scale: 1.3, color: '#FF6B00', zIndex: 2 },
        { slot: 'arms', name: 'Gatling Arms', offsetX: 0, offsetY: -5, scale: 1.1, color: '#EA580C', zIndex: 1 },
        { slot: 'legs', name: 'Heavy Treads', offsetX: 0, offsetY: 22, scale: 1.1, color: '#C2410C', zIndex: 1 },
        { slot: 'wing', name: 'Thruster Pack', offsetX: -20, offsetY: -10, scale: 1.2, color: '#FF6B00', zIndex: 0 },
      ],
    },
  ];

  for (const c of characters) {
    const { parts, ...charData } = c;
    const char = await prisma.character.upsert({
      where: { id: c.id },
      update: charData,
      create: charData,
    });
    for (const p of parts) {
      const existing = await prisma.characterPart.findFirst({
        where: { characterId: char.id, slot: p.slot },
      });
      if (existing) {
        await prisma.characterPart.update({ where: { id: existing.id }, data: p });
      } else {
        await prisma.characterPart.create({ data: { ...p, characterId: char.id } });
      }
    }
  }
  console.log('Seeded 3 characters with parts.');

  // 4. Seed Weapon Skins
  const skins = [
    { weaponId: 'assault_rifle', name: 'Crimson Fury', rarity: 'rare', isDefault: false },
    { weaponId: 'assault_rifle', name: 'Standard Issue', rarity: 'common', isDefault: true },
    { weaponId: 'shotgun', name: 'Thunder Breach', rarity: 'epic', isDefault: false },
    { weaponId: 'shotgun', name: 'Basic Shell', rarity: 'common', isDefault: true },
    { weaponId: 'sniper', name: 'Arctic Wolf', rarity: 'rare', isDefault: false },
    { weaponId: 'sniper', name: 'Standard Scope', rarity: 'common', isDefault: true },
    { weaponId: 'rocket_launcher', name: 'Inferno Core', rarity: 'legendary', isDefault: false },
    { weaponId: 'rocket_launcher', name: 'Standard Tube', rarity: 'common', isDefault: true },
  ];
  for (const s of skins) {
    const existing = await prisma.weaponSkin.findFirst({
      where: { weaponId: s.weaponId, name: s.name },
    });
    if (!existing) await prisma.weaponSkin.create({ data: s });
  }
  console.log('Seeded 8 weapon skins.');

  // 5. Seed Crosshairs
  const crosshairs = [
    { name: 'Classic Cross', style: 'cross', color: '#FFFFFF', size: 20, thickness: 2, gap: 4, dot: false, isDefault: true },
    { name: 'Red Dot', style: 'dot', color: '#EF4444', size: 8, thickness: 1, gap: 0, dot: true, isDefault: false },
    { name: 'Circle Sight', style: 'circle', color: '#22C55E', size: 24, thickness: 2, gap: 6, dot: true, isDefault: false },
    { name: 'Precision', style: 'cross', color: '#FF6B00', size: 16, thickness: 1, gap: 2, dot: true, isDefault: false },
  ];
  for (const c of crosshairs) {
    const existing = await prisma.crosshair.findFirst({ where: { name: c.name } });
    if (!existing) await prisma.crosshair.create({ data: c });
  }
  console.log('Seeded 4 crosshairs.');

  // 6. Seed Jetpacks
  const jetpacks = [
    { name: 'Standard Thruster', description: 'Reliable all-purpose jetpack', fuel: 100, thrust: 300, rechargeRate: 20, burnRate: 30, particleColor: '#FF6B00', trailLength: 10, isDefault: true },
    { name: 'Light Breeze', description: 'Lightweight pack with fast recharge but less thrust', fuel: 60, thrust: 220, rechargeRate: 35, burnRate: 20, particleColor: '#22C55E', trailLength: 6, isDefault: false },
    { name: 'Inferno Afterburner', description: 'High thrust with massive fuel consumption', fuel: 150, thrust: 450, rechargeRate: 12, burnRate: 50, particleColor: '#EF4444', trailLength: 16, isDefault: false },
  ];
  for (const j of jetpacks) {
    const existing = await prisma.jetpack.findFirst({ where: { name: j.name } });
    if (!existing) await prisma.jetpack.create({ data: j });
  }
  console.log('Seeded 3 jetpacks.');

  // 7. Seed Power-Ups
  const powerUps = [
    { name: 'Health Pack', description: 'Restores 50 health', type: 'health', duration: 0, magnitude: 50, effect: 'restore_health', color: '#22C55E', spawnWeight: 2 },
    { name: 'Speed Boost', description: 'Increases movement speed by 50%', type: 'speed', duration: 10, magnitude: 1.5, effect: 'speed_mult', color: '#2F80ED', spawnWeight: 1.5 },
    { name: 'Damage Boost', description: 'Increases damage by 75%', type: 'damage', duration: 8, magnitude: 1.75, effect: 'damage_mult', color: '#EF4444', spawnWeight: 1 },
    { name: 'Shield', description: 'Absorbs next 100 damage', type: 'shield', duration: 15, magnitude: 100, effect: 'shield_hp', color: '#FF6B00', spawnWeight: 1 },
    { name: 'Invisibility', description: 'Become invisible for 6 seconds', type: 'stealth', duration: 6, magnitude: 1, effect: 'invisible', color: '#94A3B8', spawnWeight: 0.5 },
  ];
  for (const p of powerUps) {
    const existing = await prisma.powerUp.findFirst({ where: { name: p.name } });
    if (!existing) await prisma.powerUp.create({ data: p });
  }
  console.log('Seeded 5 power-ups.');

  // 8. Seed Game Mode Configs
  const modes = [
    {
      name: 'Deathmatch',
      description: 'Free-for-all. Most kills wins.',
      timer: 600,
      maxPlayers: 8,
      minPlayers: 2,
      scoringType: 'kills',
      rules: JSON.stringify({ friendlyFire: true, respawnTime: 3, startingWeapon: 'assault_rifle', allowedWeapons: ['assault_rifle', 'shotgun', 'sniper', 'rocket_launcher'] }),
    },
    {
      name: 'Team Deathmatch',
      description: 'Teams battle for total kills.',
      timer: 600,
      maxPlayers: 8,
      minPlayers: 4,
      scoringType: 'team_kills',
      rules: JSON.stringify({ friendlyFire: false, respawnTime: 5, teamCount: 2, startingWeapon: 'assault_rifle' }),
    },
    {
      name: 'Last Stand',
      description: 'No respawns. Last player standing wins.',
      timer: 300,
      maxPlayers: 6,
      minPlayers: 2,
      scoringType: 'survival',
      rules: JSON.stringify({ respawns: false, startingWeapon: 'shotgun', allowedWeapons: ['shotgun', 'sniper'] }),
    },
  ];
  for (const m of modes) {
    const existing = await prisma.gameModeConfig.findFirst({ where: { name: m.name } });
    if (!existing) {
      await prisma.gameModeConfig.create({
        data: { ...m, rules: m.rules as any },
      });
    }
  }
  console.log('Seeded 3 game modes.');

  // 9. Seed Themes
  const themes = [
    {
      name: 'Default Dark',
      description: 'The standard dark sci-fi theme',
      isDefault: true,
      colors: JSON.stringify({
        primary: '#2F80ED',
        secondary: '#FF6B00',
        background: '#0F172A',
        surface: '#1E293B',
        success: '#22C55E',
        danger: '#EF4444',
        border: '#334155',
        textMuted: '#94A3B8',
      }),
    },
    {
      name: 'Neon Cyber',
      description: 'Vibrant neon colors on deep black',
      isDefault: false,
      colors: JSON.stringify({
        primary: '#00F0FF',
        secondary: '#FF00E5',
        background: '#000011',
        surface: '#0A0A2E',
        success: '#00FF88',
        danger: '#FF0044',
        border: '#1A1A4E',
        textMuted: '#8888CC',
      }),
    },
  ];
  for (const t of themes) {
    const existing = await prisma.theme.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.theme.create({
        data: { ...t, colors: t.colors as any },
      });
    }
  }
  console.log('Seeded 2 themes.');

  // 10. Seed Scripts
  const scripts = [
    {
      name: 'Rocket Explosion Logic',
      type: 'weapon_behavior',
      language: 'javascript',
      code: `// Rocket launcher explosion on impact
function onHit(projectile, target, damage) {
  const radius = projectile.explosionRadius || 80;
  const nearbyPlayers = api.getPlayersInRadius(projectile.position, radius);
  for (const player of nearbyPlayers) {
    const dist = api.distance(projectile.position, player.position);
    const falloff = 1 - (dist / radius);
    api.dealDamage(player.id, damage * falloff);
  }
  api.spawnEffect('explosion', projectile.position, 500);
}`,
    },
    {
      name: 'Health Power-Up Effect',
      type: 'power_up_effect',
      language: 'javascript',
      code: `// Health power-up: restore HP on pickup
function onPickup(player, powerUp) {
  const heal = powerUp.magnitude || 50;
  api.healPlayer(player.id, heal);
  api.spawnEffect('heal_burst', player.position, 300);
  api.notifyPlayer(player.id, 'Healed +' + heal + ' HP');
}`,
    },
  ];
  for (const s of scripts) {
    const existing = await prisma.script.findFirst({ where: { name: s.name } });
    if (!existing) await prisma.script.create({ data: s });
  }
  console.log('Seeded 2 scripts.');

  // 11. Seed Game Settings
  const settings = [
    { key: 'server_name', value: JSON.stringify('Battle Jets Official') },
    { key: 'max_concurrent_matches', value: JSON.stringify(10) },
    { key: 'enable_registration', value: JSON.stringify(true) },
    { key: 'maintenance_mode', value: JSON.stringify(false) },
    { key: 'content_version', value: JSON.stringify('1.0.0') },
  ];
  for (const s of settings) {
    const existing = await prisma.gameSetting.findFirst({ where: { key: s.key } });
    if (!existing) {
      await prisma.gameSetting.create({
        data: { ...s, value: s.value as any },
      });
    }
  }
  console.log('Seeded game settings.');

  console.log('\nSeeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
