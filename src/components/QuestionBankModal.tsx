import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  HelpCircle,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import { QuizQuestion, QuizQuestionType } from '../types/game';
import {
  DEFAULT_QUIZ_QUESTIONS,
  parseBulkQuestionsInput,
} from '../engine/RandomSelectionEngine';

interface QuestionBankModalProps {
  isOpen: boolean;
  quizEnabled: boolean;
  questions: QuizQuestion[];
  onClose: () => void;
  onToggleQuizEnabled: (enabled: boolean) => void;
  onUpdateQuestions: (nextQuestions: QuizQuestion[]) => void;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  quizEnabled,
  questions,
  onClose,
  onToggleQuizEnabled,
  onUpdateQuestions,
}) => {
  const [questionType, setQuestionType] =
    useState<QuizQuestionType>('multiple_choice');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [answerText, setAnswerText] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkBox, setShowBulkBox] = useState(false);

  if (!isOpen) return null;

  const handleAddSingleQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQ = newQuestionText.trim();
    if (!trimmedQ) return;

    const created: QuizQuestion =
      questionType === 'multiple_choice'
        ? {
            id: `q_${Date.now()}`,
            type: 'multiple_choice',
            question: trimmedQ,
            options: [
              optA.trim() || 'Đáp án A',
              optB.trim() || 'Đáp án B',
              optC.trim() || 'Đáp án C',
              optD.trim() || 'Đáp án D',
            ],
            correctIndex,
            answerText:
              answerText.trim() ||
              `Đáp án đúng là ${['A', 'B', 'C', 'D'][correctIndex]}.`,
            usedInSession: false,
          }
        : {
            id: `q_${Date.now()}`,
            type: 'open_ended',
            question: trimmedQ,
            options: ['', '', '', ''],
            correctIndex: 0,
            answerText:
              answerText.trim() || 'Giáo viên nhận xét câu trả lời của học sinh.',
            usedInSession: false,
          };

    onUpdateQuestions([created, ...questions]);
    setNewQuestionText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setAnswerText('');
  };

  const handleBulkImport = () => {
    const parsed = parseBulkQuestionsInput(bulkInput);
    if (parsed.length === 0) return;
    onUpdateQuestions([...parsed, ...questions]);
    setBulkInput('');
    setShowBulkBox(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="question-bank-title"
      data-testid="question-bank-modal"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#040711]/85 p-4"
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0B132B] border-2 border-cyan-400/70 shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[#14204B] border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6 text-amber-300" />
            <div>
              <h2
                id="question-bank-title"
                className="font-display font-extrabold text-xl md:text-2xl text-white"
              >
                NGÂN HÀNG CÂU HỎI KHI GỌI TÊN HỌC SINH
              </h2>
              <p className="text-xs text-cyan-200">
                Khi bật tính năng này, học sinh được UFO chọn sẽ nhận ngay 1 câu hỏi thử thách trên màn hình!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng ngân hàng câu hỏi"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Master Toggle Card: Bật/Tắt tính năng trả lời câu hỏi */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#132347] to-[#1E1B4B] border-2 border-amber-400/70 shadow-lg">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-lg ${
                  quizEnabled
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                ?
              </div>
              <div>
                <div className="font-display font-extrabold text-base md:text-lg text-white">
                  Trạng thái tính năng trả lời câu hỏi:{' '}
                  <span
                    className={
                      quizEnabled ? 'text-emerald-300' : 'text-amber-300'
                    }
                  >
                    {quizEnabled ? 'ĐANG BẬT' : 'ĐANG TẮT'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {quizEnabled
                    ? 'Mỗi khi UFO chọn trúng một học sinh, câu hỏi sẽ tự động xuất hiện để học sinh trả lời.'
                    : 'Hiện tại UFO chỉ gọi tên học sinh. Hãy bật công tắc bên phải nếu muốn học sinh trả lời câu hỏi.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              data-testid="btn-modal-toggle-quiz"
              onClick={() => onToggleQuizEnabled(!quizEnabled)}
              className={`px-5 py-2.5 rounded-xl font-display font-extrabold text-sm border-2 transition-transform active:scale-95 cursor-pointer ${
                quizEnabled
                  ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 border-emerald-200 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-200'
              }`}
            >
              {quizEnabled
                ? '✓ ĐANG BẬT TRẢ LỜI CÂU HỎI (NHẤN ĐỂ TẮT)'
                : 'BẬT TÍNH NĂNG TRẢ LỜI CÂU HỎI'}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Add New Question Form */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-[#070B19]/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-base text-amber-300 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Thêm câu hỏi mới</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBulkBox((prev) => !prev)}
                  className="text-xs font-bold text-cyan-300 hover:underline cursor-pointer"
                >
                  {showBulkBox ? 'Nhập từng câu' : 'Dán nhanh nhiều câu'}
                </button>
              </div>

              {showBulkBox ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mỗi dòng 1 câu hỏi theo cú pháp:
                    <br />
                    <span className="text-cyan-300 font-mono text-[11px]">
                      Câu hỏi | Đáp án A | Đáp án B | Đáp án C | Đáp án D | B
                    </span>
                    <br />
                    hoặc tự luận:{' '}
                    <span className="text-amber-300 font-mono text-[11px]">
                      Câu hỏi | Đáp án gợi ý
                    </span>
                  </p>
                  <textarea
                    rows={5}
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="25 + 15 bằng bao nhiêu? | 30 | 35 | 40 | 45 | C"
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleBulkImport}
                    className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-extrabold text-sm cursor-pointer"
                  >
                    Nhập vào ngân hàng câu hỏi
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddSingleQuestion} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setQuestionType('multiple_choice')}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        questionType === 'multiple_choice'
                          ? 'bg-cyan-500/25 border-cyan-300 text-cyan-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Trắc nghiệm (A, B, C, D)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionType('open_ended')}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        questionType === 'open_ended'
                          ? 'bg-amber-500/25 border-amber-300 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Tự luận / Trả lời miệng
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nội dung câu hỏi:
                    </label>
                    <textarea
                      rows={2}
                      data-testid="input-new-question"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Nhập câu hỏi cho học sinh..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    />
                  </div>

                  {questionType === 'multiple_choice' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={optA}
                          onChange={(e) => setOptA(e.target.value)}
                          placeholder="Đáp án A"
                          className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={optB}
                          onChange={(e) => setOptB(e.target.value)}
                          placeholder="Đáp án B"
                          className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={optC}
                          onChange={(e) => setOptC(e.target.value)}
                          placeholder="Đáp án C"
                          className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={optD}
                          onChange={(e) => setOptD(e.target.value)}
                          placeholder="Đáp án D"
                          className="rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-slate-300">
                          Đáp án đúng:
                        </span>
                        <div className="flex gap-1.5">
                          {['A', 'B', 'C', 'D'].map((letter, idx) => (
                            <button
                              key={letter}
                              type="button"
                              onClick={() => setCorrectIndex(idx)}
                              className={`w-8 h-8 rounded-lg font-extrabold text-xs border cursor-pointer ${
                                correctIndex === idx
                                  ? 'bg-emerald-400 text-slate-950 border-emerald-200'
                                  : 'bg-slate-900 text-slate-300 border-slate-700'
                              }`}
                            >
                              {letter}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {questionType === 'multiple_choice'
                        ? 'Giải thích đáp án (tùy chọn):'
                        : 'Đáp án / Gợi ý chấm điểm:'}
                    </label>
                    <input
                      type="text"
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      placeholder="Nhập đáp án hoặc lời giải thích ngắn..."
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    data-testid="btn-submit-new-question"
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>THÊM CÂU HỎI VÀO DANH SÁCH</span>
                  </button>
                </form>
              )}
            </div>

            {/* Right Column: Question List */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-[#070B19]/90 border border-slate-800 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h3 className="font-display font-bold text-base text-cyan-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Danh sách câu hỏi hiện có ({questions.length} câu)</span>
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateQuestions(
                        questions.map((q) => ({ ...q, usedInSession: false }))
                      )
                    }
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-200 text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Đặt lại câu đã hỏi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateQuestions([...DEFAULT_QUIZ_QUESTIONS])
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 text-xs font-semibold cursor-pointer"
                  >
                    Khôi phục câu mẫu
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {questions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    Chưa có câu hỏi nào. Hãy thêm câu hỏi ở khung bên trái hoặc nhấn "Khôi phục câu mẫu"!
                  </div>
                ) : (
                  questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono-num font-bold text-xs">
                            Câu {index + 1}
                          </span>
                          <span className="text-[11px] font-semibold text-amber-300">
                            {q.type === 'multiple_choice'
                              ? 'Trắc nghiệm'
                              : 'Tự luận / Trả lời miệng'}
                          </span>
                          {q.usedInSession && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã hỏi
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-sm text-white">
                          {q.question}
                        </p>
                        {q.type === 'multiple_choice' ? (
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`text-xs px-2 py-1 rounded-lg border ${
                                  q.correctIndex === oIdx
                                    ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 font-bold'
                                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                                }`}
                              >
                                {['A', 'B', 'C', 'D'][oIdx]}. {opt}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-emerald-300">
                            Đáp án gợi ý: {q.answerText}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQuestions(
                            questions.filter((item) => item.id !== q.id)
                          )
                        }
                        title="Xóa câu hỏi"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#111E46] border-t border-slate-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-extrabold text-sm cursor-pointer"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
