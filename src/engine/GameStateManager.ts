import { GameState } from '../types/game';

export const VIETNAMESE_STAGE_MESSAGES: Record<GameState, string[]> = {
  ready: [
    'SẴN SÀNG! NHẤN "BẮT ĐẦU SĂN TÌM" ĐỂ UFO XUẤT HIỆN!',
    'UFO MAY MẮN ĐANG CHỜ LỆNH KHỞI HÀNH!',
  ],
  entering: [
    'CẢNH BÁO! UFO ĐANG TIẾP CẬN!',
    'UFO MAY MẮN ĐÃ ĐẾN!',
  ],
  scanning: [
    'HỆ THỐNG ĐANG QUÉT TÌM HỌC SINH…',
    'UFO ĐANG THĂM DÒ CÁC BÀN HỌC… AI SẼ ĐƯỢC CHỌN ĐÂY?',
    'TÍN HIỆU RADAR ĐANG QUÉT KHẮP LỚP HỌC…',
  ],
  locking: [
    'ĐANG KHÓA MỤC TIÊU! CHUẨN BỊ BẮT… 3… 2… 1…',
    'TÍN HIỆU ĐÃ XUẤT HIỆN! ĐANG KHÓA MỤC TIÊU…',
  ],
  missing: [
    'ÔI! UFO BẮT HỤT RỒI!',
    'ÔI! HỤT MẤT RỒI! BẠN ẤY NÉ NHANH QUÁ!',
    'BẤT NGỜ CHƯA! UFO ĐỔI HƯỚNG VÀ TIẾP TỤC SĂN TÌM!',
  ],
  falseSignal: [
    'Ơ! TÍN HIỆU GIẢ RỒI! ĐÁM KHÓI SAO ĐÁNH LỪA UFO!',
    'BẤT NGỜ CHƯA! UFO PHÁT HIỆN TÍN HIỆU ẢO, ĐANG ĐỔI HƯỚNG!',
  ],
  catching: [
    'BÍ MẬT SẮP ĐƯỢC TIẾT LỘ! TIA NĂNG LƯỢNG ĐANG NÂNG HỌC SINH LÊN!',
    'ĐÃ BẮT TRÚNG MỤC TIÊU MAY MẮN!',
  ],
  revealing: [
    'CHÚC MỪNG! BẠN ĐÃ ĐƯỢC UFO LỰA CHỌN!',
  ],
  paused: [
    'TRÒ CHƠI ĐANG TẠM DỪNG – NHẤN "TIẾP TỤC" ĐỂ BAY TIẾP!',
  ],
  stopped: [
    'ĐÃ DỪNG TRÒ CHƠI AN TOÀN – NHẤN "TIẾP TỤC" HOẶC "BẮT ĐẦU SĂN TÌM"!',
  ],
  completed: [
    'TẤT CẢ HỌC SINH ĐÃ ĐƯỢC UFO GỌI TÊN!',
  ],
};

export interface StateTransitionValidation {
  allowed: boolean;
  nextState: GameState;
}

const VALID_TRANSITIONS: Record<GameState, GameState[]> = {
  ready: ['entering', 'completed', 'stopped'],
  entering: ['scanning', 'paused', 'stopped', 'ready'],
  scanning: ['locking', 'paused', 'stopped', 'ready'],
  locking: ['catching', 'missing', 'falseSignal', 'paused', 'stopped', 'ready'],
  missing: ['scanning', 'locking', 'paused', 'stopped', 'ready'],
  falseSignal: ['scanning', 'locking', 'paused', 'stopped', 'ready'],
  catching: ['revealing', 'paused', 'stopped', 'ready'],
  revealing: ['ready', 'entering', 'completed', 'stopped'],
  paused: ['entering', 'scanning', 'locking', 'missing', 'falseSignal', 'catching', 'stopped', 'ready'],
  stopped: ['ready', 'entering', 'scanning'],
  completed: ['ready', 'entering'],
};

/**
 * Validates whether a transition from currentState to targetState is valid.
 */
export function canTransitionState(
  currentState: GameState,
  targetState: GameState
): boolean {
  if (currentState === targetState) return true;
  return VALID_TRANSITIONS[currentState]?.includes(targetState) ?? false;
}

/**
 * Maps internal detailed GameState to document.body.dataset.state for automated testing and accessibility.
 */
export function mapToBodyDatasetState(
  state: GameState
): 'ready' | 'playing' | 'paused' | 'revealing' | 'completed' | 'stopped' {
  switch (state) {
    case 'ready':
      return 'ready';
    case 'paused':
      return 'paused';
    case 'stopped':
      return 'stopped';
    case 'revealing':
      return 'revealing';
    case 'completed':
      return 'completed';
    case 'entering':
    case 'scanning':
    case 'locking':
    case 'missing':
    case 'falseSignal':
    case 'catching':
      return 'playing';
  }
}

/**
 * Controller for managing all active timers in a hunt sequence so that
 * STOP, PAUSE, and REPLAY immediately clear all scheduled callbacks without race conditions.
 */
export class SequenceTimerController {
  private timerIds: Set<ReturnType<typeof setTimeout>> = new Set();
  private currentRunId = 0;

  public startNewRun(): number {
    this.clearAll();
    this.currentRunId += 1;
    return this.currentRunId;
  }

  public getRunId(): number {
    return this.currentRunId;
  }

  public schedule(
    runId: number,
    callback: () => void,
    delayMs: number
  ): ReturnType<typeof setTimeout> | null {
    if (runId !== this.currentRunId) return null;
    const id = setTimeout(() => {
      this.timerIds.delete(id);
      if (runId === this.currentRunId) {
        callback();
      }
    }, Math.max(0, delayMs));
    this.timerIds.add(id);
    return id;
  }

  public clearAll(): void {
    this.timerIds.forEach((id) => clearTimeout(id));
    this.timerIds.clear();
  }

  public invalidateRun(): void {
    this.currentRunId += 1;
    this.clearAll();
  }

  public getActiveTimerCount(): number {
    return this.timerIds.size;
  }
}
