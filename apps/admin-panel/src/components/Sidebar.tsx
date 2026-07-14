import React from 'react';
import { Shield, LayoutDashboard, Users, Swords, Map, Crosshair, Rocket, Zap, Gamepad2, Palette, FolderOpen, Code, History, TestTube, Upload, Activity, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import type { NavSection } from '../types';

const NAV_ITEMS: { key: NavSection; label: string; icon: React.ReactNode; group: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, group: 'Overview' },
  { key: 'characters', label: 'Characters', icon: <Users className="w-4 h-4" />, group: 'Content' },
  { key: 'weapons', label: 'Weapons', icon: <Swords className="w-4 h-4" />, group: 'Content' },
  { key: 'maps', label: 'Maps', icon: <Map className="w-4 h-4" />, group: 'Content' },
  { key: 'crosshairs', label: 'Crosshairs', icon: <Crosshair className="w-4 h-4" />, group: 'Content' },
  { key: 'jetpacks', label: 'Jetpacks', icon: <Rocket className="w-4 h-4" />, group: 'Content' },
  { key: 'powerups', label: 'Power-Ups', icon: <Zap className="w-4 h-4" />, group: 'Content' },
  { key: 'gamemodes', label: 'Game Modes', icon: <Gamepad2 className="w-4 h-4" />, group: 'Content' },
  { key: 'themes', label: 'Themes', icon: <Palette className="w-4 h-4" />, group: 'Content' },
  { key: 'assets', label: 'Assets', icon: <FolderOpen className="w-4 h-4" />, group: 'Tools' },
  { key: 'scripts', label: 'Scripts', icon: <Code className="w-4 h-4" />, group: 'Tools' },
  { key: 'versions', label: 'Version History', icon: <History className="w-4 h-4" />, group: 'Tools' },
  { key: 'testing', label: 'Live Testing', icon: <TestTube className="w-4 h-4" />, group: 'Tools' },
  { key: 'publishing', label: 'Publishing', icon: <Upload className="w-4 h-4" />, group: 'Tools' },
  { key: 'players', label: 'Players', icon: <Users className="w-4 h-4" />, group: 'Admin' },
  { key: 'live', label: 'Live Matches', icon: <Activity className="w-4 h-4" />, group: 'Admin' },
  { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" />, group: 'Admin' },
];

interface SidebarProps {
  active: NavSection;
  onNavigate: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ active, onNavigate, collapsed, onToggleCollapse }: SidebarProps) {
  const groups = [...new Set(NAV_ITEMS.map(item => item.group))];

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-56'} glass border-r border-border flex-shrink-0 flex flex-col transition-all duration-200`}>
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-4 border-b border-border/50`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-heading font-bold text-lg">BattleJets</span>
          </div>
        )}
        {collapsed && <Shield className="w-6 h-6 text-primary" />}
        <button
          onClick={onToggleCollapse}
          className="text-textMuted hover:text-white p-1 rounded transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {groups.map(group => (
          <div key={group}>
            {!collapsed && (
              <p className="text-[10px] text-textMuted uppercase tracking-widest px-3 mb-1 font-bold">{group}</p>
            )}
            {NAV_ITEMS.filter(item => item.group === group).map(item => (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 ${collapsed ? 'justify-center px-2' : 'px-3'} py-2 rounded-xl transition-all text-sm font-medium ${
                  active === item.key
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-textMuted hover:text-white hover:bg-surface border border-transparent'
                }`}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
