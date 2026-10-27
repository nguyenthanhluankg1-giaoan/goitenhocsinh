import React from 'react';
import { Play, RotateCcw, Sparkles, Trophy, Volume2 } from 'lucide-react';
import { GameState, Student } from '../types/game';

interface ResultOverlayProps {
  gameState: GameState;
  selectedStudent: Student | null;
  currentCycle: number;
  totalStudents: number;
  uncalledCount: number;
  onContinueNextTurn: () => void;
  onReplayTurn: () => void;
  onStartNewCycle: () => void;
  onSpeakAgain: () => void;
}

export const ResultOverlay: React.FC<ResultOverlayProps> = ({
  gameState,
  selectedStudent,
  currentCycle,
  totalStudents,
  uncalledCount,
  onContinueNextTurn,
  onReplayTurn,
  onStartNewCycle,
  onSpeakAgain,
}) => {
  if (gameState !== 'revealing' && gameState !== 'completed') {
    return null;
  }

  // Case: All students in the list have been called in the current cycle
  if (gameState === 'completed') {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cycle-complete-title"
        data-testid="cycle-completed-modal"
        className="fixed inset-0 z-30 flex items-center justify-center bg-[#040711]/85 p-4"
      >
        <div className="animate-pop-in w-full max-w-2xl rounded-3xl bg-[#0D1736] border-2 border-amber-400 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.9)]">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-amber-400/20 border border-amber-300 flex items-center justify-center">
            <Trophy className="w-11 h-11 text-amber-300" />
          </div>

          <p className="text-sm font-bold uppercase tracking-widest text-cyan-300 mb-2">
            HOÀN THÀNH CHU KỲ {currentCycle}
          </p>

          <h2
            id="cycle-complete-title"
            className="font-display font-extrabold text-3xl md:text-4xl text-amber-300 mb-4"
          >
            TẤT CẢ HỌC SINH ĐÃ ĐƯỢC UFO GỌI TÊN!
          </h2>

          <p className="text-base md:text-lg text-slate-200 max-w-xl mx-auto mb-8">
            Cả lớp ({totalStudents} học sinh) đều đã được UFO May Mắn lựa chọn
            công bằng trong chu kỳ này. Giáo viên có thể bắt đầu chu kỳ mới để
            đặt lại lượt gọi!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              data-start="true"
              onClick={onStartNewCycle}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-lg border-2 border-amber-200 shadow-lg cursor-pointer transition-transform active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              <span>BẮT ĐẦU CHU KỲ MỚI</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case: Grand Reveal of the Chosen Student!
  if (!selectedStudent) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-student-name"
      data-testid="result-reveal-overlay"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#040711]/75 p-4"
    >
      <div className="animate-pop-in relative w-full max-w-3xl rounded-3xl bg-gradient-to-b from-[#111E46] via-[#0B132B] to-[#191238] border-2 border-cyan-300 p-8 md:p-10 text-center shadow-[0_25px_70px_rgba(6,182,212,0.45)]">
        {/* Decorative Corner Stars SVG */}
        <svg
          className="absolute top-5 left-6 w-10 h-10 text-amber-300"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2L14.8 8.8L22 9.5L16.5 14.2L18.2 21.3L12 17.5L5.8 21.3L7.5 14.2L2 9.5L9.2 8.8L12 2Z" />
        </svg>
        <svg
          className="absolute top-5 right-6 w-10 h-10 text-cyan-300"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2L14.8 8.8L22 9.5L16.5 14.2L18.2 21.3L12 17.5L5.8 21.3L7.5 14.2L2 9.5L9.2 8.8L12 2Z" />
        </svg>

        {/* Step 1: BÍ MẬT ĐÃ ĐƯỢC TIẾT LỘ! */}
        <p className="font-display font-bold text-sm md:text-base uppercase tracking-widest text-cyan-300 mb-1">
          BÍ MẬT ĐÃ ĐƯỢC TIẾT LỘ!
        </p>

        {/* Step 2: CHÚC MỪNG! */}
        <p className="font-display font-extrabold text-2xl md:text-3xl text-amber-300 mb-4">
          CHÚC MỪNG!
        </p>

        {/* Step 3: [TÊN HỌC SINH] Zero-Gravity Cosmic Floating Capsule */}
        <div
          data-testid="floating-student-name-capsule"
          className="animate-cosmic-float relative my-6 px-6 py-7 rounded-2xl bg-[#070B19]/95 border-2 border-amber-300 shadow-[0_14px_45px_rgba(251,191,36,0.35),0_0_25px_rgba(34,211,238,0.3)]"
        >
          {/* Floating Cosmic Orbit Ring */}
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full opacity-45"
            viewBox="0 0 600 160"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <ellipse
              cx="300"
              cy="80"
              rx="282"
              ry="62"
              fill="none"
              stroke="#22D3EE"
              strokeWidth="2"
              strokeDasharray="10 8"
            />
          </svg>

          {/* Weightless Floating Star Satellite Top-Left */}
          <span
            className="animate-orbit-badge pointer-events-none absolute -top-3.5 left-8 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111E46] border border-cyan-300 text-cyan-200 text-xs font-bold shadow-md"
            aria-hidden="true"
          >
            ✦ TRÔI NỔI VŨ TRỤ
          </span>

          {/* Weightless Floating Star Satellite Bottom-Right */}
          <span
            className="animate-orbit-badge pointer-events-none absolute -bottom-3.5 right-8 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#191238] border border-amber-300 text-amber-200 text-xs font-bold shadow-md"
            style={{ animationDelay: '-1.6s' }}
            aria-hidden="true"
          >
            🛸 NGÔI SAO MAY MẮN
          </span>

          <h2
            id="reveal-student-name"
            data-testid="revealed-student-name"
            className="animate-cosmic-name-wave relative z-10 font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight break-words drop-shadow-[0_4px_18px_rgba(34,211,238,0.55)]"
          >
            {selectedStudent.name}
          </h2>
        </div>

        {/* Step 4: Bạn đã được UFO MAY MẮN lựa chọn! */}
        <p className="font-display font-bold text-xl md:text-2xl text-cyan-200 mb-2">
          Bạn đã được UFO MAY MẮN lựa chọn!
        </p>

        <p className="text-xs md:text-sm text-slate-300 mb-7">
          Còn lại {uncalledCount} / {totalStudents} học sinh chưa được gọi trong chu kỳ {currentCycle}
        </p>

        {/* Action Buttons: TIẾP TỤC, CHƠI LẠI, ĐỌC LẠI TÊN */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            data-testid="btn-continue-after-reveal"
            onClick={onContinueNextTurn}
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display font-extrabold text-lg border-2 border-emerald-200 shadow-lg cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>TIẾP TỤC</span>
          </button>

          <button
            type="button"
            data-testid="btn-replay-after-reveal"
            onClick={onReplayTurn}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-lg border-2 border-amber-200 shadow-lg cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
          >
            <RotateCcw className="w-5 h-5" />
            <span>CHƠI LẠI</span>
          </button>

          <button
            type="button"
            onClick={onSpeakAgain}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[#1E293B] hover:bg-[#334155] text-cyan-200 font-bold text-sm border border-cyan-400/50 cursor-pointer transition-colors whitespace-nowrap"
          >
            <Volume2 className="w-4 h-4 text-cyan-300" />
            <span>ĐỌC LẠI TÊN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
