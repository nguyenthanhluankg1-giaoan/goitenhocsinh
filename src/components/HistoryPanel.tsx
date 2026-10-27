import React, { useState } from 'react';
import {
  Download,
  History,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { HistoryRecord } from '../types/game';
import { exportHistoryToCsv } from '../engine/RandomSelectionEngine';

interface HistoryPanelProps {
  isOpen: boolean;
  history: HistoryRecord[];
  currentCycle: number;
  onClose: () => void;
  onClearHistory: () => void;
  onResetCurrentCycle: () => void;
  onStartNewCycleKeepHistory: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  history,
  currentCycle,
  onClose,
  onClearHistory,
  onResetCurrentCycle,
  onStartNewCycleKeepHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) =>
    item.studentName
      .toLocaleLowerCase('vi-VN')
      .includes(searchQuery.toLocaleLowerCase('vi-VN').trim())
  );

  const handleExportCsv = () => {
    const csv = exportHistoryToCsv(history);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lich-su-goi-ten-ufo.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-panel-title"
      data-testid="history-panel-modal"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#040711]/85 p-4"
    >
      <div className="w-full max-w-5xl max-h-[88vh] flex flex-col rounded-3xl bg-[#0B132B] border-2 border-purple-400/60 shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#171238] border-b border-purple-500/30">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-purple-300" />
            <h2
              id="history-panel-title"
              className="font-display font-extrabold text-xl md:text-2xl text-white"
            >
              BẢNG LỊCH SỬ GỌI TÊN HỌC SINH
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng lịch sử gọi tên"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Bar */}
        <div className="px-6 py-4 bg-[#0E1636] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Tìm kiếm trong lịch sử"
              placeholder="Tìm kiếm theo tên học sinh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onStartNewCycleKeepHistory}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chu kỳ mới (Giữ lịch sử)</span>
            </button>

            <button
              type="button"
              onClick={onResetCurrentCycle}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 font-bold text-xs cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại chu kỳ {currentCycle}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-200 border border-emerald-500/30 font-bold text-xs cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất lịch sử CSV</span>
            </button>

            <button
              type="button"
              disabled={history.length === 0}
              onClick={() => setConfirmClear(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 disabled:opacity-40 text-rose-200 border border-rose-500/40 font-bold text-xs cursor-pointer whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa lịch sử</span>
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredHistory.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#070B19]/80 border border-dashed border-slate-700 text-center space-y-2">
              <p className="font-display font-bold text-lg text-purple-300">
                CHƯA CÓ LƯỢT GỌI TÊN NÀO ĐƯỢC GHI NHẬN
              </p>
              <p className="text-sm text-slate-400">
                Chỉ khi UFO bắt trúng hoàn tất và công bố tên, lượt gọi mới được
                ghi vào bảng lịch sử.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#070B19]/90">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#171238] text-xs font-bold uppercase text-purple-200 border-b border-slate-800">
                    <th className="py-3 px-4 w-16">STT</th>
                    <th className="py-3 px-4">Tên học sinh được chọn</th>
                    <th className="py-3 px-4">Lớp</th>
                    <th className="py-3 px-4">Thời điểm được chọn</th>
                    <th className="py-3 px-4 text-center">Số lần UFO hụt</th>
                    <th className="py-3 px-4 text-center">Chu kỳ</th>
                    <th className="py-3 px-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {filteredHistory.map((rec) => (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-900/80 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono-num text-slate-400">
                        {rec.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-300">
                        {rec.studentName}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {rec.className}
                      </td>
                      <td className="py-3 px-4 font-mono-num text-xs text-slate-300">
                        {rec.timestamp}
                      </td>
                      <td className="py-3 px-4 font-mono-num text-center text-pink-300">
                        {rec.missesBeforeCatch}
                      </td>
                      <td className="py-3 px-4 font-mono-num text-center text-cyan-300">
                        Chu kỳ {rec.cycle}
                      </td>
                      <td className="py-3 px-4 text-right text-xs font-bold text-emerald-300">
                        ✓ {rec.calledStatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirm Clear History Dialog */}
        {confirmClear && (
          <div
            role="alertdialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <div className="w-full max-w-md rounded-2xl bg-[#171238] border-2 border-rose-400 p-6 space-y-4 shadow-2xl">
              <h3 className="font-display font-bold text-lg text-rose-300">
                Xác nhận xóa toàn bộ lịch sử
              </h3>
              <p className="text-sm text-slate-200">
                Bạn có chắc chắn muốn xóa toàn bộ {history.length} bản ghi lịch
                sử gọi tên không? Dữ liệu đã xóa sẽ không thể khôi phục.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  data-testid="btn-confirm-clear-history"
                  onClick={() => {
                    setConfirmClear(false);
                    onClearHistory();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs cursor-pointer"
                >
                  Xóa lịch sử
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
