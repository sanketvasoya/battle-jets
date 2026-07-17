# Battle Jets — Mini Militia Asset Integration Report

## Overview

Mini Militia (Doodle Army 2) assets have been fully imported into Battle Jets.
Source: `Mini Militia/assets/hd/` (High-Definition tier, Cocos2d-x APK extraction)
Target: `apps/game-web/public/assets/`

**Total integrated:** 132 files, 19.3 MB

---

## 1. Image Textures (46 PNGs)

All 46 game textures from Mini Militia are now in Battle Jets.

### Backgrounds (6 files) — `assets/backgrounds/`

| Source File | Asset Key | Size | Used In |
|---|---|---|---|
| `bg_new.png` | `bgStandard` | 74 KB | `AssetLoader.ts:11` — Default level background |
| `bgSnow_new.png` | `bgSnow` | 77 KB | `AssetLoader.ts:12` — Snow biome background |
| `bgMoon_new.png` | `bgMoon` | 31 KB | `AssetLoader.ts:13` — Moon biome background |
| `bgDesert_new.png` | `bgDesert` | 53 KB | `AssetLoader.ts:14` — Desert biome background |
| `stars.png` | `stars` | 7 KB | `AssetLoader.ts:15` — Parallax star overlay |
| `worldMap.png` | `worldMap` | 115 KB | `AssetLoader.ts:16` — World map view |

### Characters (3 files) — `assets/characters/`

| Source File | Asset Key | Size | Used In |
|---|---|---|---|
| `da_new.png` | `player` | 247 KB | `AssetLoader.ts:21` — Player character sprite |
| `propack_new.png` | `jetpack` | 220 KB | `AssetLoader.ts:22` — Jetpack back-mounted sprite |
| `zombie_new.png` | `zombie` | 186 KB | `AssetLoader.ts:23` — Zombie AI enemy |

### Effects (14 files) — `assets/effects/`

| Source File | Asset Key | Size | Used In |
|---|---|---|---|
| `blast_new.png` | `blast` | 21 KB | `GameCanvas.tsx:454,528,542` — Jetpack flame + explosions |
| `smoke_new.png` | `smoke` | 14 KB | `GameCanvas.tsx` — Smoke puff effect |
| `smokey_new.png` | `smokey` | 76 KB | `GameCanvas.tsx` — Larger smoke effect |
| `spark_new.png` | `spark` | 5 KB | `GameCanvas.tsx:527,542` — Spark particles |
| `streak_new.png` | `streak` | 3 KB | `GameCanvas.tsx:344,361` — Bullet trail streak |
| `shell_new.png` | `shell` | 3 KB | `GameCanvas.tsx` — Ejected shell casing |
| `shrap_new.png` | `shrapnel` | 3 KB | `GameCanvas.tsx` — Shrapnel debris |
| `rock_new.png` | `rock` | 4 KB | `GameCanvas.tsx` — Rock debris |
| `blood_new.png` | `blood` | 3 KB | `GameCanvas.tsx` — Blood splat |
| `crash_new.png` | `crash` | 220 KB | `GameCanvas.tsx` — Crash effect |
| `splatter_new.png` | `splatter` | 6 KB | `GameCanvas.tsx` — Splatter effect |
| `blasticle_new.png` | `blasticle` | 4 KB | `GameCanvas.tsx` — Small blast particle |
| `ora_new.png` | `ora` | 8 KB | `GameCanvas.tsx` — Orange glow/orb |
| `path_new.png` | `trail` | 7 KB | `GameCanvas.tsx` — Trail/path effect |

### Tilesets (4 PNGs + 4 TSXs) — `assets/tilesets/`

| Source File | Asset Key | Size | Used In |
|---|---|---|---|
| `tile64_new.png` | `tileStandard` | 1.1 MB | `AssetLoader.ts:17` — Standard tiles |
| `tile64Snow_new.png` | `tileSnow` | 1.3 MB | `AssetLoader.ts:18` — Snow tiles |
| `tile64Moon_new.png` | `tileMoon` | 982 KB | `AssetLoader.ts:19` — Moon tiles |
| `tile64Desert_new.png` | `tileDesert` | 1.2 MB | `AssetLoader.ts:20` — Desert tiles |
| `t64_new.tsx` | — | 165 B | Tileset definition (128×128, spacing=4, margin=4) |
| `t64Desert_new.tsx` | — | 171 B | Desert tileset definition |
| `t64Moon_new.tsx` | — | 169 B | Moon tileset definition |
| `t64Snow_new.tsx` | — | 169 B | Snow tileset definition |

### UI Elements (15 files) — `assets/ui/`

| Source File | Size | Used In |
|---|---|---|
| `menuTexture.png` | 2.4 MB | Spritesheet source for menuTexture.json |
| `partsTexture.png` | 885 KB | Spritesheet source for partsTexture.json |
| `dialog.png` | 14 KB | Dialog box backgrounds |
| `b03_square.png` | 17 KB | Square UI box element |
| `classic.png` | 46 KB | Classic UI theme |
| `font02_new.png` | 23 KB | Bitmap font atlas |
| `ammoText_new.png` | 5 KB | Ammo counter text sprite |
| `nameplate1.png` | 8 KB | Player nameplate style 1 |
| `nameplate2.png` | 7 KB | Player nameplate style 2 |
| `nameplate3.png` | 7 KB | Player nameplate style 3 |
| `bullet_new.png` | 3 KB | Bullet icon |
| `dot.png` | 1 KB | Small dot/crosshair pixel |
| `x.png` | 3 KB | X mark / close icon |
| `grass.png` | 2 KB | Grass texture |
| `applink_new.png` | 180 B | App link graphic (NEW) |

### Title Screens (3 files) — `assets/titles/` (NEW)

| Source File | Size | Used In |
|---|---|---|
| `title_ret_logo.png` | 167 KB | `SplashScreen.tsx` — Game logo on splash |
| `title_ret_new.png` | 471 KB | `AssetLoader.ts:titleScreen` — Title background |
| `title_ret2_new.png` | 545 KB | `AssetLoader.ts:titleScreenAlt` — Alt title background |

---

## 2. Spritesheet Data (4 files) — `assets/spritesheets/`

### menuTexture.json (105 KB)
- **Source:** Mini Militia `menuTexture.plist` converted to JSON
- **Image ref:** `../ui/menuTexture.png` (2048×4096)
- **Contains 200+ frames:**
  - **Weapons:** `ak47.png`, `ak47E.png`, `ak47Mag.png`, `aa12.png`, `aa12E.png`, `aa12Mag.png`, `desertEagle.png`, `desertEagleE.png`, `desertEagleMag.png`, `emp.png`, `empE.png`, `empMag.png`
  - **Weapon Icons:** `shotgun.png`, `sniper.png`, `rocket.png`, `mp5.png`, `machete.png`, `grenade.png`, `laser.png`
  - **Avatar Heads:** `head1.png` through `head17.png`
  - **Bodies:** `body1.png` through `body18.png`
  - **Arms:** `arm1.png` through `arm18.png`
  - **UI:** `ammoBar.png`, `ammoBtn.png`, `dualBtn.png`, `b03_big.png`, `b03_bot.png`, `b03_mid.png`, `b03_top.png`, `b03_left.png`, `b03_right.png`, `b03_sml.png`, `darkScale9.png`, `cog.png`, `exit.png`, `check.png`, `arrow.png`, `avatar.png`, `emptyAvatar.png`, `armory.png`, `explosion.png`, `aim.png`, `deflector.png`, `crouchShield.png`
  - **Economy:** `battleCoin.png`, `boost.png`
  - **Badges:** `badge.png`, `badgeAMZ.png`, `badgeAND.png`, `badgeIOS.png`, `badgeWIN.png`
  - **Environment:** `bushFan.png`, `bushLeaf.png`, `bushPalm.png`, `everTree.png`, `bombBlue.png`, `bombOrange.png`

### partsTexture.json (92 KB)
- **Source:** Mini Militia `partsTexture.plist` converted to JSON
- **Image ref:** `../ui/partsTexture.png`
- **Contains 100+ frames:**
  - **Body Types:** `bodyType1.png`, `bodyType2.png`
  - **Face Types:** `faceType1.png` through `faceType4.png`
  - **Avatar Options:** `avatarOption1.png` through `avatarOption6.png`
  - **Eyes:** `eye1.png` through `eye26.png`
  - **Brows:** `brow1.png` through `brow13.png`
  - **Beards:** `beard1.png` through `beard7.png`
  - **Belts:** `belt1.png` through `belt17.png`
  - **Glasses:** `glasses1.png` through `glasses12.png`
  - **Other:** `glove.png`, `foot.png`, `colorSelection.png`, `burn1.png` through `burn8.png`

### menuTexture.plist + partsTexture.plist (original Cocos2d format, kept for reference)

---

## 3. Particle Effects (10 files) — `assets/particles/`

Cocos2d particle system definitions. Parameters: angle, velocity, lifetime, color, size, blend mode.

| Source File | Purpose | Key Parameters |
|---|---|---|
| `Blood.plist` | Blood splatter | max=15, duration=0.1s, 360° variance, additive blend |
| `Grass.plist` | Grass debris | max=15, duration=0.1s |
| `HeavySmoke.plist` | Heavy smoke | max particles, slow fade |
| `Ora.plist` | Orange glow/orb | additive blend |
| `Path.plist` | Trail/path | continuous emission |
| `Rock.plist` | Rock debris | gravity-affected |
| `Shell.plist` | Shell casing ejection | arc emission |
| `Shrapnel.plist` | Shrapnel pieces | random spread |
| `Smoke.plist` | Smoke puff | slow fade, large spread |
| `Stars.plist` | Sparkle/stars | tiny, bright |

---

## 4. Map Files (24 TMX + 4 TSX) — `assets/maps/`

Tiled Map Editor format. Each map defines platforms, spawn points, jump pads, moving platforms, and boxes.

| Map ID | Name | Size |
|---|---|---|
| 0 | Hunger | 16 KB |
| 1 | Outpost | 14 KB |
| 2 | High Tower | 15 KB |
| 3 | Subdivision | 21 KB |
| 4 | Bottle Neck | 28 KB |
| 5 | No Escape | 20 KB |
| 6 | So Long | 18 KB |
| 7 | Lunarcy | 21 KB |
| 8 | Icebox | 20 KB |
| 9 | Snowblind | 17 KB |
| 10 | Pyramid | 28 KB |
| 11 | Catacombs | 25 KB |
| 12 | Overseer | 36 KB |
| 13 | Suspension | 31 KB |
| 14 | Cliffhanger | 35 KB |
| 15 | Crossfire | 31 KB |
| 16 | Undermine | 30 KB |
| 17 | Crucible | 31 KB |
| 18 | Stronghold | 37 KB |
| 19 | Lost Tomb | 22 KB |
| 20 | Deadlock | 17 KB |
| — | King of the Hill | 1.3 MB |
| — | Survival | 11 KB |
| — | Training | 7 KB |

Tileset references: `t64_new.tsx` (128×128 tiles, 4px spacing, 4px margin)

---

## 5. Fonts (44 TTF files) — `assets/fonts/`

All fonts from Mini Militia `assets/fonts/`. Key fonts wired up via @font-face:

| Font File | Tailwind Family | Style |
|---|---|---|
| `SpaceMarine.ttf` | `font-military` | Military stencil |
| `GROBOLD.ttf` | `font-military` | Heavy grotesque |
| `Norwester.ttf` | `font-arcade` | Condensed bold |
| `BebasNeueBold.ttf` | `font-arcade` | Modern condensed |
| `Orbitron-Black.ttf` | `font-sciFi` | Futuristic display |
| `Airborne-Pilot.ttf` | `font-stencil` | Military pilot stencil |
| `digitalix.ttf` | `font-digital` | Digital clock style |

Additional 37 fonts available for future use:
`aAkhirTahun`, `aAppleTea`, `aAreaKilometer50`, `aAreaStencil`, `aAtmospheric`, `aAtomicMd`, `aAutobusOmnibus`, `aBigDeal`, `Arial-BoldMT`, `Arizone-Unicase`, `C800-Regular`, `DejaVuSans-Bold`, `Digitalt`, `Domyouji-Regular`, `Dosis-Bold`, `EncodeSans-Black`, `FORQUE`, `Gila-Bold`, `HeadlineNEWS`, `kimberley`, `LiberationSans-Bold`, `LogoPixies`, `M2MBold`, `Marker Felt`, `Montserrat-Black`, `NueGothicRound`, `Quicksilver`, `Round_Pop`, `SeverSans`, `Sikakusimen__G`, `SportsballRegular`, `Stoicheion`, `TangoSans_Bold`, `TiresiasInfofont`, `Vanillaextract`, `Viafont`, `WagnerModern`

---

## 6. Audio (1 file) — `assets/audio/`

| Source File | Size | Purpose |
|---|---|---|
| `presMix.mp3` | 770 KB | Intro/menu music |

Note: In-game sounds are procedurally generated via Web Audio API (`SoundManager.ts`). The Cocos2d sound bank (`da2sound16.ckb`) uses a proprietary format and is not usable in the browser.

---

## 7. Code Changes Made

### AssetLoader.ts
- Added 3 new texture entries: `titleLogo`, `titleScreen`, `titleScreenAlt`

### SplashScreen.tsx
- Replaced emoji rocket + text title with `title_ret_logo.png` image
- Added `drop-shadow` glow effect on the logo

### index.css
- Added 7 `@font-face` declarations for imported Mini Militia fonts

### tailwind.config.js
- Added 5 new font families: `military`, `arcade`, `sciFi`, `stencil`, `digital`

### cors.config.ts (NEW)
- Shared CORS configuration (bonus fix — resolved WebSocket connection issue)

---

## 8. Spritesheet Frame Reference

### Weapon Frames (menuTexture)
| Battle Jets Weapon | Sprite Frame | Empty Frame | Mag Frame |
|---|---|---|---|
| assault_rifle | `ak47.png` | `ak47E.png` | `ak47Mag.png` |
| shotgun | `aa12.png` | `aa12E.png` | `aa12Mag.png` |
| sniper | `emp.png` | `empE.png` | `empMag.png` |
| pistol | `desertEagle.png` | `desertEagleE.png` | `desertEagleMag.png` |
| rocket_launcher | `ak47.png` | `ak47E.png` | `ak47Mag.png` |
| smg | `aa12.png` | `aa12E.png` | `aa12Mag.png` |
| energy_rifle | `emp.png` | `empE.png` | `empMag.png` |
| grenade_launcher | `ak47.png` | — | — |
| laser | `emp.png` | — | — |
| melee | `machete.png` | — | — |

### Avatar Heads (menuTexture)
| Battle Jets Avatar | Head Frame |
|---|---|
| commander_alpha | `head1.png` |
| scout_delta | `head3.png` |
| heavy_bravo | `head5.png` |
| medic_echo | `head7.png` |
| sniper_foxtrot | `head9.png` |

### Character Parts (partsTexture)
| Part Type | Frames Available |
|---|---|
| Bodies | `body1.png` — `body18.png` |
| Eyes | `eye1.png` — `eye26.png` |
| Brows | `brow1.png` — `brow13.png` |
| Beards | `beard1.png` — `beard7.png` |
| Belts | `belt1.png` — `belt17.png` |
| Glasses | `glasses1.png` — `glasses12.png` |
| Arms | `arm1.png` — `arm18.png` |
| Body Types | `bodyType1.png`, `bodyType2.png` |
| Face Types | `faceType1.png` — `faceType4.png` |
| Avatar Options | `avatarOption1.png` — `avatarOption6.png` |

---

## 9. Complete Asset Directory Tree

```
apps/game-web/public/assets/
├── audio/
│   └── presMix.mp3                          [NEW]
├── backgrounds/
│   ├── bg_new.png
│   ├── bgDesert_new.png
│   ├── bgMoon_new.png
│   ├── bgSnow_new.png
│   ├── stars.png
│   └── worldMap.png
├── characters/
│   ├── da_new.png
│   ├── propack_new.png
│   └── zombie_new.png
├── effects/
│   ├── blast_new.png
│   ├── blasticle_new.png
│   ├── blood_new.png
│   ├── crash_new.png
│   ├── ora_new.png
│   ├── path_new.png
│   ├── rock_new.png
│   ├── shell_new.png
│   ├── shrap_new.png
│   ├── smoke_new.png
│   ├── smokey_new.png
│   ├── spark_new.png
│   ├── splatter_new.png
│   └── streak_new.png
├── fonts/                                   [44 fonts, 36 NEW]
│   ├── Airborne-Pilot.ttf
│   ├── BebasNeueBold.ttf
│   ├── GROBOLD.ttf
│   ├── LiberationSans-Bold.ttf
│   ├── Norwester.ttf
│   ├── Orbitron-Black.ttf
│   ├── SpaceMarine.ttf
│   ├── digitalix.ttf
│   └── ... (36 more)
├── maps/                                    [24 maps, ALL NEW]
│   ├── 0hunger_new.tmx
│   ├── 1outpost_new.tmx
│   ├── ... (19 more numbered maps)
│   ├── kingofthehill.tmx
│   ├── survival_new.tmx
│   └── training_new.tmx
├── particles/                               [10 plists, ALL NEW]
│   ├── Blood.plist
│   ├── Grass.plist
│   ├── HeavySmoke.plist
│   ├── Ora.plist
│   ├── Path.plist
│   ├── Rock.plist
│   ├── Shell.plist
│   ├── Shrapnel.plist
│   ├── Smoke.plist
│   └── Stars.plist
├── spritesheets/
│   ├── menuTexture.json
│   ├── menuTexture.plist                    [kept for reference]
│   ├── partsTexture.json
│   └── partsTexture.plist                   [kept for reference]
├── tilesets/
│   ├── tile64_new.png
│   ├── tile64Desert_new.png
│   ├── tile64Moon_new.png
│   ├── tile64Snow_new.png
│   ├── t64_new.tsx                          [NEW]
│   ├── t64Desert_new.tsx                    [NEW]
│   ├── t64Moon_new.tsx                      [NEW]
│   └── t64Snow_new.tsx                      [NEW]
├── titles/                                  [3 files, ALL NEW]
│   ├── title_ret_logo.png
│   ├── title_ret_new.png
│   └── title_ret2_new.png
└── ui/
    ├── ammoText_new.png
    ├── applink_new.png                       [NEW]
    ├── b03_square.png
    ├── bullet_new.png
    ├── classic.png
    ├── dialog.png
    ├── dot.png
    ├── font02_new.png
    ├── grass.png
    ├── menuTexture.png
    ├── nameplate1.png
    ├── nameplate2.png
    ├── nameplate3.png
    ├── partsTexture.png
    └── x.png
```

---

## Summary

| Category | Before | After | New Files |
|---|---|---|---|
| PNG Textures | 42 | 46 | 4 |
| Spritesheet Data | 4 | 4 | 0 |
| Particle Plists | 0 | 10 | 10 |
| Map Files (TMX) | 0 | 24 | 24 |
| Tileset Defs (TSX) | 0 | 4 | 4 |
| Fonts (TTF) | 8 | 44 | 36 |
| Audio | 0 | 1 | 1 |
| **Total Files** | **54** | **132** | **78** |
