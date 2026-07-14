import React, { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import type { NavSection } from './types';

import Dashboard from './pages/Dashboard';
import CharacterList from './pages/CharacterList';
import CharacterBuilder from './pages/CharacterBuilder';
import WeaponList from './pages/WeaponList';
import WeaponBuilder from './pages/WeaponBuilder';
import MapList from './pages/MapList';
import MapBuilder from './pages/MapBuilder';
import CrosshairList from './pages/CrosshairList';
import CrosshairBuilder from './pages/CrosshairBuilder';
import JetpackList from './pages/JetpackList';
import JetpackBuilder from './pages/JetpackBuilder';
import PowerUpList from './pages/PowerUpList';
import PowerUpBuilder from './pages/PowerUpBuilder';
import GameModeList from './pages/GameModeList';
import GameModeBuilder from './pages/GameModeBuilder';
import ThemeList from './pages/ThemeList';
import ThemeBuilder from './pages/ThemeBuilder';
import AssetManager from './pages/AssetManager';
import ScriptEditor from './pages/ScriptEditor';
import VersionHistory from './pages/VersionHistory';
import LiveTesting from './pages/LiveTesting';
import Publishing from './pages/Publishing';
import PlayerList from './pages/PlayerList';
import LiveMatches from './pages/LiveMatches';
import Settings from './pages/Settings';

function sectionFromPath(pathname: string): NavSection {
  if (pathname.startsWith('/characters')) return 'characters';
  if (pathname.startsWith('/weapons')) return 'weapons';
  if (pathname.startsWith('/maps')) return 'maps';
  if (pathname.startsWith('/crosshairs')) return 'crosshairs';
  if (pathname.startsWith('/jetpacks')) return 'jetpacks';
  if (pathname.startsWith('/powerups')) return 'powerups';
  if (pathname.startsWith('/gamemodes')) return 'gamemodes';
  if (pathname.startsWith('/themes')) return 'themes';
  if (pathname.startsWith('/assets')) return 'assets';
  if (pathname.startsWith('/scripts')) return 'scripts';
  if (pathname.startsWith('/versions')) return 'versions';
  if (pathname.startsWith('/testing')) return 'testing';
  if (pathname.startsWith('/publishing')) return 'publishing';
  if (pathname.startsWith('/players')) return 'players';
  if (pathname.startsWith('/live')) return 'live';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'dashboard';
}

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');

  const handleNavigate = useCallback((section: NavSection) => {
    setActiveSection(section);
  }, []);

  const handleLocationChange = useCallback((pathname: string) => {
    setActiveSection(sectionFromPath(pathname));
  }, []);

  return (
    <BrowserRouter>
      <Layout activeSection={activeSection} onNavigate={handleNavigate} onLocationChange={handleLocationChange}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/characters" element={<CharacterList />} />
          <Route path="/characters/:id/build" element={<CharacterBuilderPage />} />
          <Route path="/weapons" element={<WeaponList />} />
          <Route path="/weapons/:id/build" element={<WeaponBuilderPage />} />
          <Route path="/weapons/new/build" element={<WeaponBuilderPage />} />
          <Route path="/maps" element={<MapList />} />
          <Route path="/maps/:id/build" element={<MapBuilderPage />} />
          <Route path="/crosshairs" element={<CrosshairList />} />
          <Route path="/crosshairs/:id/build" element={<CrosshairBuilderPage />} />
          <Route path="/crosshairs/new/build" element={<CrosshairBuilderPage />} />
          <Route path="/jetpacks" element={<JetpackList />} />
          <Route path="/jetpacks/:id/build" element={<JetpackBuilderPage />} />
          <Route path="/jetpacks/new/build" element={<JetpackBuilderPage />} />
          <Route path="/powerups" element={<PowerUpList />} />
          <Route path="/powerups/:id/build" element={<PowerUpBuilderPage />} />
          <Route path="/powerups/new/build" element={<PowerUpBuilderPage />} />
          <Route path="/gamemodes" element={<GameModeList />} />
          <Route path="/gamemodes/:id/build" element={<GameModeBuilderPage />} />
          <Route path="/gamemodes/new/build" element={<GameModeBuilderPage />} />
          <Route path="/themes" element={<ThemeList />} />
          <Route path="/themes/:id/build" element={<ThemeBuilderPage />} />
          <Route path="/themes/new/build" element={<ThemeBuilderPage />} />
          <Route path="/assets" element={<AssetManager />} />
          <Route path="/scripts" element={<ScriptEditorPage />} />
          <Route path="/scripts/:id" element={<ScriptEditorPage />} />
          <Route path="/versions" element={<VersionHistory />} />
          <Route path="/testing" element={<LiveTesting />} />
          <Route path="/publishing" element={<Publishing />} />
          <Route path="/players" element={<PlayerList />} />
          <Route path="/live" element={<LiveMatches />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

// Route wrappers that extract params and handle navigation via react-router
function CharacterBuilderPage() {
  const { id } = useParams<{ id: string }>();
  return <CharacterBuilder characterId={id!} />;
}

function WeaponBuilderPage() {
  const { id } = useParams<{ id: string }>();
  return <WeaponBuilder weaponId={id} />;
}

function MapBuilderPage() {
  const { id } = useParams<{ id: string }>();
  return <MapBuilder mapId={id!} />;
}

function CrosshairBuilderPage() {
  const { id } = useParams<{ id: string }>();
  return <CrosshairBuilder crosshairId={id} />;
}

function JetpackBuilderPage() {
  const { id } = useParams<{ id: string }>();
  return <JetpackBuilder jetpackId={id} />;
}

function PowerUpBuilderPage() {
  const { id } = useParams<{ id: string }>();
  return <PowerUpBuilder powerupId={id} />;
}

function GameModeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  return <GameModeBuilder gameModeId={id} />;
}

function ThemeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  return <ThemeBuilder themeId={id} />;
}

function ScriptEditorPage() {
  const { id } = useParams<{ id: string }>();
  return <ScriptEditor scriptId={id} />;
}
