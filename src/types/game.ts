export type GameState =
  | 'ready'
  | 'entering'
  | 'scanning'
  | 'locking'
  | 'missing'
  | 'falseSignal'
  | 'catching'
  | 'revealing'
  | 'paused'
  | 'stopped'
  | 'completed';

export type UfoSurpriseEvent =
  | 'catch'
  | 'miss'
  | 'falseSignal'
  | 'nearMiss'
  | 'suddenBoost'
  | 'fakeGiveUp';

export type ScanChoreographyPattern =
  | 'leftToRightSweep'
  | 'circleClassroom'
  | 'zigzagRadar'
  | 'probeAndSwitch'
  | 'figureEightDash';

export interface Student {
  id: string;
  name: string;
  calledInCycle: boolean;
  calledCount: number;
  avatarIndex: number;
}

export interface ClassRoster {
  id: string;
  name: string;
  students: Student[];
  currentCycle: number;
  createdAt: string;
}

export interface HistoryRecord {
  id: string;
  orderNumber: number;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  timestamp: string;
  missesBeforeCatch: number;
  cycle: number;
  calledStatus: 'Đã gọi';
}

export interface EventProbabilities {
  catch: number;       // Default 60%
  miss: number;        // Default 25%
  falseSignal: number; // Default 10%
  nearMiss: number;    // Default 5%
}

export interface GameSettingsConfig {
  soundEnabled: boolean;
  sfxVolume: number;         // 0 to 1
  voiceEnabled: boolean;
  voiceVolume: number;       // 0 to 1
  voiceRate: number;         // 0.7 to 1.4
  animationSpeed: number;    // 0.5 to 2.0 (1 = normal)
  scanDurationSeconds: number; // 2 to 10
  maxConsecutiveMisses: number; // Default 4
  probabilities: EventProbabilities;
  noRepeatInCycle: boolean;  // Default true
  fullscreen: boolean;
  prefer2DFallback: boolean; // Allows manual 2D fallback if desired
}

export interface DuplicateCheckResult {
  cleanNames: string[];
  uniqueNames: string[];
  duplicates: { name: string; count: number }[];
  hasDuplicates: boolean;
}
