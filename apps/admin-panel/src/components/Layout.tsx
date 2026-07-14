import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import type { NavSection } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  onLocationChange?: (pathname: string) => void;
}

const sectionToPath: Record<NavSection, string> = {
  dashboard: '/',
  characters: '/characters',
  weapons: '/weapons',
  maps: '/maps',
  crosshairs: '/crosshairs',
  jetpacks: '/jetpacks',
  powerups: '/powerups',
  gamemodes: '/gamemodes',
  themes: '/themes',
  assets: '/assets',
  scripts: '/scripts',
  versions: '/versions',
  testing: '/testing',
  publishing: '/publishing',
  players: '/players',
  live: '/live',
  settings: '/settings',
};

export default function Layout({ children, activeSection, onNavigate, onLocationChange }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    onLocationChange?.(location.pathname);
  }, [location.pathname, onLocationChange]);

  const handleNav = (section: NavSection) => {
    onNavigate(section);
    navigate(sectionToPath[section]);
  };

  return (
    <div className="min-h-screen bg-background text-white font-body flex">
      <Sidebar
        active={activeSection}
        onNavigate={handleNav}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
