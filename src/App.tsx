/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ClassRoster,
  GameSettingsConfig,
  GameState,
  HistoryRecord,
  ScanChoreographyPattern,
  Student,
  UfoSurpriseEvent,
} from './types/game';
import {
  adjustProbabilitiesTo100,
  createDefaultRoster,
  DEFAULT_SETTINGS,
  getEligibleStudents,
  isCycleComplete,
  markStudentAsCalled,
  pickDramaticTwist,
  pickRandomScanChoreography,
  resetCycleStudents,
  rollUfoOutcomeEvent,
  selectRandomStudentFairly,
} from './engine/RandomSelectionEngine';
import {
  mapToBodyDatasetState,
  SequenceTimerController,
  VIETNAMESE_STAGE_MESSAGES,
} from './engine/GameStateManager';
import { audioManager } from './engine/AudioManager';
import { GameScene } from './components/GameScene';
import { GameControls, TeacherAccountProfile } from './components/GameControls';
import { ResultOverlay } from './components/ResultOverlay';
import { StudentManager } from './components/StudentManager';
import { HistoryPanel } from './components/HistoryPanel';
import { GameSettings } from './components/GameSettings';
import {
  clearCloudCallHistory,
  deleteCloudRoster,
  initializeOrLoadTeacherCloudData,
  saveCloudCallHistoryRecord,
  saveCloudRoster,
  saveCloudWorkspacePreferences,
  signInWithGoogleAccount,
  signOutGoogleAccount,
  subscribeToAuthChanges,
  subscribeToTeacherCloudData,
} from './services/firebaseService';
import type { User } from 'firebase/auth';

const STORAGE_KEYS = {
  ROSTERS: 'ufo_may_man_rosters_v1',
  ACTIVE_ROSTER_ID: 'ufo_may_man_active_roster_id_v1',
  HISTORY: 'ufo_may_man_history_v1',
  SETTINGS: 'ufo_may_man_settings_v1',
};

function loadInitialRosters(): ClassRoster[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROSTERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to default
  }
  return [createDefaultRoster()];
}

function loadInitialActiveRosterId(rosters: ClassRoster[]): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ROSTER_ID);
    if (saved && rosters.some((r) => r.id === saved)) {
      return saved;
    }
  } catch {
    // Fallback
  }
  return rosters[0].id;
}

function loadInitialHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Fallback
  }
  return [];
}

function loadInitialSettings(): GameSettingsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          probabilities: adjustProbabilitiesTo100(
            parsed.probabilities || DEFAULT_SETTINGS.probabilities
          ),
        };
      }
    }
  } catch {
    // Fallback
  }
  return { ...DEFAULT_SETTINGS };
}

export default function App() {
  const [rosters, setRosters] = useState<ClassRoster[]>(loadInitialRosters);
  const [activeRosterId, setActiveRosterId] = useState<string>(() =>
    loadInitialActiveRosterId(rosters)
  );
  const [history, setHistory] = useState<HistoryRecord[]>(loadInitialHistory);
  const [settings, setSettings] =
    useState<GameSettingsConfig>(loadInitialSettings);

  const [gameState, setGameState] = useState<GameState>('ready');
  const [bannerMessage, setBannerMessage] = useState<string>(
    VIETNAMESE_STAGE_MESSAGES.ready[0]
  );
  const [hoveredStudent, setHoveredStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [scanPattern, setScanPattern] =
    useState<ScanChoreographyPattern>('leftToRightSweep');
  const [activeSurpriseEvent, setActiveSurpriseEvent] =
    useState<UfoSurpriseEvent | null>(null);
  const [consecutiveMisses, setConsecutiveMisses] = useState<number>(0);

  // Modals
  const [isStudentManagerOpen, setIsStudentManagerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Google Account & Cloud Sync State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [teacherProfile, setTeacherProfile] =
    useState<TeacherAccountProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  // Refs for async sequence safety
  const timerControllerRef = useRef(new SequenceTimerController());
  const rostersRef = useRef(rosters);
  const activeRosterIdRef = useRef(activeRosterId);
  const settingsRef = useRef(settings);
  const historyRef = useRef(history);
  const authUserRef = useRef<User | null>(null);
  const consecutiveMissesRef = useRef(consecutiveMisses);
  const turnMissCountRef = useRef(0);
  const pausedFromStateRef = useRef<GameState>('scanning');

  useEffect(() => {
    rostersRef.current = rosters;
    try {
      localStorage.setItem(STORAGE_KEYS.ROSTERS, JSON.stringify(rosters));
    } catch {
      // Ignore storage quota errors
    }
  }, [rosters]);

  useEffect(() => {
    activeRosterIdRef.current = activeRosterId;
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ROSTER_ID, activeRosterId);
    } catch {
      // Ignore
    }
  }, [activeRosterId]);

  useEffect(() => {
    historyRef.current = history;
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {
      // Ignore
    }
  }, [history]);

  useEffect(() => {
    settingsRef.current = settings;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  useEffect(() => {
    consecutiveMissesRef.current = consecutiveMisses;
  }, [consecutiveMisses]);

  // Subscribe to Firebase Google Auth state & real-time Firestore teacher cloud data
  useEffect(() => {
    let unsubCloud: (() => void) | null = null;

    const unsubAuth = subscribeToAuthChanges(async (user) => {
      authUserRef.current = user;
      setAuthUser(user);

      if (unsubCloud) {
        unsubCloud();
        unsubCloud = null;
      }

      if (!user) {
        setTeacherProfile(null);
        setIsSyncingCloud(false);
        return;
      }

      setTeacherProfile({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      });

      setIsSyncingCloud(true);
      try {
        await initializeOrLoadTeacherCloudData(
          user,
          rostersRef.current,
          activeRosterIdRef.current,
          settingsRef.current,
          historyRef.current
        );

        unsubCloud = subscribeToTeacherCloudData(user, {
          onWorkspaceLoaded: (cloudActiveRosterId, cloudSettings) => {
            if (cloudActiveRosterId) {
              setActiveRosterId(cloudActiveRosterId);
            }
            setSettings((prev) => ({
              ...prev,
              ...cloudSettings,
            }));
          },
          onRostersLoaded: (cloudRosters) => {
            if (cloudRosters.length > 0) {
              setRosters(cloudRosters);
            }
          },
          onHistoryLoaded: (cloudHistory) => {
            setHistory(cloudHistory);
          },
        });
      } catch (err) {
        console.error('Lỗi đồng bộ dữ liệu Google Cloud:', err);
      } finally {
        setIsSyncingCloud(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubCloud) unsubCloud();
    };
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    setIsAuthLoading(true);
    try {
      const user = await signInWithGoogleAccount();
      setBannerMessage(
        `ĐÃ ĐĂNG NHẬP GOOGLE: ${(
          user.displayName ||
          user.email ||
          'GIÁO VIÊN'
        ).toUpperCase()} – DỮ LIỆU ĐƯỢC ĐỒNG BỘ TỰ ĐỘNG!`
      );
    } catch (err) {
      console.warn('Đăng nhập Google bị hủy hoặc gặp lỗi:', err);
    } finally {
      setIsAuthLoading(false);
    }
  }, []);

  const handleGoogleLogout = useCallback(async () => {
    try {
      await signOutGoogleAccount();
      setBannerMessage(
        'ĐÃ ĐĂNG XUẤT TÀI KHOẢN GOOGLE! DỮ LIỆU HIỆN LƯU TRÊN TRÌNH DUYỆT.'
      );
    } catch (err) {
      console.warn('Lỗi khi đăng xuất Google:', err);
    }
  }, []);

  // Mirror game state to document.body.dataset.state
  useEffect(() => {
    document.body.dataset.state = mapToBodyDatasetState(gameState);
    document.body.dataset.gamestate = gameState;
  }, [gameState]);

  const activeRoster =
    rosters.find((r) => r.id === activeRosterId) || rosters[0];
  const students = activeRoster?.students || [];
  const calledCount = students.filter((s) => s.calledInCycle).length;
  const uncalledCount = students.length - calledCount;

  const getSpeedAdjustedMs = (baseMs: number) => {
    const spd = Math.max(0.5, Math.min(2.0, settingsRef.current.animationSpeed));
    return Math.round(baseMs / spd);
  };

  /**
   * Stops any running sequence cleanly without recording any student.
   */
  const handleStopGame = useCallback(() => {
    timerControllerRef.current.invalidateRun();
    audioManager.stopAllAudio();
    setHoveredStudent(null);
    setActiveSurpriseEvent(null);
    setGameState('stopped');
    setBannerMessage(VIETNAMESE_STAGE_MESSAGES.stopped[0]);
  }, []);

  /**
   * Executes Stage B (Scanning) -> Stage C (Locking & Outcome Roll: Catch / Miss / FalseSignal / NearMiss)
   */
  const runScanAndAttemptCycle = useCallback((runId: number) => {
    const controller = timerControllerRef.current;
    if (runId !== controller.getRunId()) return;

    const currentRoster =
      rostersRef.current.find((r) => r.id === activeRosterIdRef.current) ||
      rostersRef.current[0];
    const currentStudents = currentRoster?.students || [];
    const cfg = settingsRef.current;

    if (currentStudents.length === 0) {
      setGameState('ready');
      setBannerMessage(
        'DANH SÁCH HỌC SINH ĐANG TRỐNG! VUI LÒNG NHẬP HỌC SINH TRƯỚC KHI BẮT ĐẦU!'
      );
      return;
    }

    if (isCycleComplete(currentStudents, cfg.noRepeatInCycle)) {
      setGameState('completed');
      setBannerMessage(VIETNAMESE_STAGE_MESSAGES.completed[0]);
      audioManager.playCycleCompletedCelebration(cfg);
      audioManager.speakVietnamese(
        'Tất cả học sinh đã được UFO gọi tên! Xin chúc mừng cả lớp!',
        cfg
      );
      return;
    }

    // Stage B: Quét tìm học sinh
    const pattern = pickRandomScanChoreography();
    setScanPattern(pattern);
    setActiveSurpriseEvent(null);
    setGameState('scanning');
    setBannerMessage('HỆ THỐNG ĐANG QUÉT TÌM HỌC SINH…');
    audioManager.playRadarScanPing(cfg);

    const eligible = getEligibleStudents(currentStudents, cfg.noRepeatInCycle);
    const scanTotalMs = getSpeedAdjustedMs(cfg.scanDurationSeconds * 1000);
    const probeSteps = 8;

    // UFO probes across several random students with decelerating suspense ("UFO thăm dò trên đầu các bạn")
    let lastPickedId = '';
    for (let step = 0; step < probeSteps; step++) {
      // Non-linear progress so early hops are rapid and final hops linger suspensefully
      const progress = Math.pow(step / probeSteps, 1.25);
      const delayMs = Math.floor(progress * scanTotalMs * 0.92);

      controller.schedule(
        runId,
        () => {
          const pool = eligible.length > 0 ? eligible : currentStudents;
          let candidates = pool.filter((s) => s.id !== lastPickedId);
          if (candidates.length === 0) candidates = pool;
          const randomProbe =
            candidates[Math.floor(Math.random() * candidates.length)] ||
            currentStudents[0];
          lastPickedId = randomProbe.id;
          setHoveredStudent(randomProbe);
          audioManager.playRadarScanPing(settingsRef.current);
          setBannerMessage(
            `UFO ĐANG DÒ TÍN HIỆU TRÊN ĐẦU: ${randomProbe.name.toUpperCase()}…`
          );
        },
        delayMs
      );
    }

    // Stage C: Khóa mục tiêu (Locking)
    controller.schedule(
      runId,
      () => {
        const outcome = rollUfoOutcomeEvent(
          settingsRef.current.probabilities,
          consecutiveMissesRef.current,
          settingsRef.current.maxConsecutiveMisses
        );

        // Pick target student for this attempt
        const fairTarget = selectRandomStudentFairly(
          currentStudents,
          settingsRef.current.noRepeatInCycle
        );
        if (!fairTarget) {
          setGameState('completed');
          setBannerMessage(VIETNAMESE_STAGE_MESSAGES.completed[0]);
          return;
        }

        // If UFO probes one student then switches at the last moment:
        setHoveredStudent(fairTarget);
        setSelectedStudent(fairTarget);
        setGameState('locking');
        setBannerMessage('ĐANG KHÓA MỤC TIÊU! CHUẨN BỊ BẮT… 3… 2… 1…');
        audioManager.playTargetLockBeeps(settingsRef.current);
        audioManager.speakVietnamese(
          'Tín hiệu đã xuất hiện! Chuẩn bị nhé! Ba, hai, một!',
          settingsRef.current
        );

        const lockDurationMs = getSpeedAdjustedMs(1250);

        controller.schedule(
          runId,
          () => {
            if (outcome === 'catch') {
              // SỰ KIỆN 1: BẮT TRÚNG!
              setGameState('catching');
              setActiveSurpriseEvent('catch');
              setBannerMessage('BÍ MẬT SẮP ĐƯỢC TIẾT LỘ!');
              audioManager.playTractorCatchBeam(settingsRef.current);
              audioManager.speakVietnamese(
                'Bí mật sắp được tiết lộ!',
                settingsRef.current
              );

              const catchLiftMs = getSpeedAdjustedMs(1350);
              controller.schedule(
                runId,
                () => {
                  // Only mark student as called AFTER catch completes!
                  const missesThisTurn = turnMissCountRef.current;
                  turnMissCountRef.current = 0;
                  setConsecutiveMisses(0);

                  const nowStr = new Date().toLocaleString('vi-VN');
                  const updatedStudents = markStudentAsCalled(
                    currentRoster.students,
                    fairTarget.id
                  );
                  const updatedRoster: ClassRoster = {
                    ...currentRoster,
                    students: updatedStudents,
                  };

                  setRosters((prevRosters) =>
                    prevRosters.map((r) =>
                      r.id === activeRosterIdRef.current ? updatedRoster : r
                    )
                  );

                  const newRecord: HistoryRecord = {
                    id: `hist_${Date.now()}_${Math.random()
                      .toString(36)
                      .slice(2, 6)}`,
                    orderNumber: historyRef.current.length + 1,
                    studentId: fairTarget.id,
                    studentName: fairTarget.name,
                    classId: currentRoster.id,
                    className: currentRoster.name,
                    timestamp: nowStr,
                    missesBeforeCatch: missesThisTurn,
                    cycle: currentRoster.currentCycle,
                    calledStatus: 'Đã gọi',
                  };

                  setHistory((prevHist) => [newRecord, ...prevHist]);

                  if (authUserRef.current) {
                    setIsSyncingCloud(true);
                    Promise.all([
                      saveCloudRoster(authUserRef.current.uid, updatedRoster),
                      saveCloudCallHistoryRecord(
                        authUserRef.current.uid,
                        currentRoster.id,
                        newRecord
                      ),
                    ])
                      .catch((e) => console.error(e))
                      .finally(() => setIsSyncingCloud(false));
                  }

                  setGameState('revealing');
                  setBannerMessage(
                    `CHÚC MỪNG! ${fairTarget.name.toUpperCase()} ĐÃ ĐƯỢC UFO LỰA CHỌN!`
                  );
                  audioManager.playVictoryRevealFanfare(settingsRef.current);
                  audioManager.speakVietnamese(
                    `Chúc mừng em, ${fairTarget.name} đã được UFO lựa chọn! Xin chúc mừng! Cả lớp hãy dành một tràng pháo tay!`,
                    settingsRef.current
                  );
                },
                catchLiftMs
              );
            } else if (outcome === 'falseSignal') {
              // SỰ KIỆN 3 / 4: BẮT NHẦM TÍN HIỆU GIẢ HOẶC TĂNG TỐC ĐỘT NGỘT
              const twist = pickDramaticTwist('falseSignal');
              turnMissCountRef.current += 1;
              setConsecutiveMisses((prev) => prev + 1);
              setActiveSurpriseEvent(twist);
              setGameState('falseSignal');

              if (twist === 'suddenBoost') {
                setBannerMessage(
                  'BẤT NGỜ CHƯA! ĐỘNG CƠ UFO TĂNG TỐC ĐỘT NGỘT RỒI ĐỔI HƯỚNG!'
                );
                audioManager.playSuddenBoost(settingsRef.current);
              } else {
                setBannerMessage('Ơ! TÍN HIỆU GIẢ RỒI! THỬ LẠI NÀO!');
                audioManager.playConfusedFalseSignal(settingsRef.current);
                audioManager.speakVietnamese(
                  'Tín hiệu giả! Thử lại nào!',
                  settingsRef.current
                );
              }

              controller.schedule(
                runId,
                () => {
                  runScanAndAttemptCycle(runId);
                },
                getSpeedAdjustedMs(1500)
              );
            } else {
              // SỰ KIỆN 2 / 5 / 6: BẮT HỤT / SUÝT BẮT ĐƯỢC / GIẢ VỜ BỎ CUỘC
              const twist =
                outcome === 'nearMiss'
                  ? 'nearMiss'
                  : pickDramaticTwist('miss');
              turnMissCountRef.current += 1;
              setConsecutiveMisses((prev) => prev + 1);
              setActiveSurpriseEvent(twist);
              setGameState('missing');

              if (twist === 'nearMiss') {
                setBannerMessage(
                  `SUÝT BẮT ĐƯỢC! ${fairTarget.name.toUpperCase()} NÉ KỊP TRONG GANG TẤC!`
                );
                audioManager.playFunnyBoingMiss(settingsRef.current);
                audioManager.speakVietnamese(
                  'Ôi! UFO bắt hụt rồi!',
                  settingsRef.current
                );
              } else if (twist === 'fakeGiveUp') {
                setBannerMessage(
                  'UFO TẮT ĐÈN GIẢ VỜ BỎ CUỘC… NHƯNG BẤT NGỜ QUAY LẠI!'
                );
                audioManager.playSuddenBoost(settingsRef.current);
                audioManager.speakVietnamese(
                  'Bất ngờ chưa! UFO quay lại săn tìm tiếp đây!',
                  settingsRef.current
                );
              } else {
                setBannerMessage('ÔI! HỤT MẤT RỒI! BOING!');
                audioManager.playFunnyBoingMiss(settingsRef.current);
                audioManager.speakVietnamese(
                  'Ôi! UFO bắt hụt rồi!',
                  settingsRef.current
                );
              }

              controller.schedule(
                runId,
                () => {
                  runScanAndAttemptCycle(runId);
                },
                getSpeedAdjustedMs(1550)
              );
            }
          },
          lockDurationMs
        );
      },
      scanTotalMs
    );
  }, []);

  /**
   * Starts a full UFO hunt sequence from Stage A (Entering) -> Stage B (Scanning) -> Stage C (Catch/Miss).
   */
  const handleStartHunt = useCallback(() => {
    audioManager.unlockAudioByUserGesture();
    const currentRoster =
      rostersRef.current.find((r) => r.id === activeRosterIdRef.current) ||
      rostersRef.current[0];
    const currentStudents = currentRoster?.students || [];

    if (currentStudents.length === 0) {
      setBannerMessage(
        'DANH SÁCH HỌC SINH ĐANG TRỐNG! VUI LÒNG NHẬP HỌC SINH TRƯỚC KHI BẮT ĐẦU!'
      );
      setIsStudentManagerOpen(true);
      return;
    }

    if (
      isCycleComplete(currentStudents, settingsRef.current.noRepeatInCycle)
    ) {
      setGameState('completed');
      setBannerMessage(VIETNAMESE_STAGE_MESSAGES.completed[0]);
      audioManager.playCycleCompletedCelebration(settingsRef.current);
      return;
    }

    const runId = timerControllerRef.current.startNewRun();
    turnMissCountRef.current = 0;
    setConsecutiveMisses(0);
    setSelectedStudent(null);
    setHoveredStudent(null);
    setActiveSurpriseEvent(null);

    // Stage A: UFO Xuất hiện
    setGameState('entering');
    setBannerMessage('CẢNH BÁO! UFO ĐANG TIẾP CẬN! UFO MAY MẮN ĐÃ ĐẾN!');
    audioManager.playUfoEnter(settingsRef.current);
    audioManager.speakVietnamese(
      'Xin chào các bạn! UFO đã đến! Đang quét tìm học sinh may mắn!',
      settingsRef.current
    );

    const enterDurationMs = getSpeedAdjustedMs(1150);
    timerControllerRef.current.schedule(
      runId,
      () => {
        runScanAndAttemptCycle(runId);
      },
      enterDurationMs
    );
  }, [runScanAndAttemptCycle]);

  /**
   * Pause or Resume handler
   */
  const handlePauseOrResume = useCallback(() => {
    audioManager.unlockAudioByUserGesture();
    if (
      gameState === 'entering' ||
      gameState === 'scanning' ||
      gameState === 'locking' ||
      gameState === 'missing' ||
      gameState === 'falseSignal' ||
      gameState === 'catching'
    ) {
      pausedFromStateRef.current = gameState;
      timerControllerRef.current.invalidateRun();
      audioManager.stopAllAudio();
      setGameState('paused');
      setBannerMessage(VIETNAMESE_STAGE_MESSAGES.paused[0]);
    } else if (gameState === 'paused' || gameState === 'stopped') {
      const runId = timerControllerRef.current.startNewRun();
      runScanAndAttemptCycle(runId);
    } else if (gameState === 'revealing') {
      // Clicking TIẾP TỤC after a reveal checks if cycle is complete or starts the next turn
      if (isCycleComplete(students, settings.noRepeatInCycle)) {
        setGameState('completed');
        setBannerMessage(VIETNAMESE_STAGE_MESSAGES.completed[0]);
        audioManager.playCycleCompletedCelebration(settings);
      } else {
        setGameState('ready');
        setSelectedStudent(null);
        setHoveredStudent(null);
        setBannerMessage(VIETNAMESE_STAGE_MESSAGES.ready[0]);
      }
    }
  }, [gameState, runScanAndAttemptCycle, settings, students]);

  /**
   * Replay handler: cleanly cancels any running timers/audio and starts a fresh hunt.
   */
  const handleReplay = useCallback(() => {
    audioManager.unlockAudioByUserGesture();
    timerControllerRef.current.invalidateRun();
    audioManager.stopAllAudio();
    handleStartHunt();
  }, [handleStartHunt]);

  /**
   * Starts a brand new cycle when all students have been called.
   */
  const handleStartNewCycle = useCallback(() => {
    audioManager.unlockAudioByUserGesture();
    timerControllerRef.current.invalidateRun();
    audioManager.stopAllAudio();
    setRosters((prev) =>
      prev.map((r) => {
        if (r.id === activeRosterIdRef.current) {
          const nextRoster: ClassRoster = {
            ...r,
            currentCycle: r.currentCycle + 1,
            students: resetCycleStudents(r.students),
          };
          if (authUserRef.current) {
            saveCloudRoster(authUserRef.current.uid, nextRoster).catch((e) =>
              console.error(e)
            );
          }
          return nextRoster;
        }
        return r;
      })
    );
    setSelectedStudent(null);
    setHoveredStudent(null);
    setConsecutiveMisses(0);
    setGameState('ready');
    setBannerMessage('ĐÃ BẮT ĐẦU CHU KỲ MỚI! NHẤN "BẮT ĐẦU SĂN TÌM" ĐỂ TIẾP TỤC!');
  }, []);

  /**
   * Resets current cycle called status without incrementing cycle number
   */
  const handleResetCurrentCycle = useCallback(() => {
    timerControllerRef.current.invalidateRun();
    audioManager.stopAllAudio();
    setRosters((prev) =>
      prev.map((r) => {
        if (r.id === activeRosterIdRef.current) {
          const nextRoster: ClassRoster = {
            ...r,
            students: resetCycleStudents(r.students),
          };
          if (authUserRef.current) {
            saveCloudRoster(authUserRef.current.uid, nextRoster).catch((e) =>
              console.error(e)
            );
          }
          return nextRoster;
        }
        return r;
      })
    );
    setSelectedStudent(null);
    setHoveredStudent(null);
    setConsecutiveMisses(0);
    setGameState('ready');
    setBannerMessage('ĐÃ ĐẶT LẠI LƯỢT GỌI! TẤT CẢ HỌC SINH ĐỀU CHƯA ĐƯỢC GỌI.');
  }, []);

  /**
   * Fullscreen toggle
   */
  const handleToggleFullscreen = useCallback(() => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
        setSettings((prev) => ({ ...prev, fullscreen: true }));
      } else {
        document.exitFullscreen?.().catch(() => {});
        setSettings((prev) => ({ ...prev, fullscreen: false }));
      }
    } catch {
      setSettings((prev) => ({ ...prev, fullscreen: !prev.fullscreen }));
    }
  }, []);

  // Support ?autostart=1 and keyboard shortcuts (Enter/Space on ready, Escape/P to pause)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      handleStartHunt();
    }
  }, [handleStartHunt]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isStudentManagerOpen || isHistoryOpen || isSettingsOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.code === 'Space' || e.code === 'Enter') && gameState === 'ready') {
        e.preventDefault();
        handleStartHunt();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        if (
          gameState === 'entering' ||
          gameState === 'scanning' ||
          gameState === 'locking' ||
          gameState === 'missing' ||
          gameState === 'falseSignal' ||
          gameState === 'paused'
        ) {
          e.preventDefault();
          handlePauseOrResume();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    gameState,
    handlePauseOrResume,
    handleStartHunt,
    isHistoryOpen,
    isSettingsOpen,
    isStudentManagerOpen,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    const ctrl = timerControllerRef.current;
    return () => {
      ctrl.invalidateRun();
      audioManager.stopAllAudio();
    };
  }, []);

  const isGameActive =
    gameState === 'entering' ||
    gameState === 'scanning' ||
    gameState === 'locking' ||
    gameState === 'missing' ||
    gameState === 'falseSignal' ||
    gameState === 'catching';

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#070B19] select-none">
      {/* 3D Cosmic UFO & Chibi Classroom Stage */}
      <GameScene
        gameState={gameState}
        students={students}
        hoveredStudent={hoveredStudent}
        selectedStudent={selectedStudent}
        scanPattern={scanPattern}
        activeSurpriseEvent={activeSurpriseEvent}
        settings={settings}
      />

      {/* Main Stage HUD & 9 Interactive Game Controls */}
      <GameControls
        gameState={gameState}
        bannerMessage={bannerMessage}
        classNameTitle={activeRoster.name}
        totalStudents={students.length}
        calledStudentsCount={calledCount}
        uncalledStudentsCount={uncalledCount}
        currentCycle={activeRoster.currentCycle}
        consecutiveMisses={consecutiveMisses}
        settings={settings}
        teacherUser={teacherProfile}
        isAuthLoading={isAuthLoading}
        isSyncingCloud={isSyncingCloud}
        onGoogleLogin={handleGoogleLogin}
        onGoogleLogout={handleGoogleLogout}
        onStartHunt={handleStartHunt}
        onStopGame={handleStopGame}
        onPauseOrResume={handlePauseOrResume}
        onReplay={handleReplay}
        onOpenStudentManager={() => setIsStudentManagerOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleSound={() => {
          audioManager.unlockAudioByUserGesture();
          const nextSound = !settings.soundEnabled;
          if (!nextSound) audioManager.stopAllAudio();
          const nextSettings = { ...settings, soundEnabled: nextSound };
          setSettings(nextSettings);
          if (authUser) {
            saveCloudWorkspacePreferences(
              authUser,
              activeRoster.id,
              nextSettings
            ).catch((e) => console.error(e));
          }
        }}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Grand Reveal Overlay & Cycle Completed Modal */}
      <ResultOverlay
        gameState={gameState}
        selectedStudent={selectedStudent}
        currentCycle={activeRoster.currentCycle}
        totalStudents={students.length}
        uncalledCount={uncalledCount}
        onContinueNextTurn={handlePauseOrResume}
        onReplayTurn={handleReplay}
        onStartNewCycle={handleStartNewCycle}
        onSpeakAgain={() => {
          if (selectedStudent) {
            audioManager.unlockAudioByUserGesture();
            audioManager.speakVietnamese(
              `Chúc mừng em, ${selectedStudent.name} đã được UFO lựa chọn!`,
              settings
            );
          }
        }}
      />

      {/* Student Roster Manager Modal */}
      <StudentManager
        isOpen={isStudentManagerOpen}
        isGameActive={isGameActive}
        rosters={rosters}
        activeRosterId={activeRoster.id}
        onClose={() => setIsStudentManagerOpen(false)}
        onSelectRoster={(rosterId) => {
          handleStopGame();
          setActiveRosterId(rosterId);
          setGameState('ready');
          setBannerMessage(VIETNAMESE_STAGE_MESSAGES.ready[0]);
          if (authUser) {
            saveCloudWorkspacePreferences(authUser, rosterId, settings).catch(
              (e) => console.error(e)
            );
          }
        }}
        onCreateRoster={(name) => {
          const newRoster: ClassRoster = {
            id: `class_${Date.now()}`,
            name,
            students: [],
            currentCycle: 1,
            createdAt: new Date().toISOString(),
          };
          setRosters((prev) => [...prev, newRoster]);
          setActiveRosterId(newRoster.id);
          if (authUser) {
            setIsSyncingCloud(true);
            Promise.all([
              saveCloudRoster(authUser.uid, newRoster, true),
              saveCloudWorkspacePreferences(authUser, newRoster.id, settings),
            ])
              .catch((e) => console.error(e))
              .finally(() => setIsSyncingCloud(false));
          }
        }}
        onRenameRoster={(rosterId, newName) => {
          setRosters((prev) =>
            prev.map((r) => {
              if (r.id === rosterId) {
                const updated = { ...r, name: newName };
                if (authUser) {
                  saveCloudRoster(authUser.uid, updated).catch((e) =>
                    console.error(e)
                  );
                }
                return updated;
              }
              return r;
            })
          );
        }}
        onDeleteRoster={(rosterId) => {
          const remaining = rosters.filter((r) => r.id !== rosterId);
          if (remaining.length > 0) {
            setRosters(remaining);
            setActiveRosterId(remaining[0].id);
            if (authUser) {
              setIsSyncingCloud(true);
              Promise.all([
                deleteCloudRoster(authUser.uid, rosterId),
                saveCloudWorkspacePreferences(
                  authUser,
                  remaining[0].id,
                  settings
                ),
              ])
                .catch((e) => console.error(e))
                .finally(() => setIsSyncingCloud(false));
            }
          }
        }}
        onUpdateStudents={(nextStudents) => {
          if (isGameActive) {
            handleStopGame();
          }
          const updatedRoster: ClassRoster = {
            ...activeRoster,
            students: nextStudents,
          };
          setRosters((prev) =>
            prev.map((r) => (r.id === activeRoster.id ? updatedRoster : r))
          );
          if (authUser) {
            setIsSyncingCloud(true);
            saveCloudRoster(authUser.uid, updatedRoster)
              .catch((e) => console.error(e))
              .finally(() => setIsSyncingCloud(false));
          }
          if (nextStudents.length === 0) {
            setGameState('ready');
            setBannerMessage(
              'DANH SÁCH HỌC SINH ĐANG TRỐNG! VUI LÒNG NHẬP HỌC SINH TRƯỚC KHI BẮT ĐẦU!'
            );
          } else {
            setGameState('ready');
            setBannerMessage(VIETNAMESE_STAGE_MESSAGES.ready[0]);
          }
        }}
        onResetCalledStatus={handleResetCurrentCycle}
      />

      {/* Call History Modal */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        history={history}
        currentCycle={activeRoster.currentCycle}
        onClose={() => setIsHistoryOpen(false)}
        onClearHistory={() => {
          setHistory([]);
          if (authUser) {
            clearCloudCallHistory(authUser.uid).catch((e) => console.error(e));
          }
        }}
        onResetCurrentCycle={handleResetCurrentCycle}
        onStartNewCycleKeepHistory={handleStartNewCycle}
      />

      {/* Game Settings Modal */}
      <GameSettings
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={(next) => {
          setSettings(next);
          if (authUser) {
            saveCloudWorkspacePreferences(
              authUser,
              activeRoster.id,
              next
            ).catch((e) => console.error(e));
          }
        }}
        onToggleFullscreen={handleToggleFullscreen}
      />
    </main>
  );
}
