import React, { useRef, useEffect, useCallback } from 'react';
import { Application, Graphics } from 'pixi.js';
import { useGameStore } from '../../stores/useGameStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { soundManager } from '../../utils/SoundManager';
import { GAME_CONSTANTS, WEAPONS, POWER_UP_CONFIG, WeaponType } from '@battle-jets/shared';

const COLORS = {
  primary: 0x2F80ED,
  secondary: 0xFF6B00,
  background: 0x0F172A,
  surface: 0x1E293B,
  success: 0x22C55E,
  danger: 0xEF4444,
  text: 0xF8FAFC,
  textMuted: 0x94A3B8,
  border: 0x334155,
};

interface ParticleData {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: number; size: number;
  type: 'spark' | 'explosion' | 'jetpack' | 'bullet' | 'box_debris' | 'powerup';
}

interface InputState {
  left: boolean; right: boolean; up: boolean; down: boolean;
  shoot: boolean; grenade: boolean; jetpack: boolean;
  weapon: WeaponType;
  mouseX: number; mouseY: number;
  aimAngle: number;
}

interface GameCanvasProps {
  onMatchEnd: () => void;
}

interface InterpolatedState {
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  health: number;
  maxHealth: number;
  isAlive: boolean;
  aimAngle: number;
  weapon: WeaponType;
  jetpackActive: boolean;
  jetpackFuel: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadTimer: number;
}

const PARTICLE_POOL_SIZE = 400;

export const GameCanvas: React.FC<GameCanvasProps> = ({ onMatchEnd }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const gfxRef = useRef<Graphics | null>(null);
  const inputRef = useRef<InputState>({
    left: false, right: false, up: false, down: false,
    shoot: false, grenade: false, jetpack: false,
    weapon: 'assault_rifle',
    mouseX: 0, mouseY: 0, aimAngle: 0,
  });
  const tickRef = useRef(0);
  const lastShootTime = useRef(0);
  const particlesRef = useRef<ParticleData[]>([]);
  const prevJetpackRef = useRef(false);

  const gameStateRef = useRef<any>(null);
  const playerIdRef = useRef<string | null>(null);
  const qualityRef = useRef<'low' | 'medium' | 'high'>('high');
  const prevGameStateRef = useRef<any>(null);
  const interpolationRef = useRef(0);

  const { gameState, initGameListeners, removeGameListeners, sendInput, matchResults } = useGameStore();
  const { player } = useAuthStore();
  const { volumeSFX, graphicsQuality } = useSettingsStore();

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { playerIdRef.current = player?.id ?? null; }, [player]);
  useEffect(() => { qualityRef.current = graphicsQuality; }, [graphicsQuality]);

  const playShootSound = useCallback((weapon: WeaponType) => {
    if (weapon === 'assault_rifle') soundManager.playAR();
    else if (weapon === 'shotgun') soundManager.playShotgun();
    else if (weapon === 'sniper') soundManager.playSniper();
    else if (weapon === 'rocket_launcher') soundManager.playRocket();
    else if (weapon === 'smg') soundManager.playAR();
    else if (weapon === 'pistol') soundManager.playAR();
    else if (weapon === 'energy_rifle') soundManager.playSniper();
    else if (weapon === 'laser') soundManager.playSniper();
    else if (weapon === 'grenade_launcher') soundManager.playRocket();
    else if (weapon === 'melee') soundManager.playJump();
  }, []);

  const spawnParticles = useCallback((x: number, y: number, type: ParticleData['type'], count: number = 8) => {
    const newParticles: ParticleData[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = type === 'explosion' ? Math.random() * 120 + 60 :
                    type === 'jetpack' ? Math.random() * 60 + 20 :
                    type === 'box_debris' ? Math.random() * 80 + 40 :
                    type === 'powerup' ? Math.random() * 40 + 20 :
                    Math.random() * 80 + 30;
      newParticles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: type === 'jetpack' ? Math.abs(Math.sin(angle)) * speed : Math.sin(angle) * speed,
        life: 1.0,
        maxLife: type === 'explosion' ? 0.6 : type === 'jetpack' ? 0.3 : type === 'box_debris' ? 0.5 : type === 'powerup' ? 0.4 : 0.4,
        color: type === 'explosion' ? COLORS.secondary :
               type === 'jetpack' ? 0x88CCFF :
               type === 'bullet' ? 0xFFFF88 :
               type === 'box_debris' ? 0x8B6914 :
               type === 'powerup' ? 0x44FF88 : COLORS.primary,
        size: type === 'explosion' ? 4 : type === 'box_debris' ? 3 : 2,
        type,
      });
    }
    particlesRef.current.push(...newParticles);
    if (particlesRef.current.length > PARTICLE_POOL_SIZE) {
      particlesRef.current = particlesRef.current.slice(-PARTICLE_POOL_SIZE);
    }
  }, []);

  const interpRef = useRef<InterpolatedState | null>(null);
  const prevTimeRef = useRef(0);

  const interpolateState = useCallback((currentState: any, prevState: any, t: number): any => {
    if (!currentState || !currentState.players) return currentState;
    if (!prevState || !prevState.players) return currentState;

    const interpolated = { ...currentState };
    const interpolatedPlayers = new Map<string, any>();

    currentState.players.forEach((player: any, pid: string) => {
      const prevPlayer = prevState.players?.get?.(pid) || prevState.players?.[pid];
      if (!prevPlayer) {
        interpolatedPlayers.set(pid, player);
        return;
      }

      const lerpVal = Math.min(1, t);
      interpolatedPlayers.set(pid, {
        ...player,
        position: {
          x: prevPlayer.position.x + (player.position.x - prevPlayer.position.x) * lerpVal,
          y: prevPlayer.position.y + (player.position.y - prevPlayer.position.y) * lerpVal,
        },
        velocity: {
          x: prevPlayer.velocity.x + (player.velocity.x - prevPlayer.velocity.x) * lerpVal,
          y: prevPlayer.velocity.y + (player.velocity.y - prevPlayer.velocity.y) * lerpVal,
        },
      });
    });

    interpolated.players = interpolatedPlayers;
    return interpolated;
  }, []);

  const fallbackPlatforms = useRef([
    { x: 100, y: 1400, width: 900, height: 40, type: 'solid' },
    { x: 1200, y: 1500, width: 600, height: 40, type: 'solid' },
    { x: 2000, y: 1400, width: 900, height: 40, type: 'solid' },
    { x: 300, y: 1000, width: 400, height: 30, type: 'one_way' },
    { x: 2300, y: 1000, width: 400, height: 30, type: 'one_way' },
    { x: 1100, y: 1100, width: 800, height: 30, type: 'solid' },
    { x: 1300, y: 800, width: 400, height: 30, type: 'one_way' },
    { x: 1400, y: 500, width: 200, height: 30, type: 'one_way' },
  ]);
  const fallbackBoxes = useRef([
    { x: 450, y: 1340, width: 60, height: 60, health: 100, maxHealth: 100 },
    { x: 510, y: 1340, width: 60, height: 60, health: 100, maxHealth: 100 },
    { x: 2450, y: 1340, width: 60, height: 60, health: 100, maxHealth: 100 },
  ]);
  const jumpPads = useRef([{ x: 150, y: 1390 }, { x: 2850, y: 1390 }]);

  const renderFrame = useCallback(() => {
    const app = appRef.current;
    const g = gfxRef.current;
    const gs = gameStateRef.current;
    if (!app || !g || !gs || !gs.players) return;

    const now = Date.now();
    const dt = app.ticker.deltaMS / 1000;
    const playerId = playerIdRef.current;
    const quality = qualityRef.current;
    const screenW = app.screen.width;
    const screenH = app.screen.height;

    const prevState = prevGameStateRef.current;
    if (prevState && prevTimeRef.current > 0) {
      const elapsed = (now - prevTimeRef.current) / (1000 / 60);
      interpolationRef.current = Math.min(1, elapsed);
    }

    const platforms = gs.mapData?.platforms || fallbackPlatforms.current;
    const boxes = gs.boxes || fallbackBoxes.current;
    const movingPlatforms = gs.movingPlatforms || [];
    const powerUps = gs.powerUps || [];

    let camX = GAME_CONSTANTS.MAP_WIDTH / 2;
    let camY = GAME_CONSTANTS.MAP_HEIGHT / 2;
    const localPlayer = playerId ? gs.players.get(playerId) : null;
    if (localPlayer) {
      camX = localPlayer.position.x;
      camY = localPlayer.position.y;
    }
    const offsetX = screenW / 2 - camX;
    const offsetY = screenH / 2 - camY;

    g.clear();

    // ===== BACKGROUND =====
    g.rect(0, 0, screenW, screenH).fill({ color: COLORS.background });

    const starCount = quality === 'low' ? 30 : quality === 'medium' ? 60 : 100;
    for (let i = 0; i < starCount; i++) {
      const sx = ((i * 137.5 + camX * 0.05) % screenW + screenW) % screenW;
      const sy = ((i * 89.3 + camY * 0.05) % screenH + screenH) % screenH;
      const sz = (i % 3) + 1;
      g.circle(sx, sy, sz * 0.5).fill({ color: 0xffffff, alpha: (i % 5 === 0) ? 0.7 : 0.3 });
    }

    g.circle(screenW * 0.3, screenH * 0.4, 180).fill({ color: 0x1a2456, alpha: 0.5 });
    g.circle(screenW * 0.7, screenH * 0.6, 150).fill({ color: 0x1e3a2e, alpha: 0.4 });

    if (quality !== 'low') {
      g.rect(offsetX, offsetY, GAME_CONSTANTS.MAP_WIDTH, GAME_CONSTANTS.MAP_HEIGHT)
        .fill({ color: 0x0a1120, alpha: 0.3 });
    }

    // ===== PLATFORMS =====
    for (const plat of platforms) {
      const px = plat.x + offsetX;
      const py = plat.y + offsetY;
      if (px + plat.width < -50 || px > screenW + 50) continue;
      if (plat.type === 'solid') {
        g.rect(px, py, plat.width, plat.height).fill({ color: 0x334155 });
        g.rect(px, py, plat.width, 3).fill({ color: 0x4a6080 });
        g.rect(px, py + plat.height - 2, plat.width, 2).fill({ color: 0x1a2030 });
        if (quality === 'high') {
          for (let tx = px + 20; tx < px + plat.width - 20; tx += 60) {
            g.rect(tx, py + 8, 20, 3).fill({ color: 0x2F80ED, alpha: 0.4 });
          }
        }
      } else {
        g.rect(px, py, plat.width, plat.height).fill({ color: 0x2F80ED, alpha: 0.3 });
        g.rect(px, py, plat.width, 3).fill({ color: 0x2F80ED, alpha: 0.9 });
      }
    }

    // ===== MOVING PLATFORMS =====
    for (const mp of movingPlatforms) {
      const mpx = mp.position.x + offsetX;
      const mpy = mp.position.y + offsetY;
      if (mpx + mp.width < -50 || mpx > screenW + 50) continue;
      g.rect(mpx, mpy, mp.width, mp.height).fill({ color: 0x5B21B6 });
      g.rect(mpx, mpy, mp.width, 3).fill({ color: 0x7C3AED, alpha: 0.8 });
      g.rect(mpx, mpy + mp.height - 2, mp.width, 2).fill({ color: 0x3B0764 });
      for (let tx = mpx + 10; tx < mpx + mp.width - 10; tx += 30) {
        g.rect(tx, mpy + 5, 15, 2).fill({ color: 0xA855F7, alpha: 0.3 });
      }
    }

    // ===== BOXES =====
    for (const box of boxes) {
      if (box.isDestroyed) continue;
      const bx = box.x + offsetX;
      const by = box.y + offsetY;
      if (bx + box.width < -50 || bx > screenW + 50) continue;
      const healthPct = box.health / (box.maxHealth || 100);
      const r = Math.round(0x59 + (1 - healthPct) * 0x30);
      const gr = Math.round(0x37 - (1 - healthPct) * 0x20);
      const b = Math.round(0x2b - (1 - healthPct) * 0x10);
      const boxColor = (r << 16) | (gr << 8) | b;
      g.rect(bx, by, box.width, box.height).fill({ color: boxColor });
      g.rect(bx, by, box.width, 4).fill({ color: 0x7a4a36 });
      g.rect(bx, by, 4, box.height).fill({ color: 0x7a4a36 });
      g.rect(bx + box.width - 4, by, 4, box.height).fill({ color: 0x3d2215 });
      g.moveTo(bx + 8, by + 8).lineTo(bx + box.width - 8, by + box.height - 8).stroke({ color: 0x7a4a36, width: 2 });
      g.moveTo(bx + box.width - 8, by + 8).lineTo(bx + 8, by + box.height - 8).stroke({ color: 0x7a4a36, width: 2 });
    }

    // ===== JUMP PADS =====
    const jumpPadsData = gs.mapData?.jumpPads || jumpPads.current;
    for (const pad of jumpPadsData) {
      const px = pad.x + offsetX;
      const py = pad.y + offsetY;
      if (Math.abs(px - screenW / 2) > screenW) continue;
      const t = (now / 300) % (Math.PI * 2);
      const alpha = (Math.sin(t) + 1) / 2;
      g.ellipse(px, py + 5, 20, 8).fill({ color: 0x22C55E, alpha: 0.4 + alpha * 0.4 });
      g.moveTo(px, py - 5 - alpha * 8).lineTo(px - 7, py + 5).lineTo(px + 7, py + 5).closePath()
        .fill({ color: 0x22C55E, alpha: 0.7 + alpha * 0.3 });
    }

    // ===== POWER-UPS =====
    for (const pu of powerUps) {
      if (!pu.active) continue;
      const ppx = pu.position.x + offsetX;
      const ppy = pu.position.y + offsetY;
      if (ppx < -20 || ppx > screenW + 20 || ppy < -20 || ppy > screenH + 20) continue;

      const config = POWER_UP_CONFIG[pu.type as keyof typeof POWER_UP_CONFIG];
      if (!config) continue;

      const bobY = Math.sin(now / 400) * 5;
      const glowAlpha = 0.3 + Math.sin(now / 300) * 0.15;

      g.circle(ppx, ppy + bobY, 16).fill({ color: config.color, alpha: glowAlpha });
      g.circle(ppx, ppy + bobY, 10).fill({ color: config.color, alpha: 0.8 });
      g.circle(ppx, ppy + bobY, 6).fill({ color: 0xffffff, alpha: 0.6 });

      if (quality === 'high') {
        g.circle(ppx, ppy + bobY, 20).stroke({ color: config.color, width: 1.5, alpha: 0.4 + Math.sin(now / 200) * 0.3 });
      }
    }

    // ===== PROJECTILES =====
    gs.projectiles?.forEach((proj: any) => {
      const sx = proj.position.x + offsetX;
      const sy = proj.position.y + offsetY;
      if (sx < -10 || sx > screenW + 10 || sy < -10 || sy > screenH + 10) return;

      const angle = Math.atan2(proj.velocity.y, proj.velocity.x);

      if (proj.weapon === 'rocket_launcher' || proj.weapon === 'grenade_launcher') {
        g.circle(sx, sy, 5).fill({ color: 0xFF6B00 });
        g.circle(sx, sy, 9).fill({ color: 0xFF6B00, alpha: 0.3 });
        for (let t = 1; t <= 4; t++) {
          const tx = sx - Math.cos(angle) * t * 8;
          const ty = sy - Math.sin(angle) * t * 8;
          g.circle(tx, ty, 4 - t * 0.8).fill({ color: 0xFF8833, alpha: (4 - t) * 0.25 });
        }
      } else if (proj.weapon === 'sniper' || proj.weapon === 'energy_rifle' || proj.weapon === 'laser') {
        g.moveTo(sx, sy).lineTo(sx - Math.cos(angle) * 30, sy - Math.sin(angle) * 30)
          .stroke({ color: 0x00FFFF, width: 2.5, alpha: 0.9 });
        g.circle(sx, sy, 3).fill({ color: 0xCCFFFF });
      } else if (proj.weapon === 'shotgun') {
        g.circle(sx, sy, 2.5).fill({ color: 0xFFEE44 });
      } else if (proj.weapon === 'smg' || proj.weapon === 'pistol') {
        g.circle(sx, sy, 2).fill({ color: 0xFFDD88 });
      } else {
        g.moveTo(sx, sy).lineTo(sx - Math.cos(angle) * 12, sy - Math.sin(angle) * 12)
          .stroke({ color: 0xFFFFAA, width: 2 });
        g.circle(sx, sy, 2).fill({ color: 0xFFFFFF });
      }
    });

    // ===== GRENADES =====
    gs.grenades?.forEach((gren: any) => {
      const gx = gren.position.x + offsetX;
      const gy = gren.position.y + offsetY;
      if (gx < -10 || gx > screenW + 10) return;
      const urgency = Math.max(0, 1 - gren.fuseTimer / GAME_CONSTANTS.GRENADE_FUSE_TIME);
      const gColor = urgency > 0.6 ? COLORS.danger : COLORS.secondary;
      g.circle(gx, gy, 6).fill({ color: gColor });
      g.circle(gx, gy, 10).fill({ color: gColor, alpha: 0.3 });
    });

    // ===== PLAYERS =====
    gs.players.forEach((p: any, pid: string) => {
      const sx = p.position.x + offsetX;
      const sy = p.position.y + offsetY;

      if (sx < -60 || sx > screenW + 60 || sy < -80 || sy > screenH + 80) return;

      const isLocal = pid === playerId;
      const hw = GAME_CONSTANTS.PLAYER_WIDTH / 2;
      const hh = GAME_CONSTANTS.PLAYER_HEIGHT / 2;

      if (!p.isAlive) {
        g.circle(sx, sy, 12).fill({ color: COLORS.danger, alpha: 0.25 });
        g.moveTo(sx - 5, sy - 5).lineTo(sx + 5, sy + 5).stroke({ color: COLORS.danger, width: 2 });
        g.moveTo(sx + 5, sy - 5).lineTo(sx - 5, sy + 5).stroke({ color: COLORS.danger, width: 2 });
        return;
      }

      if (p.jetpackActive) {
        if (Math.random() < 0.7) {
          spawnParticles(sx, sy + hh + 4, 'jetpack', 3);
        }
      }

      g.ellipse(sx, sy + hh + 2, hw, 5).fill({ color: 0x000000, alpha: 0.3 });

      const bodyColor = isLocal ? COLORS.primary : COLORS.danger;
      const bodyBorderColor = isLocal ? 0x5BAAFF : 0xFF8080;
      g.roundRect(sx - hw, sy - hh, GAME_CONSTANTS.PLAYER_WIDTH, GAME_CONSTANTS.PLAYER_HEIGHT, 6)
        .fill({ color: bodyColor, alpha: 0.85 })
        .stroke({ color: bodyBorderColor, width: 1.5, alpha: 0.8 });

      g.roundRect(sx - hw + 3, sy - hh + 3, GAME_CONSTANTS.PLAYER_WIDTH - 6, 14, 4)
        .fill({ color: 0xffffff, alpha: 0.15 });

      g.roundRect(sx - 6, sy - hh + 8, 12, 8, 2).fill({ color: 0x00CCFF, alpha: 0.9 });
      g.roundRect(sx - 6, sy - hh + 8, 12, 8, 2).stroke({ color: 0x88EEFF, width: 1 });

      const facingRight = Math.cos(p.aimAngle) >= 0;
      const jpX = facingRight ? sx - hw - 5 : sx + hw + 5;
      g.roundRect(jpX - 5, sy - 10, 10, 20, 3).fill({ color: 0x334155 });
      if (p.jetpackActive) {
        g.circle(jpX, sy + 12, 5).fill({ color: 0xFF6B00, alpha: 0.8 });
        g.circle(jpX, sy + 12, 9).fill({ color: 0xFF8833, alpha: 0.3 });
      }

      const aimX = Math.cos(p.aimAngle) * 20;
      const aimY = Math.sin(p.aimAngle) * 20;
      const weaponColors: Record<string, number> = {
        assault_rifle: 0xAAAAAA, shotgun: 0xBB8833, sniper: 0x44AAFF,
        rocket_launcher: 0xFF6600, smg: 0xCCCCCC, pistol: 0xDDCC88,
        energy_rifle: 0x44DDFF, melee: 0xDDDDDD, grenade_launcher: 0xFF8844, laser: 0x00FFFF,
      };
      const weaponColor = weaponColors[p.weapon] || 0xAAAAAA;

      if (p.weapon === 'melee') {
        const bladeLen = 20;
        const bladeAngle = p.aimAngle;
        g.moveTo(sx + aimX * 0.3, sy + aimY * 0.3)
          .lineTo(sx + aimX * 0.3 + Math.cos(bladeAngle) * bladeLen, sy + aimY * 0.3 + Math.sin(bladeAngle) * bladeLen)
          .stroke({ color: 0xDDDDDD, width: 4, alpha: 0.9 });
      } else {
        g.roundRect(sx + aimX * 0.5 - 2, sy + aimY * 0.5 - 2, aimX, 4, 2)
          .fill({ color: weaponColor });
      }

      // Health bar
      const hpPct = p.health / p.maxHealth;
      const barW = 36;
      const barH = 4;
      const barX = sx - barW / 2;
      const barY = sy - hh - 12;
      g.roundRect(barX, barY, barW, barH, 2).fill({ color: 0x1a1a1a });
      const hpColor = hpPct > 0.5 ? COLORS.success : hpPct > 0.25 ? COLORS.secondary : COLORS.danger;
      g.roundRect(barX, barY, barW * hpPct, barH, 2).fill({ color: hpColor });

      // Ammo bar (only for local player, when not melee)
      if (isLocal && p.weapon !== 'melee' && p.maxAmmo !== Infinity) {
        const ammoPct = p.ammo / p.maxAmmo;
        const ammoBarW = 36;
        const ammoBarH = 3;
        const ammoBarX = sx - ammoBarW / 2;
        const ammoBarY = barY - 6;
        g.roundRect(ammoBarX, ammoBarY, ammoBarW, ammoBarH, 1).fill({ color: 0x1a1a1a });
        const ammoColor = ammoPct > 0.3 ? 0x3B82F6 : COLORS.danger;
        g.roundRect(ammoBarX, ammoBarY, ammoBarW * ammoPct, ammoBarH, 1).fill({ color: ammoColor });

        if (p.isReloading) {
          const reloadPct = 1 - (p.reloadTimer / (WEAPONS[p.weapon]?.reloadTime || 1));
          g.roundRect(ammoBarX, ammoBarY - 4, ammoBarW, 2, 1).fill({ color: 0x1a1a1a });
          g.roundRect(ammoBarX, ammoBarY - 4, ammoBarW * reloadPct, 2, 1).fill({ color: 0xF59E0B });
        }
      }

      // Name tag
      if (quality !== 'low' || isLocal) {
        const nameW = Math.min(p.username.length * 6 + 8, 80);
        const nameColor = isLocal ? 0x88CCFF : 0xFF9999;
        g.roundRect(sx - nameW / 2, barY - 14, nameW, 10, 2)
          .fill({ color: 0x000000, alpha: 0.5 });
        g.roundRect(sx - nameW / 2, barY - 14, nameW, 10, 2)
          .stroke({ color: nameColor, width: 1, alpha: 0.6 });
      }

      // Aim line (only local)
      if (isLocal && quality !== 'low') {
        const aimLen = 50;
        g.moveTo(sx, sy).lineTo(sx + Math.cos(p.aimAngle) * aimLen, sy + Math.sin(p.aimAngle) * aimLen)
          .stroke({ color: 0xffffff, width: 1, alpha: 0.15 });
        g.circle(sx + Math.cos(p.aimAngle) * aimLen, sy + Math.sin(p.aimAngle) * aimLen, 2)
          .fill({ color: 0xffffff, alpha: 0.4 });
      }
    });

    // ===== PARTICLES =====
    particlesRef.current = particlesRef.current.filter((pt) => {
      pt.life -= dt / pt.maxLife;
      if (pt.life <= 0) return false;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.type === 'explosion' || pt.type === 'spark' || pt.type === 'box_debris') {
        pt.vy += 200 * dt;
      }
      const alpha = pt.life;
      const size = pt.size * pt.life;
      const px = pt.x + offsetX;
      const py = pt.y + offsetY;
      if (px > -10 && px < screenW + 10 && py > -10 && py < screenH + 10) {
        g.circle(px, py, size).fill({ color: pt.color, alpha });
      }
      return true;
    });

    prevGameStateRef.current = gs;
    prevTimeRef.current = now;
  }, [spawnParticles]);

  // ===== Keyboard input =====
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      if (e.code === 'KeyA') inp.left = true;
      if (e.code === 'KeyD') inp.right = true;
      if (e.code === 'KeyW') inp.up = true;
      if (e.code === 'KeyS') inp.down = true;
      if (e.code === 'Space') { e.preventDefault(); inp.jetpack = true; }
      if (e.code === 'KeyG') inp.grenade = true;
      if (e.code === 'Digit1') inp.weapon = 'assault_rifle';
      if (e.code === 'Digit2') inp.weapon = 'shotgun';
      if (e.code === 'Digit3') inp.weapon = 'sniper';
      if (e.code === 'Digit4') inp.weapon = 'rocket_launcher';
      if (e.code === 'Digit5') inp.weapon = 'smg';
      if (e.code === 'Digit6') inp.weapon = 'pistol';
      if (e.code === 'Digit7') inp.weapon = 'energy_rifle';
      if (e.code === 'Digit8') inp.weapon = 'grenade_launcher';
      if (e.code === 'Digit9') inp.weapon = 'laser';
      if (e.code === 'Digit0') inp.weapon = 'melee';
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const inp = inputRef.current;
      if (e.code === 'KeyA') inp.left = false;
      if (e.code === 'KeyD') inp.right = false;
      if (e.code === 'KeyW') inp.up = false;
      if (e.code === 'KeyS') inp.down = false;
      if (e.code === 'Space') inp.jetpack = false;
      if (e.code === 'KeyG') inp.grenade = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // ===== Mouse input =====
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      inputRef.current.mouseX = e.clientX;
      inputRef.current.mouseY = e.clientY;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      inputRef.current.aimAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) inputRef.current.shoot = true;
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) inputRef.current.shoot = false;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // ===== Input sending loop (60hz) =====
  useEffect(() => {
    const interval = setInterval(() => {
      const inp = inputRef.current;
      tickRef.current++;
      const now = Date.now();
      const weaponData = WEAPONS[inp.weapon];
      const firePeriod = weaponData ? 1000 / weaponData.fireRate : 200;

      let shouldShoot = inp.shoot && (now - lastShootTime.current >= firePeriod);
      if (shouldShoot) {
        lastShootTime.current = now;
        playShootSound(inp.weapon);
      }

      if (inp.jetpack && !prevJetpackRef.current) soundManager.startJetpack();
      if (!inp.jetpack && prevJetpackRef.current) soundManager.stopJetpack();
      prevJetpackRef.current = inp.jetpack;

      const moveX = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
      const moveY = (inp.up ? 1 : 0) - (inp.down ? 1 : 0);

      sendInput({
        tick: tickRef.current,
        moveX,
        moveY,
        aimX: Math.cos(inp.aimAngle),
        aimY: Math.sin(inp.aimAngle),
        shoot: shouldShoot,
        grenade: inp.grenade,
        jetpack: inp.jetpack,
        switchWeapon: null,
      });

      inp.grenade = false;
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [sendInput, playShootSound]);

  // ===== PixiJS setup (runs once) =====
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const initPixi = async () => {
      const app = new Application();
      await app.init({
        resizeTo: window,
        backgroundColor: COLORS.background,
        antialias: graphicsQuality === 'high',
        powerPreference: 'high-performance',
      });

      canvasRef.current!.appendChild(app.canvas);
      appRef.current = app;

      const g = new Graphics();
      app.stage.addChild(g);
      gfxRef.current = g;

      app.ticker.add(renderFrame);
    };

    initPixi();

    return () => {
      soundManager.stopJetpack();
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
        gfxRef.current = null;
      }
    };
  }, []);

  // ===== Listen to game events =====
  useEffect(() => {
    initGameListeners();
    return () => removeGameListeners();
  }, [initGameListeners, removeGameListeners]);

  useEffect(() => {
    if (matchResults) {
      soundManager.stopJetpack();
      onMatchEnd();
    }
  }, [matchResults, onMatchEnd]);

  return (
    <div ref={canvasRef} className="fixed inset-0 w-full h-full overflow-hidden touch-none" />
  );
};

export default GameCanvas;
