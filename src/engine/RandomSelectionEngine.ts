import {
  ClassRoster,
  DuplicateCheckResult,
  EventProbabilities,
  GameSettingsConfig,
  HistoryRecord,
  ScanChoreographyPattern,
  Student,
  UfoSurpriseEvent,
} from '../types/game';

export const DEFAULT_PROBABILITIES: EventProbabilities = {
  catch: 60,
  miss: 25,
  falseSignal: 10,
  nearMiss: 5,
};

export const DEFAULT_SETTINGS: GameSettingsConfig = {
  soundEnabled: true,
  sfxVolume: 0.8,
  voiceEnabled: true,
  voiceVolume: 1.0,
  voiceRate: 1.0,
  animationSpeed: 1.0,
  scanDurationSeconds: 3.5,
  maxConsecutiveMisses: 4,
  probabilities: { ...DEFAULT_PROBABILITIES },
  noRepeatInCycle: true,
  fullscreen: false,
  prefer2DFallback: false,
};

export const DEFAULT_STUDENTS_NAMES: string[] = [
  'Nguyễn Minh Anh',
  'Trần Gia Huy',
  'Lê Hoàng Bảo Ngọc',
  'Phạm Tuấn Kiệt',
  'Hoàng Khánh Linh',
  'Vũ Đức Minh',
  'Đặng Phương Thảo',
  'Bùi Quang Hải',
  'Đỗ Ngọc Bảo Trâm',
  'Hồ Thiên Phúc',
  'Ngô Thanh Hà',
  'Dương Quốc Bảo',
  'Lý Nhã Kỳ',
  'Phan Trọng Nhân',
  'Trương Mỹ Duyên',
  'Đinh Khôi Nguyên',
  'Lâm Bảo Châu',
  'Mai Anh Tuấn',
  'Trịnh Tuyết Nhi',
  'Đoàn Minh Khang',
];

/**
 * Parses raw pasted text or CSV/TSV content into clean student names.
 * Preserves Vietnamese diacritics 100% accurately, removes empty lines and excess spaces.
 */
export function parseRawStudentInput(rawText: string): string[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const lines = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');

  const parsed: string[] = [];

  for (const rawLine of lines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) continue;

    // Handle TSV or CSV columns (if pasted from Excel/Sheets with STT + Name columns)
    let candidate = trimmedLine;
    if (trimmedLine.includes('\t')) {
      const cols = trimmedLine
        .split('\t')
        .map((c) => c.trim().replace(/^["']|["']$/g, '').trim())
        .filter(Boolean);
      // If first column is just a number (STT), pick the first non-numeric column or join name columns
      if (cols.length >= 2 && /^\d+$/.test(cols[0])) {
        candidate = cols.slice(1).join(' ');
      } else if (cols.length >= 1) {
        candidate = cols[0];
      }
    } else if (trimmedLine.includes(',')) {
      const cols = trimmedLine
        .split(',')
        .map((c) => c.trim().replace(/^["']|["']$/g, '').trim())
        .filter(Boolean);
      if (cols.length >= 2 && /^\d+$/.test(cols[0])) {
        candidate = cols[1];
      } else if (cols.length === 1) {
        candidate = cols[0];
      }
    }

    // Normalize internal multiple whitespace into single space without altering Vietnamese characters
    const normalized = candidate.replace(/\s+/g, ' ').trim();
    if (!normalized) continue;

    // Skip common CSV header rows if present
    const lower = normalized.toLowerCase();
    if (
      lower === 'họ và tên' ||
      lower === 'tên học sinh' ||
      lower === 'họ tên' ||
      lower === 'student name' ||
      lower === 'name' ||
      lower === 'stt'
    ) {
      continue;
    }

    parsed.push(normalized);
  }

  return parsed;
}

/**
 * Analyzes a list of names for exact duplicates (case-insensitive or exact match).
 */
export function analyzeStudentDuplicates(names: string[]): DuplicateCheckResult {
  const cleanNames = names.map((n) => n.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const counts = new Map<string, { original: string; count: number }>();
  const uniqueNames: string[] = [];

  for (const name of cleanNames) {
    const key = name.toLocaleLowerCase('vi-VN');
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { original: name, count: 1 });
      uniqueNames.push(name);
    }
  }

  const duplicates: { name: string; count: number }[] = [];
  counts.forEach((val) => {
    if (val.count > 1) {
      duplicates.push({ name: val.original, count: val.count });
    }
  });

  return {
    cleanNames,
    uniqueNames,
    duplicates,
    hasDuplicates: duplicates.length > 0,
  };
}

/**
 * Creates a Student object from a name.
 */
export function createStudent(name: string, index: number, idPrefix = 'stu'): Student {
  const trimmed = name.replace(/\s+/g, ' ').trim();
  return {
    id: `${idPrefix}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 7)}`,
    name: trimmed,
    calledInCycle: false,
    calledCount: 0,
    avatarIndex: index % 12,
  };
}

/**
 * Creates the default initial class roster.
 */
export function createDefaultRoster(): ClassRoster {
  return {
    id: 'class_default_3a',
    name: 'Lớp 3A - Vũ Trụ Nhí',
    students: DEFAULT_STUDENTS_NAMES.map((name, idx) =>
      createStudent(name, idx, 'init')
    ),
    currentCycle: 1,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Returns eligible candidate students for selection based on noRepeatInCycle setting.
 */
export function getEligibleStudents(
  students: Student[],
  noRepeatInCycle: boolean
): Student[] {
  if (!students || students.length === 0) return [];
  if (!noRepeatInCycle) return [...students];
  return students.filter((s) => !s.calledInCycle);
}

/**
 * Checks if all students in the roster have been called in the current cycle.
 */
export function isCycleComplete(
  students: Student[],
  noRepeatInCycle: boolean
): boolean {
  if (!students || students.length === 0) return false;
  if (!noRepeatInCycle) return false;
  return students.every((s) => s.calledInCycle);
}

/**
 * Fairly selects one student uniformly at random from the eligible pool.
 * Never selects by list order or fixed name seed.
 * Accepts an optional rng function () => [0, 1) for deterministic unit testing.
 */
export function selectRandomStudentFairly(
  students: Student[],
  noRepeatInCycle: boolean,
  rng: () => number = Math.random
): Student | null {
  const eligible = getEligibleStudents(students, noRepeatInCycle);
  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0];

  const randomVal = Math.max(0, Math.min(0.999999999, rng()));
  const chosenIndex = Math.floor(randomVal * eligible.length);
  return eligible[chosenIndex];
}

/**
 * Marks a chosen student as called ONLY after the catch event completes.
 */
export function markStudentAsCalled(
  students: Student[],
  selectedStudentId: string
): Student[] {
  return students.map((s) =>
    s.id === selectedStudentId
      ? {
          ...s,
          calledInCycle: true,
          calledCount: s.calledCount + 1,
        }
      : s
  );
}

/**
 * Resets the called status of all students for a new cycle without deleting any student.
 */
export function resetCycleStudents(students: Student[]): Student[] {
  return students.map((s) => ({
    ...s,
    calledInCycle: false,
  }));
}

/**
 * Normalizes and validates event probabilities so they always sum to 100% and each is >= 0.
 * When a specific key is changed by the user, adjusts the remaining keys proportionally.
 */
export function adjustProbabilitiesTo100(
  current: EventProbabilities,
  changedKey?: keyof EventProbabilities,
  newValue?: number
): EventProbabilities {
  const keys: (keyof EventProbabilities)[] = [
    'catch',
    'miss',
    'falseSignal',
    'nearMiss',
  ];

  const next: EventProbabilities = {
    catch: Math.max(0, Math.min(100, Math.round(current.catch))),
    miss: Math.max(0, Math.min(100, Math.round(current.miss))),
    falseSignal: Math.max(0, Math.min(100, Math.round(current.falseSignal))),
    nearMiss: Math.max(0, Math.min(100, Math.round(current.nearMiss))),
  };

  if (changedKey && typeof newValue === 'number') {
    const clamped = Math.max(0, Math.min(100, Math.round(newValue)));
    next[changedKey] = clamped;
    const remainingTarget = 100 - clamped;
    const otherKeys = keys.filter((k) => k !== changedKey);
    const otherSum = otherKeys.reduce((acc, k) => acc + next[k], 0);

    if (otherSum === 0) {
      // Distribute evenly if others were 0
      const base = Math.floor(remainingTarget / otherKeys.length);
      let rem = remainingTarget - base * otherKeys.length;
      for (const k of otherKeys) {
        next[k] = base + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;
      }
    } else {
      let allocated = 0;
      otherKeys.forEach((k, idx) => {
        if (idx === otherKeys.length - 1) {
          next[k] = Math.max(0, remainingTarget - allocated);
        } else {
          const share = Math.round((next[k] / otherSum) * remainingTarget);
          next[k] = share;
          allocated += share;
        }
      });
    }
    return next;
  }

  const total = next.catch + next.miss + next.falseSignal + next.nearMiss;
  if (total === 100) return next;
  if (total === 0) return { ...DEFAULT_PROBABILITIES };

  const factor = 100 / total;
  const scaled: EventProbabilities = {
    catch: Math.round(next.catch * factor),
    miss: Math.round(next.miss * factor),
    falseSignal: Math.round(next.falseSignal * factor),
    nearMiss: 0,
  };
  scaled.nearMiss = Math.max(
    0,
    100 - (scaled.catch + scaled.miss + scaled.falseSignal)
  );
  return scaled;
}

/**
 * Rolls the next UFO event based on configured probabilities and consecutive miss limit.
 * Guarantees that if consecutiveMisses >= maxConsecutiveMisses, the next event is 'catch'.
 */
export function rollUfoOutcomeEvent(
  probabilities: EventProbabilities,
  consecutiveMisses: number,
  maxConsecutiveMisses: number,
  rng: () => number = Math.random
): 'catch' | 'miss' | 'falseSignal' | 'nearMiss' {
  if (consecutiveMisses >= maxConsecutiveMisses) {
    return 'catch';
  }

  const norm = adjustProbabilitiesTo100(probabilities);
  // If catch is 0 and maxConsecutiveMisses > 0, it will eventually hit maxConsecutiveMisses,
  // otherwise roll [0, 100)
  const roll = Math.max(0, Math.min(99.999999, rng() * 100));

  if (roll < norm.catch) {
    return 'catch';
  }
  if (roll < norm.catch + norm.miss) {
    return 'miss';
  }
  if (roll < norm.catch + norm.miss + norm.falseSignal) {
    return 'falseSignal';
  }
  return 'nearMiss';
}

/**
 * Picks a random scan choreography sequence so the UFO never repeats the exact same routine mechanically.
 */
export function pickRandomScanChoreography(
  rng: () => number = Math.random
): ScanChoreographyPattern {
  const patterns: ScanChoreographyPattern[] = [
    'leftToRightSweep',
    'circleClassroom',
    'zigzagRadar',
    'probeAndSwitch',
    'figureEightDash',
  ];
  const idx = Math.floor(Math.max(0, Math.min(0.99999, rng())) * patterns.length);
  return patterns[idx];
}

/**
 * Picks an optional dramatic flavor twist (like suddenBoost or fakeGiveUp) during a miss/scan transition.
 */
export function pickDramaticTwist(
  outcome: 'miss' | 'falseSignal' | 'nearMiss',
  rng: () => number = Math.random
): UfoSurpriseEvent {
  const r = rng();
  if (outcome === 'miss' && r < 0.28) {
    return 'fakeGiveUp';
  }
  if (outcome === 'falseSignal' && r < 0.32) {
    return 'suddenBoost';
  }
  return outcome;
}

/**
 * Exports a student list to CSV content with UTF-8 BOM for Excel Vietnamese compatibility.
 */
export function exportStudentsToCsv(students: Student[]): string {
  const header = 'STT,Họ và tên,Trạng thái trong chu kỳ,Số lần được gọi';
  const rows = students.map((s, idx) => {
    const escapedName = `"${s.name.replace(/"/g, '""')}"`;
    const status = s.calledInCycle ? 'Đã gọi' : 'Chưa gọi';
    return `${idx + 1},${escapedName},${status},${s.calledCount}`;
  });
  return '\uFEFF' + [header, ...rows].join('\n');
}

/**
 * Exports call history to CSV content with UTF-8 BOM for Excel Vietnamese compatibility.
 */
export function exportHistoryToCsv(records: HistoryRecord[]): string {
  const header =
    'STT,Tên học sinh,Lớp,Thời điểm được chọn,Số lần UFO hụt trước khi bắt,Chu kỳ chơi,Trạng thái';
  const rows = records.map((r) => {
    const escapedName = `"${r.studentName.replace(/"/g, '""')}"`;
    const escapedClass = `"${r.className.replace(/"/g, '""')}"`;
    const escapedTime = `"${r.timestamp}"`;
    return `${r.orderNumber},${escapedName},${escapedClass},${escapedTime},${r.missesBeforeCatch},${r.cycle},${r.calledStatus}`;
  });
  return '\uFEFF' + [header, ...rows].join('\n');
}
