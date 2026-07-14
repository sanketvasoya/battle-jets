import React from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { soundManager } from '../../utils/SoundManager';
import { X, Volume2, Shield, Eye, Flame } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    volumeMusic,
    volumeSFX,
    graphicsQuality,
    vibration,
    setVolumeMusic,
    setVolumeSFX,
    setGraphicsQuality,
    setVibration,
  } = useSettingsStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md p-6 glass-glow rounded-2xl text-text font-body">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
          <h2 className="text-2xl font-bold font-heading flex items-center gap-2 text-primary">
            <Shield className="w-6 h-6" /> CONTROL CENTER
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface text-textMuted hover:text-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio settings */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xs uppercase tracking-widest text-textMuted font-bold">AUDIO FREQUENCY</h3>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2"><Volume2 className="w-4 h-4 text-primary" /> Music Stream</span>
                <span>{Math.round(volumeMusic * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volumeMusic}
                onChange={(e) => setVolumeMusic(parseFloat(e.target.value))}
                className="w-full h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="flex items-center gap-2"><Volume2 className="w-4 h-4 text-primary" /> Combat Effects</span>
                <span>{Math.round(volumeSFX * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volumeSFX}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolumeSFX(val);
                  soundManager.setVolumeSFX(val);
                  soundManager.playAR(); // test chirp
                }}
                className="w-full h-1 bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Graphics settings */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xs uppercase tracking-widest text-textMuted font-bold font-heading">GRAPHIC RESOLUTION</h3>
          <div className="flex gap-2">
            {(['low', 'medium', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setGraphicsQuality(q)}
                className={`flex-1 py-2 text-sm font-bold uppercase rounded-lg border transition-all ${
                  graphicsQuality === q
                    ? 'bg-primary/20 border-primary text-text shadow-glow'
                    : 'bg-surface/55 border-border text-textMuted hover:border-textMuted'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Miscellaneous */}
        <div className="space-y-4 mb-6">
          <h3 className="text-xs uppercase tracking-widest text-textMuted font-bold">TACTICAL CONTROLS</h3>
          <div className="flex items-center justify-between py-2 border-b border-border/40">
            <span className="text-sm flex items-center gap-2"><Flame className="w-4 h-4 text-secondary" /> Vibration feedback</span>
            <button
              onClick={() => setVibration(!vibration)}
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                vibration ? 'bg-success' : 'bg-surface'
              }`}
            >
              <div
                className={`bg-text w-4 h-4 rounded-full shadow-md transform duration-200 ${
                  vibration ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-surface/40 border border-border/40 p-3 rounded-xl text-xs space-y-1.5 text-textMuted">
          <div className="font-bold text-text mb-1 flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-primary" /> Key Bindings (PC)</div>
          <div className="flex justify-between"><span>Walk / Run</span><span>WASD</span></div>
          <div className="flex justify-between"><span>Jetpack Ascent</span><span>SPACEBAR</span></div>
          <div className="flex justify-between"><span>Aiming Angle</span><span>MOUSE</span></div>
          <div className="flex justify-between"><span>Weapon Trigger</span><span>LEFT CLICK</span></div>
          <div className="flex justify-between"><span>Deploy Grenade</span><span>G Key</span></div>
          <div className="flex justify-between"><span>Weapon Switch</span><span>1 - 4 Key</span></div>
        </div>
      </div>
    </div>
  );
};
export default SettingsModal;
