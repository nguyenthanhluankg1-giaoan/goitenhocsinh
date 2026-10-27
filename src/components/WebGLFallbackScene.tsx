import React from 'react';
import { GameState, Student, UfoSurpriseEvent } from '../types/game';

interface WebGLFallbackSceneProps {
  gameState: GameState;
  students: Student[];
  hoveredStudent: Student | null;
  selectedStudent: Student | null;
  activeSurpriseEvent: UfoSurpriseEvent | null;
}

/**
 * 2D SVG/CSS Chibi UFO & Classroom Stage Fallback when WebGL is unavailable
 * or when 2D Projector Mode is selected in Settings.
 */
export const WebGLFallbackScene: React.FC<WebGLFallbackSceneProps> = ({
  gameState,
  students,
  hoveredStudent,
  selectedStudent,
  activeSurpriseEvent,
}) => {
  const isBeamActive =
    gameState === 'scanning' ||
    gameState === 'locking' ||
    gameState === 'catching' ||
    gameState === 'revealing' ||
    gameState === 'missing' ||
    gameState === 'falseSignal';

  const targetStudent =
    gameState === 'catching' || gameState === 'revealing'
      ? selectedStudent
      : hoveredStudent;

  return (
    <div
      data-testid="fallback-2d-stage"
      className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#161F38] via-[#1E2942] to-[#4A2E1B] flex flex-col justify-between p-6"
    >
      {/* Luxury Indoor Classroom Architecture (Golden Chandeliers, Arched Windows, Bookcases) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top Golden Crown Molding & Coffered Ceiling */}
        <div className="absolute top-0 inset-x-0 h-5 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 opacity-75" />

        {/* Left Panoramic Arched Window looking out at Night Sky */}
        <div className="absolute top-16 left-8 w-36 h-56 rounded-t-full border-4 border-amber-400/70 bg-[#090E24]/85 overflow-hidden shadow-inner">
          <svg className="w-full h-full" viewBox="0 0 120 180" aria-hidden="true">
            <circle cx="45" cy="55" r="18" fill="#A855F7" />
            <ellipse
              cx="45"
              cy="55"
              rx="32"
              ry="8"
              fill="none"
              stroke="#F472B6"
              strokeWidth="4"
              transform="rotate(-18 45 55)"
            />
            <circle cx="88" cy="34" r="2.5" fill="#FEF08A" />
            <circle cx="28" cy="110" r="2" fill="#67E8F9" />
            <line x1="0" y1="90" x2="120" y2="90" stroke="#F59E0B" strokeWidth="3" />
            <line x1="60" y1="0" x2="60" y2="180" stroke="#F59E0B" strokeWidth="3" />
          </svg>
        </div>

        {/* Right Panoramic Arched Window looking out at Night Sky */}
        <div className="absolute top-16 right-8 w-36 h-56 rounded-t-full border-4 border-amber-400/70 bg-[#090E24]/85 overflow-hidden shadow-inner">
          <svg className="w-full h-full" viewBox="0 0 120 180" aria-hidden="true">
            <circle cx="72" cy="58" r="20" fill="#06B6D4" />
            <circle cx="32" cy="36" r="7" fill="#FACC15" />
            <circle cx="88" cy="118" r="2.5" fill="#FEF08A" />
            <line x1="0" y1="90" x2="120" y2="90" stroke="#F59E0B" strokeWidth="3" />
            <line x1="60" y1="0" x2="60" y2="180" stroke="#F59E0B" strokeWidth="3" />
          </svg>
        </div>
      </div>

      {/* Upper UFO Flight Arena inside Luxury Classroom */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-10">
        <div
          className={`relative flex flex-col items-center transition-transform duration-500 ${
            gameState === 'missing'
              ? 'rotate-12 translate-x-10'
              : gameState === 'falseSignal'
              ? '-rotate-12 -translate-x-8'
              : 'animate-float-slow'
          }`}
        >
          {/* Chibi UFO SVG */}
          <svg
            width="240"
            height="140"
            viewBox="0 0 240 140"
            className="drop-shadow-[0_12px_28px_rgba(34,211,238,0.45)]"
            aria-label="UFO May Mắn"
          >
            {/* Antenna */}
            <line
              x1="120"
              y1="8"
              x2="120"
              y2="28"
              stroke="#FBBF24"
              strokeWidth="4"
            />
            <circle cx="120" cy="8" r="6" fill="#F43F5E" />

            {/* Cockpit Glass Dome */}
            <path
              d="M 70 72 A 50 44 0 0 1 170 72 Z"
              fill="#67E8F9"
              fillOpacity="0.65"
              stroke="#22D3EE"
              strokeWidth="3"
            />

            {/* Cute Alien Pilot inside */}
            <ellipse cx="120" cy="58" rx="18" ry="15" fill="#4ADE80" />
            <circle cx="113" cy="55" r="4" fill="#0F172A" />
            <circle cx="127" cy="55" r="4" fill="#0F172A" />
            <circle cx="112" cy="53" r="1.5" fill="#FFFFFF" />
            <circle cx="126" cy="53" r="1.5" fill="#FFFFFF" />

            {/* Saucer Main Body */}
            <ellipse
              cx="120"
              cy="76"
              rx="96"
              ry="24"
              fill="#3B82F6"
              stroke="#A855F7"
              strokeWidth="5"
            />

            {/* Golden Collar */}
            <ellipse cx="120" cy="70" rx="55" ry="10" fill="#FBBF24" />

            {/* Beacon Lights */}
            <circle cx="48" cy="76" r="6" fill="#22D3EE" />
            <circle cx="82" cy="84" r="6" fill="#F472B6" />
            <circle cx="120" cy="86" r="6" fill="#FACC15" />
            <circle cx="158" cy="84" r="6" fill="#4ADE80" />
            <circle cx="192" cy="76" r="6" fill="#22D3EE" />

            {/* Bottom Thruster */}
            <ellipse cx="120" cy="100" rx="34" ry="8" fill="#38BDF8" />
          </svg>

          {/* Tractor Beam Cone */}
          {isBeamActive && (
            <div
              className={`w-56 h-48 -mt-4 pointer-events-none transition-opacity duration-300 ${
                activeSurpriseEvent === 'falseSignal'
                  ? 'bg-gradient-to-b from-fuchsia-400/50 via-purple-500/25 to-transparent'
                  : 'bg-gradient-to-b from-cyan-400/55 via-cyan-300/25 to-transparent'
              }`}
              style={{
                clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
              }}
            />
          )}

          {/* Target Student Pill inside Beam */}
          {targetStudent && isBeamActive && (
            <div className="animate-cosmic-float -mt-28 px-5 py-2 rounded-xl bg-slate-950/90 border-2 border-cyan-300 text-amber-300 font-display font-bold text-xl shadow-lg">
              🎯 <span className="animate-cosmic-name-wave inline-block">{targetStudent.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Chibi Luxury Classroom Desks Grid */}
      <div className="relative z-10 max-w-6xl mx-auto w-full bg-[#131C33]/92 border-2 border-amber-400/70 rounded-2xl p-4 mb-24 shadow-2xl">
        <div className="text-center text-amber-300 font-display font-bold text-sm mb-3 tracking-wide">
          ★ PHÒNG HỌC SANG TRỌNG • LỚP HỌC VUI VẺ ({students.length} EM) ★
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2.5 max-h-48 overflow-y-auto pr-1 pt-1">
          {students.map((stu, idx) => {
            const isTarget = targetStudent?.id === stu.id;
            return (
              <div
                key={stu.id}
                className={`flex flex-col items-center p-2 rounded-xl border text-center transition-transform ${
                  isTarget
                    ? 'bg-cyan-500/30 border-amber-300 scale-105 shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                    : stu.calledInCycle
                    ? 'bg-slate-800/50 border-slate-700 opacity-50'
                    : 'bg-indigo-950/70 border-indigo-700/60'
                }`}
              >
                {/* Floating Name Tag Above Head */}
                <span
                  style={{ animationDelay: `${(idx % 6) * -0.45}s` }}
                  className={`animate-cosmic-name-wave px-2 py-0.5 rounded-md text-[11px] font-bold truncate w-full mb-1 border ${
                    isTarget
                      ? 'bg-amber-400 text-slate-950 border-yellow-200'
                      : stu.calledInCycle
                      ? 'bg-slate-900 text-slate-400 border-slate-700'
                      : 'bg-[#0B132B] text-white border-cyan-400/60'
                  }`}
                >
                  {stu.calledInCycle ? `✓ ${stu.name}` : stu.name}
                </span>
                <span className="text-xl" aria-hidden="true">
                  {stu.calledInCycle ? '✅' : isTarget ? '🛸' : '🧒'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
