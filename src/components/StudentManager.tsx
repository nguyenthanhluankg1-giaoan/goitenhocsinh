import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Download,
  Edit3,
  FolderPlus,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import {
  ClassRoster,
  DuplicateCheckResult,
  Student,
} from '../types/game';
import {
  analyzeStudentDuplicates,
  createStudent,
  exportStudentsToCsv,
  parseRawStudentInput,
} from '../engine/RandomSelectionEngine';

interface StudentManagerProps {
  isOpen: boolean;
  isGameActive: boolean;
  rosters: ClassRoster[];
  activeRosterId: string;
  onClose: () => void;
  onSelectRoster: (rosterId: string) => void;
  onCreateRoster: (name: string) => void;
  onRenameRoster: (rosterId: string, newName: string) => void;
  onDeleteRoster: (rosterId: string) => void;
  onUpdateStudents: (students: Student[]) => void;
  onResetCalledStatus: () => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  isOpen,
  isGameActive,
  rosters,
  activeRosterId,
  onClose,
  onSelectRoster,
  onCreateRoster,
  onRenameRoster,
  onDeleteRoster,
  onUpdateStudents,
  onResetCalledStatus,
}) => {
  const activeRoster =
    rosters.find((r) => r.id === activeRosterId) || rosters[0];
  const students = activeRoster?.students || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [singleNameInput, setSingleNameInput] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulkPanel, setShowBulkPanel] = useState(false);

  // Duplicate detection state
  const [pendingDuplicateCheck, setPendingDuplicateCheck] =
    useState<DuplicateCheckResult | null>(null);
  const [bulkModeReplace, setBulkModeReplace] = useState<boolean>(false);

  // Edit single student state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // New class creation state
  const [newClassName, setNewClassName] = useState('');
  const [showNewClassInput, setShowNewClassInput] = useState(false);

  // Rename current class state
  const [isRenamingClass, setIsRenamingClass] = useState(false);
  const [renameClassValue, setRenameClassValue] = useState('');

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen || !activeRoster) return null;

  const calledCount = students.filter((s) => s.calledInCycle).length;
  const uncalledCount = students.length - calledCount;

  const filteredStudents = students.filter((s) =>
    s.name.toLocaleLowerCase('vi-VN').includes(searchQuery.toLocaleLowerCase('vi-VN').trim())
  );

  const runWithMidGameGuard = (action: () => void) => {
    if (isGameActive) {
      setConfirmAction({
        title: 'Xác nhận chỉnh sửa khi đang chơi',
        message:
          'UFO đang trong lượt săn tìm. Việc thay đổi danh sách học sinh sẽ dừng lượt hiện tại và cập nhật trạng thái an toàn. Bạn có muốn tiếp tục?',
        onConfirm: () => {
          setConfirmAction(null);
          action();
        },
      });
    } else {
      action();
    }
  };

  // Add a single student
  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = singleNameInput.replace(/\s+/g, ' ').trim();
    if (!cleaned) return;

    const existingNames = students.map((s) => s.name);
    const check = analyzeStudentDuplicates([...existingNames, cleaned]);

    if (check.hasDuplicates) {
      setPendingDuplicateCheck(check);
      setBulkModeReplace(false);
      setSingleNameInput('');
      return;
    }

    runWithMidGameGuard(() => {
      const newStu = createStudent(cleaned, students.length);
      onUpdateStudents([...students, newStu]);
      setSingleNameInput('');
    });
  };

  // Process bulk paste or imported lines
  const handleProcessBulkNames = (rawInput: string, replaceExisting: boolean) => {
    const parsedNames = parseRawStudentInput(rawInput);
    if (parsedNames.length === 0) return;

    const combinedNames = replaceExisting
      ? parsedNames
      : [...students.map((s) => s.name), ...parsedNames];

    const check = analyzeStudentDuplicates(combinedNames);
    if (check.hasDuplicates) {
      setPendingDuplicateCheck(check);
      setBulkModeReplace(replaceExisting);
      return;
    }

    commitNameList(combinedNames, replaceExisting);
  };

  const commitNameList = (finalNames: string[], replaceExisting: boolean) => {
    runWithMidGameGuard(() => {
      if (replaceExisting) {
        const nextStudents = finalNames.map((n, idx) => createStudent(n, idx));
        onUpdateStudents(nextStudents);
      } else {
        // Keep existing students and append the newly added portion
        const addedNames = finalNames.slice(students.length);
        const addedStudents = addedNames.map((n, idx) =>
          createStudent(n, students.length + idx)
        );
        onUpdateStudents([...students, ...addedStudents]);
      }
      setBulkText('');
      setShowBulkPanel(false);
      setPendingDuplicateCheck(null);
    });
  };

  // Handle TXT/CSV file upload
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '');
      if (content.trim()) {
        setBulkText(content);
        setShowBulkPanel(true);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  // Handle CSV Export
  const handleExportCsv = () => {
    const csv = exportStudentsToCsv(students);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh-sach-${activeRoster.name.replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveEditStudent = (id: string) => {
    const cleaned = editingName.replace(/\s+/g, ' ').trim();
    if (!cleaned) return;
    runWithMidGameGuard(() => {
      onUpdateStudents(
        students.map((s) => (s.id === id ? { ...s, name: cleaned } : s))
      );
      setEditingStudentId(null);
      setEditingName('');
    });
  };

  const handleDeleteStudent = (student: Student) => {
    setConfirmAction({
      title: 'Xóa học sinh',
      message: `Bạn có chắc chắn muốn xóa học sinh "${student.name}" khỏi danh sách lớp không?`,
      onConfirm: () => {
        setConfirmAction(null);
        runWithMidGameGuard(() => {
          onUpdateStudents(students.filter((s) => s.id !== student.id));
        });
      },
    });
  };

  const handleClearAllStudents = () => {
    setConfirmAction({
      title: 'Xóa toàn bộ học sinh trong lớp này',
      message: `Bạn có chắc chắn muốn xóa tất cả ${students.length} học sinh của "${activeRoster.name}" không?`,
      onConfirm: () => {
        setConfirmAction(null);
        runWithMidGameGuard(() => {
          onUpdateStudents([]);
        });
      },
    });
  };

  const handleResetTurnConfirm = () => {
    setConfirmAction({
      title: 'Đặt lại lượt gọi trong chu kỳ',
      message:
        'Tất cả học sinh trong lớp sẽ được đặt lại về trạng thái "Chưa gọi" để bắt đầu vòng gọi mới. Bạn có đồng ý không?',
      onConfirm: () => {
        setConfirmAction(null);
        onResetCalledStatus();
      },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="student-manager-title"
      data-testid="student-manager-modal"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#040711]/85 p-4"
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-[#0B132B] border-2 border-cyan-400/60 shadow-[0_24px_60px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#111E46] border-b border-cyan-500/30">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-cyan-300" />
            <h2
              id="student-manager-title"
              className="font-display font-extrabold text-xl md:text-2xl text-white"
            >
              QUẢN LÝ DANH SÁCH HỌC SINH
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng danh sách học sinh"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Class Roster Selector & Stats Bar */}
        <div className="px-6 py-3.5 bg-[#0E1838] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <label
              htmlFor="class-roster-select"
              className="text-xs font-bold uppercase tracking-wider text-cyan-300"
            >
              Lớp đang chọn:
            </label>
            <select
              id="class-roster-select"
              value={activeRoster.id}
              onChange={(e) => onSelectRoster(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#070B19] border border-cyan-500/50 text-white font-semibold text-sm focus:outline-none focus:border-amber-300"
            >
              {rosters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.students.length} HS)
                </option>
              ))}
            </select>

            {!isRenamingClass ? (
              <button
                type="button"
                onClick={() => {
                  setRenameClassValue(activeRoster.name);
                  setIsRenamingClass(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-600 cursor-pointer whitespace-nowrap"
              >
                Đổi tên lớp
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={renameClassValue}
                  onChange={(e) => setRenameClassValue(e.target.value)}
                  aria-label="Tên lớp mới"
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-400 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (renameClassValue.trim()) {
                      onRenameRoster(activeRoster.id, renameClassValue.trim());
                    }
                    setIsRenamingClass(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Lưu
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowNewClassInput((prev) => !prev)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Tạo lớp mới</span>
            </button>

            {rosters.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  setConfirmAction({
                    title: 'Xóa danh sách lớp',
                    message: `Bạn có chắc chắn muốn xóa danh sách lớp "${activeRoster.name}" không?`,
                    onConfirm: () => {
                      setConfirmAction(null);
                      onDeleteRoster(activeRoster.id);
                    },
                  });
                }}
                className="px-2.5 py-1.5 rounded-lg bg-rose-900/70 hover:bg-rose-800 text-xs font-semibold text-rose-200 border border-rose-500/40 cursor-pointer whitespace-nowrap"
              >
                Xóa lớp
              </button>
            )}
          </div>

          {/* Summary Counters */}
          <div className="flex items-center gap-4 text-xs md:text-sm font-semibold">
            <span className="text-slate-300">
              Tổng số:{' '}
              <strong className="font-mono-num text-white">{students.length}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-cyan-300">
              Chưa gọi:{' '}
              <strong className="font-mono-num">{uncalledCount}</strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-amber-300">
              Đã gọi: <strong className="font-mono-num">{calledCount}</strong>
            </span>
          </div>
        </div>

        {/* Create New Class Inline Bar */}
        {showNewClassInput && (
          <div className="px-6 py-3 bg-indigo-950/80 border-b border-indigo-500/40 flex flex-wrap items-center gap-3">
            <label htmlFor="new-class-name-input" className="text-xs font-bold text-indigo-200">
              Tên danh sách lớp mới:
            </label>
            <input
              id="new-class-name-input"
              type="text"
              placeholder="Ví dụ: Lớp 4B - Toán Vui"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-400 text-sm text-white w-64"
            />
            <button
              type="button"
              onClick={() => {
                if (newClassName.trim()) {
                  onCreateRoster(newClassName.trim());
                  setNewClassName('');
                  setShowNewClassInput(false);
                }
              }}
              className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Tạo danh sách
            </button>
            <button
              type="button"
              onClick={() => setShowNewClassInput(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs cursor-pointer"
            >
              Hủy
            </button>
          </div>
        )}

        {/* Duplicate Warning Decision Banner */}
        {pendingDuplicateCheck && (
          <div
            role="alert"
            data-testid="duplicate-warning-banner"
            className="mx-6 mt-4 p-4 rounded-2xl bg-amber-950/90 border-2 border-amber-400 text-amber-100 flex flex-col gap-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display font-bold text-base text-amber-300">
                  PHÁT HIỆN TÊN HỌC SINH TRÙNG NHAU!
                </h3>
                <p className="text-xs md:text-sm text-amber-100 mt-0.5">
                  Hệ thống phát hiện các tên trùng:{' '}
                  <strong>
                    {pendingDuplicateCheck.duplicates
                      .map((d) => `${d.name} (${d.count} lần)`)
                      .join(', ')}
                  </strong>
                  . Giáo viên muốn giữ nguyên hay tự động loại bỏ tên trùng?
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pl-9">
              <button
                type="button"
                data-testid="btn-remove-duplicates"
                onClick={() =>
                  commitNameList(pendingDuplicateCheck.uniqueNames, true)
                }
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Loại bỏ tên trùng ({pendingDuplicateCheck.uniqueNames.length} HS)
              </button>
              <button
                type="button"
                data-testid="btn-keep-duplicates"
                onClick={() =>
                  commitNameList(pendingDuplicateCheck.cleanNames, true)
                }
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Giữ tất cả tên trùng ({pendingDuplicateCheck.cleanNames.length} HS)
              </button>
              <button
                type="button"
                onClick={() => setPendingDuplicateCheck(null)}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
              >
                Hủy thao tác
              </button>
            </div>
          </div>
        )}

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Action Toolbar: Add Single Student + Bulk Paste Toggle + File Import/Export + Reset Cycle */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <form
              onSubmit={handleAddSingleStudent}
              className="flex items-center gap-2 flex-1 min-w-[260px]"
            >
              <label htmlFor="single-student-input" className="sr-only">
                Nhập tên học sinh mới
              </label>
              <input
                id="single-student-input"
                type="text"
                placeholder="Nhập họ và tên học sinh mới (VD: Nguyễn Minh Anh)..."
                value={singleNameInput}
                onChange={(e) => setSingleNameInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs md:text-sm cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm HS</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="btn-toggle-bulk-paste"
                onClick={() => setShowBulkPanel((prev) => !prev)}
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                {showBulkPanel
                  ? 'Đóng khung dán Excel/Sheets'
                  : 'Dán nhiều tên (Excel / Sheets)'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv,.tsv"
                onChange={handleFileImport}
                className="hidden"
                aria-label="Tải tệp TXT hoặc CSV"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-200 border border-cyan-500/30 font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Nhập TXT/CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={students.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-200 border border-emerald-500/30 font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất CSV</span>
              </button>

              <button
                type="button"
                onClick={handleResetTurnConfirm}
                disabled={students.length === 0}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/50 font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại lượt gọi</span>
              </button>
            </div>
          </div>

          {/* Bulk Paste Panel (Excel / Google Sheets / Multi-line) */}
          {showBulkPanel && (
            <div className="p-4 rounded-2xl bg-[#070B19] border border-indigo-500/50 space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="bulk-student-textarea"
                  className="text-xs font-bold text-indigo-200"
                >
                  Dán danh sách học sinh từ Excel, Google Sheets hoặc văn bản (mỗi dòng 1 học sinh):
                </label>
                <span className="text-xs text-slate-400">
                  Tự động bỏ dòng trống & giữ nguyên dấu tiếng Việt
                </span>
              </div>
              <textarea
                id="bulk-student-textarea"
                rows={5}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'Nguyễn Minh Anh\nTrần Gia Huy\nLê Hoàng Bảo Ngọc'}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid="btn-bulk-append"
                  onClick={() => handleProcessBulkNames(bulkText, false)}
                  className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Thêm nối tiếp vào danh sách hiện tại
                </button>
                <button
                  type="button"
                  data-testid="btn-bulk-replace"
                  onClick={() => handleProcessBulkNames(bulkText, true)}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Thay thế toàn bộ danh sách lớp này
                </button>
              </div>
            </div>
          )}

          {/* Search & Delete All Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Tìm kiếm học sinh theo tên"
                placeholder="Tìm kiếm học sinh theo tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#070B19] border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            {students.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllStudents}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa toàn bộ HS</span>
              </button>
            )}
          </div>

          {/* Student Table */}
          {students.length === 0 ? (
            <div
              data-testid="empty-student-list-notice"
              className="p-10 rounded-2xl bg-[#070B19]/80 border border-dashed border-slate-700 text-center space-y-2"
            >
              <p className="font-display font-bold text-lg text-amber-300">
                DANH SÁCH HỌC SINH ĐANG TRỐNG!
              </p>
              <p className="text-sm text-slate-400">
                Vui lòng nhập tên học sinh hoặc dán danh sách từ Excel/Google
                Sheets trước khi bắt đầu săn tìm.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#070B19]/90">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#111E46] text-xs font-bold uppercase text-cyan-200 border-b border-slate-800">
                    <th className="py-3 px-4 w-16">STT</th>
                    <th className="py-3 px-4">Họ và tên học sinh</th>
                    <th className="py-3 px-4 w-40">Trạng thái chu kỳ</th>
                    <th className="py-3 px-4 w-32 text-center">Tổng lượt gọi</th>
                    <th className="py-3 px-4 w-36 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {filteredStudents.map((stu, idx) => (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-900/80 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono-num text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-white">
                        {editingStudentId === stu.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              aria-label="Sửa tên học sinh"
                              className="px-3 py-1 rounded-lg bg-slate-950 border border-cyan-400 text-sm text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditStudent(stu.id)}
                              aria-label={`Lưu tên ${stu.name}`}
                              className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStudentId(null)}
                              aria-label="Hủy sửa tên"
                              className="p-1.5 rounded-lg bg-slate-700 text-slate-200 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          stu.name
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-xs font-bold">
                        {stu.calledInCycle ? (
                          <span className="text-amber-300">✓ Đã được gọi</span>
                        ) : (
                          <span className="text-cyan-300">○ Chưa gọi</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono-num text-center text-slate-300">
                        {stu.calledCount}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudentId(stu.id);
                              setEditingName(stu.name);
                            }}
                            aria-label={`Sửa học sinh ${stu.name}`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(stu)}
                            aria-label={`Xóa học sinh ${stu.name}`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/80 text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Confirmation Sub-Dialog */}
        {confirmAction && (
          <div
            role="alertdialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <div className="w-full max-w-md rounded-2xl bg-[#111E46] border-2 border-amber-400 p-6 space-y-4 shadow-2xl">
              <h3 className="font-display font-bold text-lg text-amber-300">
                {confirmAction.title}
              </h3>
              <p className="text-sm text-slate-200">{confirmAction.message}</p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  data-testid="btn-confirm-dialog-yes"
                  onClick={confirmAction.onConfirm}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Xác nhận đồng ý
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
