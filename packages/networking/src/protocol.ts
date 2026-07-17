import type { Room, PlayerInput, WeaponType, GameState, Vector2 } from '@battle-jets/shared';

export interface MatchResults {
  winnerId: string | null;
  winnerName: string;
  results: {
    playerId: string;
    username: string;
    kills: number;
    deaths: number;
  }[];
}

export interface KillFeedEvent {
  killerId: string;
  killerName: string;
  victimId: string;
  victimName: string;
  weapon: WeaponType;
  timestamp: number;
}

export interface AuthSuccessData {
  success: boolean;
  player: {
    id: string;
    username: string;
    avatar: string;
    level: number;
    coins: number;
    wins: number;
    losses: number;
    xp: number;
    token?: string;
  };
  message?: string;
}

export interface ServerToClientEvents {
  'room:update': (room: Room | null) => void;
  'game:start': () => void;
  'game:state': (state: any) => void;
  'game:end': (data: MatchResults) => void;
  'game:death': (data: { playerId: string }) => void;
  'game:respawn': (data: { playerId: string; position: Vector2 }) => void;
  'game:killfeed': (kill: KillFeedEvent) => void;
  'game:countdown': (data: { seconds: number }) => void;
  'error': (data: { message: string }) => void;
  'auth:success': (data: AuthSuccessData) => void;
  'rooms:refresh': (rooms: Room[]) => void;
}

export interface ClientToServerEvents {
  'room:join': (payload: { code: string }, callback?: (res: { success: boolean; room?: Room; error?: string }) => void) => void;
  'room:create': (payload: { isPublic: boolean; mapId: string }, callback?: (res: { success: boolean; room?: Room; error?: string }) => void) => void;
  'room:leave': (payload: { code: string }) => void;
  'room:ready': (payload: { code: string; ready: boolean }) => void;
  'room:list': (payload: Record<string, never>, callback?: (res: { success: boolean; rooms: Room[]; error?: string }) => void) => void;
  'game:input': (input: PlayerInput) => void;
  'game:weapon': (weapon: WeaponType) => void;
  'game:grenade': (payload: { angle: number }) => void;
  'leaderboard:get': (payload: Record<string, never>, callback?: (res: any) => void) => void;
  'auth:guest': (payload: { username: string; avatar: string }) => void;
}

export interface GameProtocol {
  on<K extends keyof ServerToClientEvents>(event: K, handler: ServerToClientEvents[K]): void;
  off<K extends keyof ServerToClientEvents>(event: K, handler?: ServerToClientEvents[K]): void;
  emit<K extends keyof ClientToServerEvents>(event: K, ...args: Parameters<ClientToServerEvents[K]>): void;
  connect(): void;
  disconnect(): void;
  get id(): string | undefined;
  get connected(): boolean;
}
