import { create } from 'zustand';

interface SettingsState {
  volumeMusic: number;
  volumeSFX: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  vibration: boolean;
  setVolumeMusic: (val: number) => void;
  setVolumeSFX: (val: number) => void;
  setGraphicsQuality: (val: 'low' | 'medium' | 'high') => void;
  setVibration: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => {
  const cachedMusic = localStorage.getItem('bj_settings_music');
  const cachedSFX = localStorage.getItem('bj_settings_sfx');
  const cachedQuality = localStorage.getItem('bj_settings_quality');
  const cachedVibration = localStorage.getItem('bj_settings_vibration');

  return {
    volumeMusic: cachedMusic !== null ? parseFloat(cachedMusic) : 0.5,
    volumeSFX: cachedSFX !== null ? parseFloat(cachedSFX) : 0.7,
    graphicsQuality: cachedQuality !== null ? (cachedQuality as any) : 'high',
    vibration: cachedVibration !== null ? cachedVibration === 'true' : true,

    setVolumeMusic: (val) => {
      localStorage.setItem('bj_settings_music', val.toString());
      set({ volumeMusic: val });
    },
    setVolumeSFX: (val) => {
      localStorage.setItem('bj_settings_sfx', val.toString());
      set({ volumeSFX: val });
    },
    setGraphicsQuality: (val) => {
      localStorage.setItem('bj_settings_quality', val);
      set({ graphicsQuality: val });
    },
    setVibration: (val) => {
      localStorage.setItem('bj_settings_vibration', val.toString());
      set({ vibration: val });
    }
  };
});
