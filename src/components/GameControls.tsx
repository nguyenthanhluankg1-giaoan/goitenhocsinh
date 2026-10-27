import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  History,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Square,
  Users,
  Volume2,
  VolumeX,
  LogOut,
  CloudCheck,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { GameSettingsConfig, GameState } from '../types/game';

export interface TeacherAccountProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface GameControlsProps {
  gameState: GameState;
  bannerMessage: string;
  classNameTitle: string;
  totalStudents: number;
  calledStudentsCount: number;
  uncalledStudentsCount: number;
  currentCycle: number;
  consecutiveMisses: number;
  settings: GameSettingsConfig;
  teacherUser?: TeacherAccountProfile | null;
  isAuthLoading?: boolean;
  isSyncingCloud?: boolean;
  onGoogleLogin?: () => void;
  onGoogleLogout?: () => void;
  onToggleQuiz?: () => void;
  onOpenQuestionBank?: () => void;
  onStartHunt: () => void;
  onStopGame: () => void;
  onPauseOrResume: () => void;
  onReplay: () => void;
  onOpenStudentManager: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameState,
  bannerMessage,
  classNameTitle,
  totalStudents,
  calledStudentsCount,
  uncalledStudentsCount,
  currentCycle,
  consecutiveMisses,
  settings,
  teacherUser,
  isAuthLoading = false,
  isSyncingCloud = false,
  onGoogleLogin,
  onGoogleLogout,
  onToggleQuiz,
  onOpenQuestionBank,
  onStartHunt,
  onStopGame,
  onPauseOrResume,
  onReplay,
  onOpenStudentManager,
  onOpenHistory,
  onOpenSettings,
  onToggleSound,
  onToggleFullscreen,
}) => {
  const [dockCollapsed, setDockCollapsed] = useState(false);

  const isHunting =
    gameState === 'entering' ||
    gameState === 'scanning' ||
    gameState === 'locking' ||
    gameState === 'missing' ||
    gameState === 'falseSignal' ||
    gameState === 'catching';

  const canResume =
    gameState === 'paused' ||
    gameState === 'stopped' ||
    gameState === 'revealing';

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 md:p-6">
      {/* Top Stage Header & Vietnamese Broadcast Banner */}
      <div className="flex flex-col items-center gap-3 w-full max-w-6xl mx-auto">
        {/* Top Perimeter Bar: Title Emblem Left + Live Classroom Stats + Google Cloud Account Right */}
        <div className="w-full flex flex-wrap items-center justify-between gap-4 bg-[#0B132B]/95 border border-cyan-500/35 rounded-2xl px-5 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.65)] pointer-events-auto">
          {/* Custom Inline SVG UFO Emblem + Title */}
          <div className="flex items-center gap-3">
            <svg
              width="40"
              height="40"
              viewBox="0 0 48 48"
              className="shrink-0"
              aria-hidden="true"
            >
              <circle cx="24" cy="24" r="22" fill="#1E1B4B" stroke="#22D3EE" strokeWidth="2" />
              <path
                d="M15 24 A9 8 0 0 1 33 24 Z"
                fill="#67E8F9"
                stroke="#22D3EE"
                strokeWidth="1.5"
              />
              <ellipse
                cx="24"
                cy="26"
                rx="16"
                ry="5.5"
                fill="#3B82F6"
                stroke="#FBBF24"
                strokeWidth="1.8"
              />
              <circle cx="16" cy="26" r="1.8" fill="#F472B6" />
              <circle cx="24" cy="27.5" r="1.8" fill="#FACC15" />
              <circle cx="32" cy="26" r="1.8" fill="#4ADE80" />
            </svg>
            <div>
              <h1 className="font-display font-extrabold text-lg md:text-xl tracking-wide text-amber-300 leading-tight">
                UFO MAY MẮN – AI SẼ ĐƯỢC UFO CHỌN?
              </h1>
              <div className="flex items-center gap-2 text-xs text-cyan-200 font-medium">
                <span>{classNameTitle}</span>
                <span aria-hidden="true">·</span>
                <span>Chu kỳ {currentCycle}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {settings.noRepeatInCycle ? 'Không gọi trùng' : 'Cho phép gọi trùng'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Classroom Counters & Teacher Google Account Cloud Sync */}
          <div className="flex flex-wrap items-center gap-5 text-right">
            <div className="flex items-center gap-5">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  TỔNG SĨ SỐ
                </div>
                <div
                  data-testid="stat-total-students"
                  className="font-mono-num text-xl font-extrabold text-white"
                >
                  {totalStudents}
                </div>
              </div>
              <div className="h-7 w-px bg-slate-700" aria-hidden="true" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                  CHƯA GỌI
                </div>
                <div
                  data-testid="stat-uncalled-students"
                  className="font-mono-num text-xl font-extrabold text-cyan-300"
                >
                  {uncalledStudentsCount}
                </div>
              </div>
              <div className="h-7 w-px bg-slate-700" aria-hidden="true" />
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  ĐÃ GỌI
                </div>
                <div
                  data-testid="stat-called-students"
                  className="font-mono-num text-xl font-extrabold text-amber-300"
                >
                  {calledStudentsCount}
                </div>
              </div>
              {consecutiveMisses > 0 && (
                <>
                  <div className="h-7 w-px bg-slate-700" aria-hidden="true" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-pink-300">
                      BẮT HỤT LIÊN TIẾP
                    </div>
                    <div className="font-mono-num text-xl font-extrabold text-pink-400">
                      {consecutiveMisses}/{settings.maxConsecutiveMisses}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-8 w-px bg-slate-700 hidden sm:block" aria-hidden="true" />

            {/* Google Account Login & Cloud Storage Sync Status */}
            {teacherUser ? (
              <div
                data-testid="google-account-badge"
                className="flex items-center gap-2.5 bg-[#131F42] border border-emerald-400/50 rounded-xl px-3 py-1.5 text-left"
              >
                {teacherUser.photoURL ? (
                  <img
                    src={teacherUser.photoURL}
                    alt={teacherUser.displayName || 'Giáo viên'}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full border border-emerald-300 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 font-bold text-xs shrink-0">
                    {(teacherUser.displayName || teacherUser.email || 'G')
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="max-w-[140px]">
                  <div className="text-xs font-bold text-white truncate">
                    {teacherUser.displayName || teacherUser.email || 'Giáo viên'}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                    <CloudCheck className="w-3 h-3 shrink-0" />
                    <span>{isSyncingCloud ? 'Đang lưu...' : 'Đã lưu Google'}</span>
                  </div>
                </div>
                {onGoogleLogout && (
                  <button
                    type="button"
                    data-testid="btn-google-logout"
                    onClick={onGoogleLogout}
                    title="Đăng xuất tài khoản Google"
                    className="ml-1 p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-400/50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              onGoogleLogin && (
                <button
                  type="button"
                  data-testid="btn-google-login"
                  disabled={isAuthLoading}
                  onClick={onGoogleLogin}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs md:text-sm border border-amber-300 shadow-[0_4px_14px_rgba(255,255,255,0.18)] transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>
                    {isAuthLoading ? 'Đang kết nối...' : 'Đăng nhập Google'}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Khu vực thông báo (Vietnamese Dramatic Broadcast Banner) */}
        <div
          role="status"
          aria-live="polite"
          data-testid="stage-announcement-banner"
          className={`pointer-events-auto px-7 py-2.5 rounded-2xl border-2 shadow-[0_12px_32px_rgba(0,0,0,0.75)] transition-colors duration-200 max-w-3xl text-center ${
            gameState === 'missing'
              ? 'bg-[#2E1035]/95 border-pink-400 text-pink-200'
              : gameState === 'falseSignal'
              ? 'bg-[#271745]/95 border-purple-400 text-purple-200'
              : gameState === 'catching' || gameState === 'revealing'
              ? 'bg-[#0F2942]/95 border-amber-300 text-amber-200'
              : 'bg-[#0B1736]/95 border-cyan-400 text-cyan-100'
          }`}
        >
          <p className="font-display font-extrabold text-lg md:text-2xl tracking-wide">
            {bannerMessage}
          </p>
        </div>
      </div>

      {/* Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center pointer-events-auto">
        {/* Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={() => setDockCollapsed((prev) => !prev)}
          className="flex items-center gap-1.5 px-4 py-1 rounded-t-xl bg-[#0B132B] border-t border-x border-cyan-500/40 text-xs font-semibold text-cyan-200 hover:text-white hover:bg-[#152247] transition-colors cursor-pointer whitespace-nowrap"
          aria-expanded={!dockCollapsed}
          aria-label={dockCollapsed ? 'Hiện bảng điều khiển' : 'Ẩn bảng điều khiển'}
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Hiện điều khiển</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Ẩn điều khiển</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="w-full bg-[#0B132B]/95 border-2 border-cyan-500/40 rounded-2xl px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.85)] flex flex-wrap items-center justify-center gap-2.5">
            {/* 1. BẮT ĐẦU SĂN TÌM */}
            <button
              type="button"
              data-start="true"
              onClick={(e) => {
                e.currentTarget.blur();
                onStartHunt();
              }}
              disabled={isHunting}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-display font-extrabold text-sm md:text-base transition-transform cursor-pointer whitespace-nowrap shrink-0 ${
                isHunting
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.45)] active:scale-95'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>BẮT ĐẦU SĂN TÌM</span>
            </button>

            {/* 2. DỪNG TRÒ CHƠI */}
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onStopGame();
              }}
              disabled={gameState === 'ready' || gameState === 'stopped'}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                gameState === 'ready' || gameState === 'stopped'
                  ? 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400'
              }`}
            >
              <Square className="w-4 h-4 fill-current" />
              <span>DỪNG TRÒ CHƠI</span>
            </button>

            {/* 3. TIẾP TỤC (Hoặc Tạm dừng khi đang bay) */}
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onPauseOrResume();
              }}
              disabled={!isHunting && !canResume}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                !isHunting && !canResume
                  ? 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : canResume
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border border-emerald-300'
                  : 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-400'
              }`}
            >
              {isHunting ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>TẠM DỪNG</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>TIẾP TỤC</span>
                </>
              )}
            </button>

            {/* 4. CHƠI LẠI */}
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                onReplay();
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-indigo-700 hover:bg-indigo-600 text-white border border-indigo-400/60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>CHƠI LẠI</span>
            </button>

            <div className="h-6 w-px bg-slate-700 mx-0.5 hidden lg:block" aria-hidden="true" />

            {/* 5. DANH SÁCH HỌC SINH */}
            <button
              type="button"
              onClick={onOpenStudentManager}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-[#162447] hover:bg-[#1F3160] text-cyan-200 border border-cyan-500/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Users className="w-4 h-4 text-cyan-300" />
              <span>DANH SÁCH HỌC SINH</span>
            </button>

            {/* 6. LỊCH SỬ GỌI TÊN */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-[#162447] hover:bg-[#1F3160] text-purple-200 border border-purple-500/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <History className="w-4 h-4 text-purple-300" />
              <span>LỊCH SỬ GỌI TÊN</span>
            </button>

            {/* BẬT/TẮT TRẢ LỜI CÂU HỎI */}
            {onToggleQuiz && (
              <button
                type="button"
                data-testid="btn-toggle-quiz"
                onClick={onToggleQuiz}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  settings.quizEnabled
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-200 shadow-[0_0_16px_rgba(52,211,153,0.4)]'
                    : 'bg-[#162447] hover:bg-[#1F3160] text-emerald-200 border-emerald-500/40'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>
                  {settings.quizEnabled
                    ? 'TRẢ LỜI CÂU HỎI: BẬT'
                    : 'TRẢ LỜI CÂU HỎI: TẮT'}
                </span>
              </button>
            )}

            {/* NGÂN HÀNG CÂU HỎI */}
            {onOpenQuestionBank && (
              <button
                type="button"
                data-testid="btn-open-question-bank"
                onClick={onOpenQuestionBank}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-[#162447] hover:bg-[#1F3160] text-amber-200 border border-amber-500/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-4 h-4 text-amber-300" />
                <span>NGÂN HÀNG CÂU HỎI</span>
              </button>
            )}

            {/* 7. CÀI ĐẶT */}
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-[#162447] hover:bg-[#1F3160] text-amber-200 border border-amber-500/40 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Settings className="w-4 h-4 text-amber-300" />
              <span>CÀI ĐẶT</span>
            </button>

            {/* 8. BẬT/TẮT ÂM THANH */}
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={settings.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs md:text-sm border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                settings.soundEnabled
                  ? 'bg-teal-900/80 hover:bg-teal-800 text-teal-200 border-teal-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-600'
              }`}
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-teal-300" />
                  <span>ÂM THANH: BẬT</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-slate-400" />
                  <span>ÂM THANH: TẮT</span>
                </>
              )}
            </button>

            {/* 9. TOÀN MÀN HÌNH */}
            <button
              type="button"
              onClick={onToggleFullscreen}
              aria-label="Toàn màn hình"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs md:text-sm bg-[#162447] hover:bg-[#1F3160] text-slate-200 border border-slate-600 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {settings.fullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-cyan-300" />
                  <span>THOÁT TOÀN MÀN HÌNH</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-cyan-300" />
                  <span>TOÀN MÀN HÌNH</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
