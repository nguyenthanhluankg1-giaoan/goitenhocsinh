import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  HelpCircle,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  XCircle,
} from 'lucide-react';
import { GameState, QuizQuestion, Student } from '../types/game';
import {
  getQuizEvaluationSpeech,
  QUIZ_CORRECT_SPEECH,
  QUIZ_INCORRECT_SPEECH,
} from '../engine/RandomSelectionEngine';

interface ResultOverlayProps {
  gameState: GameState;
  selectedStudent: Student | null;
  currentCycle: number;
  totalStudents: number;
  uncalledCount: number;
  quizEnabled?: boolean;
  activeQuestion?: QuizQuestion | null;
  onSelectDifferentQuestion?: () => void;
  onSpeakQuestion?: (question: QuizQuestion) => void;
  onQuizAnswerEvaluated?: (isCorrect: boolean, feedbackSpeech: string) => void;
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
  quizEnabled = false,
  activeQuestion = null,
  onSelectDifferentQuestion,
  onSpeakQuestion,
  onQuizAnswerEvaluated,
  onContinueNextTurn,
  onReplayTurn,
  onStartNewCycle,
  onSpeakAgain,
}) => {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(
    null
  );
  const [showOpenEndedAnswer, setShowOpenEndedAnswer] = useState(false);
  const [openEndedResult, setOpenEndedResult] = useState<
    'correct' | 'retry' | null
  >(null);

  // Reset question answer state whenever the revealed student or question changes
  useEffect(() => {
    setSelectedOptionIdx(null);
    setShowOpenEndedAnswer(false);
    setOpenEndedResult(null);
  }, [selectedStudent?.id, activeQuestion?.id]);

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

  const handleChooseOption = (idx: number) => {
    if (!activeQuestion || selectedOptionIdx !== null) return;
    setSelectedOptionIdx(idx);
    const isCorrect = idx === activeQuestion.correctIndex;
    onQuizAnswerEvaluated?.(isCorrect, getQuizEvaluationSpeech(isCorrect));
  };

  const isMultipleChoiceEvaluated =
    activeQuestion?.type === 'multiple_choice' && selectedOptionIdx !== null;
  const isOpenEndedEvaluated =
    activeQuestion?.type === 'open_ended' && openEndedResult !== null;
  const isAnyAnswerEvaluated =
    isMultipleChoiceEvaluated || isOpenEndedEvaluated;
  const evaluatedIsCorrect = isMultipleChoiceEvaluated
    ? selectedOptionIdx === activeQuestion?.correctIndex
    : openEndedResult === 'correct';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reveal-student-name"
      data-testid="result-reveal-overlay"
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#040711]/80 p-4 overflow-y-auto"
    >
      <div className="animate-pop-in relative w-full max-w-3xl my-auto rounded-3xl bg-gradient-to-b from-[#111E46] via-[#0B132B] to-[#191238] border-2 border-cyan-300 p-6 md:p-8 text-center shadow-[0_25px_70px_rgba(6,182,212,0.45)]">
        {/* Decorative Corner Stars SVG */}
        <svg
          className="absolute top-4 left-5 w-8 h-8 text-amber-300"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2L14.8 8.8L22 9.5L16.5 14.2L18.2 21.3L12 17.5L5.8 21.3L7.5 14.2L2 9.5L9.2 8.8L12 2Z" />
        </svg>
        <svg
          className="absolute top-4 right-5 w-8 h-8 text-cyan-300"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2L14.8 8.8L22 9.5L16.5 14.2L18.2 21.3L12 17.5L5.8 21.3L7.5 14.2L2 9.5L9.2 8.8L12 2Z" />
        </svg>

        {/* Step 1: BÍ MẬT ĐÃ ĐƯỢC TIẾT LỘ! */}
        <p className="font-display font-bold text-xs md:text-sm uppercase tracking-widest text-cyan-300 mb-0.5">
          BÍ MẬT ĐÃ ĐƯỢC TIẾT LỘ!
        </p>

        {/* Step 2: CHÚC MỪNG! */}
        <p className="font-display font-extrabold text-xl md:text-2xl text-amber-300 mb-2">
          CHÚC MỪNG!
        </p>

        {/* Step 3: [TÊN HỌC SINH] Zero-Gravity Cosmic Floating Capsule */}
        <div
          data-testid="floating-student-name-capsule"
          className={`animate-cosmic-float relative mx-auto px-6 ${
            quizEnabled ? 'my-3 py-4' : 'my-5 py-6'
          } rounded-2xl bg-[#070B19]/95 border-2 border-amber-300 shadow-[0_14px_45px_rgba(251,191,36,0.35),0_0_25px_rgba(34,211,238,0.3)]`}
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
            className="animate-orbit-badge pointer-events-none absolute -top-3 left-6 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111E46] border border-cyan-300 text-cyan-200 text-[11px] font-bold shadow-md"
            aria-hidden="true"
          >
            ✦ TRÔI NỔI VŨ TRỤ
          </span>

          {/* Weightless Floating Star Satellite Bottom-Right */}
          <span
            className="animate-orbit-badge pointer-events-none absolute -bottom-3 right-6 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#191238] border border-amber-300 text-amber-200 text-[11px] font-bold shadow-md"
            style={{ animationDelay: '-1.6s' }}
            aria-hidden="true"
          >
            🛸 NGÔI SAO MAY MẮN
          </span>

          <h2
            id="reveal-student-name"
            data-testid="revealed-student-name"
            className={`animate-cosmic-name-wave relative z-10 font-display font-extrabold ${
              quizEnabled
                ? 'text-3xl sm:text-4xl md:text-5xl'
                : 'text-4xl sm:text-5xl md:text-6xl'
            } text-white tracking-tight break-words drop-shadow-[0_4px_18px_rgba(34,211,238,0.55)]`}
          >
            {selectedStudent.name}
          </h2>
        </div>

        {/* Step 4: Bạn đã được UFO MAY MẮN lựa chọn! */}
        <p className="font-display font-bold text-base md:text-xl text-cyan-200 mb-1">
          Bạn đã được UFO MAY MẮN lựa chọn!
        </p>

        {/* CONDITIONAL QUIZ SECTION: Only shown when teacher enables Question Answering (quizEnabled = true) */}
        {quizEnabled && activeQuestion && (
          <div
            data-testid="reveal-quiz-section"
            className="my-4 p-4 md:p-5 rounded-2xl bg-[#070B19]/95 border-2 border-cyan-400/80 text-left shadow-[0_10px_30px_rgba(0,0,0,0.65)] space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-300 shrink-0" />
                <span className="font-display font-extrabold text-sm md:text-base text-amber-300 uppercase tracking-wide">
                  CÂU HỎI THỬ THÁCH DÀNH CHO {selectedStudent.name.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {onSpeakQuestion && (
                  <button
                    type="button"
                    onClick={() => onSpeakQuestion(activeQuestion)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-200 text-xs font-bold border border-cyan-500/40 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Đọc câu hỏi</span>
                  </button>
                )}
                {onSelectDifferentQuestion && (
                  <button
                    type="button"
                    data-testid="btn-change-quiz-question"
                    onClick={onSelectDifferentQuestion}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-bold border border-amber-500/40 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                    <span>Đổi câu khác</span>
                  </button>
                )}
              </div>
            </div>

            {/* Question Prompt */}
            <p
              data-testid="reveal-quiz-question-text"
              className="font-display font-bold text-lg md:text-xl text-white leading-snug"
            >
              {activeQuestion.question}
            </p>

            {/* Multiple Choice Options A, B, C, D */}
            {activeQuestion.type === 'multiple_choice' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {activeQuestion.options.map((optText, idx) => {
                  const letter = ['A', 'B', 'C', 'D'][idx];
                  const isAnswered = selectedOptionIdx !== null;
                  const isThisSelected = selectedOptionIdx === idx;
                  const isThisCorrect = idx === activeQuestion.correctIndex;

                  let btnStyle =
                    'bg-[#111E46] hover:bg-[#1A2C63] border-cyan-500/40 text-white';
                  if (isAnswered) {
                    if (isThisCorrect) {
                      btnStyle =
                        'bg-emerald-500/30 border-emerald-400 text-emerald-100 shadow-[0_0_15px_rgba(52,211,153,0.35)]';
                    } else if (isThisSelected && !isThisCorrect) {
                      btnStyle =
                        'bg-rose-500/30 border-rose-400 text-rose-100';
                    } else {
                      btnStyle =
                        'bg-slate-900/60 border-slate-800 text-slate-400 opacity-65';
                    }
                  }

                  return (
                    <button
                      key={letter}
                      type="button"
                      data-testid={`quiz-option-${idx}`}
                      disabled={isAnswered}
                      onClick={() => handleChooseOption(idx)}
                      className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm md:text-base text-left transition-all cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-display font-extrabold text-sm flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <span>{optText}</span>
                      </div>
                      {isAnswered && isThisCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                      )}
                      {isAnswered && isThisSelected && !isThisCorrect && (
                        <XCircle className="w-5 h-5 text-rose-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Open-Ended / Oral Question Controls */
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    data-testid="btn-show-open-answer"
                    onClick={() => setShowOpenEndedAnswer((prev) => !prev)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-bold text-xs md:text-sm cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>
                      {showOpenEndedAnswer ? 'Ẩn đáp án gợi ý' : 'Hiện đáp án gợi ý'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-testid="btn-mark-oral-correct"
                    onClick={() => {
                      setOpenEndedResult('correct');
                      onQuizAnswerEvaluated?.(true, QUIZ_CORRECT_SPEECH);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs md:text-sm border cursor-pointer ${
                      openEndedResult === 'correct'
                        ? 'bg-emerald-400 text-slate-950 border-emerald-200'
                        : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/50'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Trả lời ĐÚNG (Khen thưởng)</span>
                  </button>

                  <button
                    type="button"
                    data-testid="btn-mark-oral-wrong"
                    onClick={() => {
                      setOpenEndedResult('retry');
                      onQuizAnswerEvaluated?.(false, QUIZ_INCORRECT_SPEECH);
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs md:text-sm border cursor-pointer ${
                      openEndedResult === 'retry'
                        ? 'bg-rose-500 text-white border-rose-300'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-400/50'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Trả lời SAI / Chưa chính xác</span>
                  </button>
                </div>

                {showOpenEndedAnswer && (
                  <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-400/50 text-emerald-200 text-xs md:text-sm font-medium">
                    💡 <strong>Đáp án / Gợi ý:</strong> {activeQuestion.answerText}
                  </div>
                )}
              </div>
            )}

            {/* Feedback Banner after answering Multiple Choice or Open-Ended */}
            {isAnyAnswerEvaluated && (
              <div
                data-testid="quiz-answer-feedback"
                data-correct={evaluatedIsCorrect ? 'true' : 'false'}
                className={`p-3 rounded-xl border text-xs md:text-sm font-bold flex flex-wrap items-center justify-between gap-2 ${
                  evaluatedIsCorrect
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                    : 'bg-rose-500/20 border-rose-400 text-rose-200'
                }`}
              >
                <span>
                  {evaluatedIsCorrect
                    ? `🎉 "${QUIZ_CORRECT_SPEECH}" — ${activeQuestion.answerText}`
                    : `💡 "${QUIZ_INCORRECT_SPEECH}"${
                        activeQuestion.type === 'multiple_choice'
                          ? ` — Đáp án đúng là ${
                              ['A', 'B', 'C', 'D'][activeQuestion.correctIndex]
                            }. ${activeQuestion.answerText}`
                          : ''
                      }`}
                </span>
                <button
                  type="button"
                  data-testid="btn-replay-quiz-feedback"
                  onClick={() =>
                    onQuizAnswerEvaluated?.(
                      evaluatedIsCorrect,
                      getQuizEvaluationSpeech(evaluatedIsCorrect)
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-cyan-200 border border-cyan-400/40 text-xs cursor-pointer shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Nghe lại</span>
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-slate-300 mb-5">
          Còn lại {uncalledCount} / {totalStudents} học sinh chưa được gọi trong chu kỳ {currentCycle}
        </p>

        {/* Action Buttons: TIẾP TỤC, CHƠI LẠI, ĐỌC LẠI TÊN */}
        <div className="flex flex-wrap items-center justify-center gap-3.5">
          <button
            type="button"
            data-testid="btn-continue-after-reveal"
            onClick={onContinueNextTurn}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display font-extrabold text-base md:text-lg border-2 border-emerald-200 shadow-lg cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>TIẾP TỤC</span>
          </button>

          <button
            type="button"
            data-testid="btn-replay-after-reveal"
            onClick={onReplayTurn}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-base md:text-lg border-2 border-amber-200 shadow-lg cursor-pointer transition-transform active:scale-95 whitespace-nowrap"
          >
            <RotateCcw className="w-5 h-5" />
            <span>CHƠI LẠI</span>
          </button>

          <button
            type="button"
            onClick={onSpeakAgain}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#1E293B] hover:bg-[#334155] text-cyan-200 font-bold text-sm border border-cyan-400/50 cursor-pointer transition-colors whitespace-nowrap"
          >
            <Volume2 className="w-4 h-4 text-cyan-300" />
            <span>ĐỌC LẠI TÊN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
