import React from 'react';
import { RotateCcw, Settings, Volume2, X } from 'lucide-react';
import { EventProbabilities, GameSettingsConfig } from '../types/game';
import {
  adjustProbabilitiesTo100,
  DEFAULT_SETTINGS,
} from '../engine/RandomSelectionEngine';
import { audioManager } from '../engine/AudioManager';

interface GameSettingsProps {
  isOpen: boolean;
  settings: GameSettingsConfig;
  onClose: () => void;
  onUpdateSettings: (next: GameSettingsConfig) => void;
  onToggleFullscreen: () => void;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
  isOpen,
  settings,
  onClose,
  onUpdateSettings,
  onToggleFullscreen,
}) => {
  if (!isOpen) return null;

  const hasViVoice = audioManager.hasVietnameseVoiceSupport();

  const handleProbChange = (
    key: keyof EventProbabilities,
    rawValue: number
  ) => {
    const balanced = adjustProbabilitiesTo100(
      settings.probabilities,
      key,
      rawValue
    );
    onUpdateSettings({
      ...settings,
      probabilities: balanced,
    });
  };

  const probTotal =
    settings.probabilities.catch +
    settings.probabilities.miss +
    settings.probabilities.falseSignal +
    settings.probabilities.nearMiss;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-settings-title"
      data-testid="game-settings-modal"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#040711]/85 p-4"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0B132B] border-2 border-amber-400/60 shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#191636] border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-amber-300" />
            <h2
              id="game-settings-title"
              className="font-display font-extrabold text-xl md:text-2xl text-white"
            >
              CÀI ĐẶT TRÒ CHƠI UFO MAY MẮN
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng cài đặt"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Sound & Vietnamese Speech */}
          <div className="p-5 rounded-2xl bg-[#070B19]/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-cyan-300 flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                <span>1. Âm thanh hiệu ứng & Giọng đọc Tiếng Việt</span>
              </h3>
              <span className="text-xs text-slate-400">
                {hasViVoice
                  ? '✓ Trình duyệt hỗ trợ giọng đọc Tiếng Việt (vi-VN)'
                  : 'ℹ️ Trình duyệt dùng phụ đề sân khấu & giọng mặc định'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Sound Master Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <div className="font-semibold text-sm text-white">
                    Bật âm thanh tổng
                  </div>
                  <div className="text-xs text-slate-400">
                    Bật/tắt toàn bộ hiệu ứng âm thanh và lời đọc
                  </div>
                </div>
                <input
                  type="checkbox"
                  aria-label="Bật âm thanh tổng"
                  checked={settings.soundEnabled}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      soundEnabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Voice Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <div className="font-semibold text-sm text-white">
                    Bật giọng đọc Tiếng Việt
                  </div>
                  <div className="text-xs text-slate-400">
                    Đọc lời thoại dẫn chuyện và xướng tên học sinh
                  </div>
                </div>
                <input
                  type="checkbox"
                  aria-label="Bật giọng đọc Tiếng Việt"
                  checked={settings.voiceEnabled}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      voiceEnabled: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* SFX Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <label htmlFor="sfx-volume-slider" className="text-slate-300">
                    Âm lượng hiệu ứng UFO:
                  </label>
                  <span className="font-mono-num text-cyan-300">
                    {Math.round(settings.sfxVolume * 100)}%
                  </span>
                </div>
                <input
                  id="sfx-volume-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.sfxVolume}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      sfxVolume: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Voice Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <label htmlFor="voice-volume-slider" className="text-slate-300">
                    Âm lượng giọng đọc:
                  </label>
                  <span className="font-mono-num text-cyan-300">
                    {Math.round(settings.voiceVolume * 100)}%
                  </span>
                </div>
                <input
                  id="voice-volume-slider"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.voiceVolume}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      voiceVolume: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Speech Rate */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <label htmlFor="voice-rate-slider" className="text-slate-300">
                    Tốc độ giọng đọc:
                  </label>
                  <span className="font-mono-num text-amber-300">
                    {settings.voiceRate.toFixed(1)}x
                  </span>
                </div>
                <input
                  id="voice-rate-slider"
                  type="range"
                  min={0.7}
                  max={1.4}
                  step={0.1}
                  value={settings.voiceRate}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      voiceRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Test Voice Button */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    audioManager.unlockAudioByUserGesture();
                    audioManager.playVictoryRevealFanfare(settings);
                    audioManager.speakVietnamese(
                      'Xin chào cả lớp! UFO May Mắn đã sẵn sàng!',
                      settings
                    );
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold text-xs cursor-pointer"
                >
                  Nghe thử âm thanh & giọng đọc
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Probabilities of Events (Sums to 100%) */}
          <div className="p-5 rounded-2xl bg-[#070B19]/90 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-lg text-amber-300">
                  2. Tỉ lệ xác suất tình huống của từng lần thử (Tổng = {probTotal}%)
                </h3>
                <p className="text-xs text-slate-400">
                  Áp dụng cho kịch bản mỗi lần UFO thử bắt. Khi đến lượt bắt trúng, mỗi học sinh chưa gọi đều có cơ hội ngang nhau 100% công bằng.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Catch % */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <label htmlFor="prob-catch-slider" className="text-emerald-300">
                    Bắt trúng (Mặc định 60%):
                  </label>
                  <span
                    data-testid="prob-catch-value"
                    className="font-mono-num text-emerald-300"
                  >
                    {settings.probabilities.catch}%
                  </span>
                </div>
                <input
                  id="prob-catch-slider"
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={settings.probabilities.catch}
                  onChange={(e) =>
                    handleProbChange('catch', parseInt(e.target.value, 10))
                  }
                  className="w-full accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* Miss % */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <label htmlFor="prob-miss-slider" className="text-pink-300">
                    Bắt hụt hài hước (Mặc định 25%):
                  </label>
                  <span
                    data-testid="prob-miss-value"
                    className="font-mono-num text-pink-300"
                  >
                    {settings.probabilities.miss}%
                  </span>
                </div>
                <input
                  id="prob-miss-slider"
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={settings.probabilities.miss}
                  onChange={(e) =>
                    handleProbChange('miss', parseInt(e.target.value, 10))
                  }
                  className="w-full accent-pink-400 cursor-pointer"
                />
              </div>

              {/* False Signal % */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <label htmlFor="prob-false-slider" className="text-purple-300">
                    Bắt nhầm tín hiệu giả (Mặc định 10%):
                  </label>
                  <span
                    data-testid="prob-false-value"
                    className="font-mono-num text-purple-300"
                  >
                    {settings.probabilities.falseSignal}%
                  </span>
                </div>
                <input
                  id="prob-false-slider"
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={settings.probabilities.falseSignal}
                  onChange={(e) =>
                    handleProbChange(
                      'falseSignal',
                      parseInt(e.target.value, 10)
                    )
                  }
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>

              {/* Near Miss % */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <label htmlFor="prob-nearmiss-slider" className="text-amber-300">
                    Suýt bắt được (Mặc định 5%):
                  </label>
                  <span
                    data-testid="prob-nearmiss-value"
                    className="font-mono-num text-amber-300"
                  >
                    {settings.probabilities.nearMiss}%
                  </span>
                </div>
                <input
                  id="prob-nearmiss-slider"
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={settings.probabilities.nearMiss}
                  onChange={(e) =>
                    handleProbChange('nearMiss', parseInt(e.target.value, 10))
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Gameplay Pacing, No-Repeat Rule & Display */}
          <div className="p-5 rounded-2xl bg-[#070B19]/90 border border-slate-800 space-y-4">
            <h3 className="font-display font-bold text-lg text-purple-300">
              3. Cơ chế gọi tên, Tốc độ hoạt ảnh & Hiển thị
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* No Repeat Mode */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <div className="font-semibold text-sm text-white">
                    Không gọi trùng cho đến khi hết danh sách
                  </div>
                  <div className="text-xs text-slate-400">
                    Mặc định bật để đảm bảo mọi học sinh đều được gọi công bằng
                  </div>
                </div>
                <input
                  type="checkbox"
                  aria-label="Không gọi trùng cho đến khi hết danh sách"
                  checked={settings.noRepeatInCycle}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      noRepeatInCycle: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-emerald-400 cursor-pointer"
                />
              </div>

              {/* 2D Projector Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <div className="font-semibold text-sm text-white">
                    Chế độ sân khấu 2D siêu nhẹ (Dự phòng)
                  </div>
                  <div className="text-xs text-slate-400">
                    Bật nếu máy chiếu lớp học đời cũ không hỗ trợ đồ họa 3D
                  </div>
                </div>
                <input
                  type="checkbox"
                  aria-label="Chế độ sân khấu 2D siêu nhẹ"
                  checked={settings.prefer2DFallback}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      prefer2DFallback: e.target.checked,
                    })
                  }
                  className="w-5 h-5 accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Animation Speed */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <label htmlFor="anim-speed-slider" className="text-slate-300">
                    Tốc độ hoạt ảnh UFO:
                  </label>
                  <span className="font-mono-num text-cyan-300">
                    {settings.animationSpeed.toFixed(1)}x
                  </span>
                </div>
                <input
                  id="anim-speed-slider"
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={settings.animationSpeed}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      animationSpeed: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Scan Duration */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <label htmlFor="scan-duration-slider" className="text-slate-300">
                    Thời lượng mỗi lần săn tìm:
                  </label>
                  <span className="font-mono-num text-cyan-300">
                    {settings.scanDurationSeconds.toFixed(1)} giây
                  </span>
                </div>
                <input
                  id="scan-duration-slider"
                  type="range"
                  min={1.5}
                  max={8.0}
                  step={0.5}
                  value={settings.scanDurationSeconds}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      scanDurationSeconds: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Max Consecutive Misses */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <label htmlFor="max-misses-slider" className="text-slate-300">
                    Số lần bắt hụt liên tiếp tối đa (Mặc định 4):
                  </label>
                  <span className="font-mono-num text-pink-300">
                    Tối đa {settings.maxConsecutiveMisses} lần
                  </span>
                </div>
                <input
                  id="max-misses-slider"
                  type="range"
                  min={0}
                  max={6}
                  step={1}
                  value={settings.maxConsecutiveMisses}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      maxConsecutiveMisses: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full accent-pink-400 cursor-pointer"
                />
              </div>

              {/* Fullscreen Toggle inside Settings */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div>
                  <div className="font-semibold text-sm text-white">
                    Chế độ toàn màn hình (16:9 Máy chiếu)
                  </div>
                  <div className="text-xs text-slate-400">
                    Mở rộng toàn màn hình khi trình chiếu trên lớp
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleFullscreen}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold text-xs cursor-pointer"
                >
                  {settings.fullscreen ? 'Thoát toàn màn hình' : 'Bật toàn màn hình'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#111E46] border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onUpdateSettings({ ...DEFAULT_SETTINGS })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-sm cursor-pointer"
          >
            Lưu & Đóng cài đặt
          </button>
        </div>
      </div>
    </div>
  );
};
