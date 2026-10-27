import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adjustProbabilitiesTo100,
  analyzeStudentDuplicates,
  createStudent,
  DEFAULT_PROBABILITIES,
  DEFAULT_QUIZ_QUESTIONS,
  exportHistoryToCsv,
  exportStudentsToCsv,
  getEligibleStudents,
  getQuizEvaluationSpeech,
  isCycleComplete,
  markStudentAsCalled,
  parseBulkQuestionsInput,
  parseRawStudentInput,
  pickRandomQuizQuestion,
  QUIZ_CORRECT_SPEECH,
  QUIZ_INCORRECT_SPEECH,
  resetCycleStudents,
  rollUfoOutcomeEvent,
  selectRandomStudentFairly,
} from './RandomSelectionEngine';
import {
  canTransitionState,
  SequenceTimerController,
} from './GameStateManager';

test('Case 1: Empty student list returns null and cannot start', () => {
  const selected = selectRandomStudentFairly([], true);
  assert.equal(selected, null);
  assert.equal(getEligibleStudents([], true).length, 0);
  assert.equal(isCycleComplete([], true), false);
});

test('Case 2: Single student list selects that student and completes cycle', () => {
  const students = [createStudent('Nguyễn Minh Anh', 0)];
  const selected = selectRandomStudentFairly(students, true);
  assert.ok(selected);
  assert.equal(selected.name, 'Nguyễn Minh Anh');

  const updated = markStudentAsCalled(students, selected.id);
  assert.equal(isCycleComplete(updated, true), true);
  assert.equal(selectRandomStudentFairly(updated, true), null);
});

test('Case 3, 6 & 7: 45 students called continuously without any repeat until cycle completes', () => {
  let students = Array.from({ length: 45 }, (_, i) =>
    createStudent(`Học Sinh Số ${i + 1}`, i)
  );
  const calledIds = new Set<string>();

  for (let turn = 0; turn < 45; turn++) {
    assert.equal(isCycleComplete(students, true), false);
    const chosen = selectRandomStudentFairly(students, true);
    assert.ok(chosen, `Turn ${turn} must pick a student`);
    assert.equal(
      calledIds.has(chosen.id),
      false,
      `Student ${chosen.name} must not be picked twice in the same cycle`
    );
    calledIds.add(chosen.id);
    students = markStudentAsCalled(students, chosen.id);
  }

  assert.equal(calledIds.size, 45);
  assert.equal(isCycleComplete(students, true), true);
  assert.equal(selectRandomStudentFairly(students, true), null);

  // Case 17: Reset cycle and start a new cycle
  const resetStudents = resetCycleStudents(students);
  assert.equal(isCycleComplete(resetStudents, true), false);
  assert.equal(getEligibleStudents(resetStudents, true).length, 45);
  const nextChosen = selectRandomStudentFairly(resetStudents, true);
  assert.ok(nextChosen);
});

test('Case 4: Preserves Vietnamese diacritics accurately and strips excess whitespace', () => {
  const raw = `
    1\t  Nguyễn   Thị Hoàng   Yến  
    2\tĐặng Quốc   Trường Thịnh
    
    Lê   Bích   Phương  
  `;
  const parsed = parseRawStudentInput(raw);
  assert.deepEqual(parsed, [
    'Nguyễn Thị Hoàng Yến',
    'Đặng Quốc Trường Thịnh',
    'Lê Bích Phương',
  ]);
});

test('Case 5: Detects exact duplicate Vietnamese names accurately', () => {
  const names = [
    'Nguyễn Minh Anh',
    'Trần Gia Huy',
    'nguyễn minh anh',
    'Lê Bảo Ngọc',
    'Trần Gia Huy',
  ];
  const check = analyzeStudentDuplicates(names);
  assert.equal(check.hasDuplicates, true);
  assert.equal(check.cleanNames.length, 5);
  assert.equal(check.uniqueNames.length, 3);
  assert.equal(check.duplicates.length, 2);
});

test('Case 8 & 9: Consecutive misses and forced catch upon reaching maxConsecutiveMisses', () => {
  // RNG returning 0.80 -> with default 60% catch, 25% miss, 80 falls into 'miss' (60..85)
  const missRng = () => 0.8;
  assert.equal(rollUfoOutcomeEvent(DEFAULT_PROBABILITIES, 0, 4, missRng), 'miss');
  assert.equal(rollUfoOutcomeEvent(DEFAULT_PROBABILITIES, 3, 4, missRng), 'miss');
  // At 4 consecutive misses, must force 'catch' regardless of RNG
  assert.equal(rollUfoOutcomeEvent(DEFAULT_PROBABILITIES, 4, 4, missRng), 'catch');
  assert.equal(rollUfoOutcomeEvent(DEFAULT_PROBABILITIES, 5, 4, missRng), 'catch');
});

test('Probabilities always normalize to 100% when adjusted', () => {
  const adjusted = adjustProbabilitiesTo100(DEFAULT_PROBABILITIES, 'catch', 80);
  const sum =
    adjusted.catch + adjusted.miss + adjusted.falseSignal + adjusted.nearMiss;
  assert.equal(adjusted.catch, 80);
  assert.equal(sum, 100);
});

test('Case 10, 11 & 12: SequenceTimerController cancels all timers on stop or replay', () => {
  const controller = new SequenceTimerController();
  let triggered = false;
  const runId = controller.startNewRun();
  controller.schedule(runId, () => {
    triggered = true;
  }, 500);
  assert.equal(controller.getActiveTimerCount(), 1);

  // Simulate STOP or REPLAY
  controller.invalidateRun();
  assert.equal(controller.getActiveTimerCount(), 0);
  assert.equal(triggered, false);
  assert.equal(canTransitionState('scanning', 'stopped'), true);
  assert.equal(canTransitionState('catching', 'stopped'), true);
});

test('CSV export formats student list and history with UTF-8 BOM', () => {
  const s = [createStudent('Nguyễn Minh Anh', 0)];
  const csv = exportStudentsToCsv(s);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"Nguyễn Minh Anh"'));

  const histCsv = exportHistoryToCsv([
    {
      id: 'h1',
      orderNumber: 1,
      studentId: s[0].id,
      studentName: 'Nguyễn Minh Anh',
      classId: 'c1',
      className: 'Lớp 3A',
      timestamp: '10:00:00 26/10/2026',
      missesBeforeCatch: 2,
      cycle: 1,
      calledStatus: 'Đã gọi',
    },
  ]);
  assert.ok(histCsv.includes('"Nguyễn Minh Anh"'));
  assert.ok(histCsv.includes('"Lớp 3A"'));
});

test('Question Bank: pickRandomQuizQuestion, parseBulkQuestionsInput, and getQuizEvaluationSpeech', () => {
  assert.equal(pickRandomQuizQuestion([]), null);
  const picked = pickRandomQuizQuestion(DEFAULT_QUIZ_QUESTIONS, DEFAULT_QUIZ_QUESTIONS[0].id);
  assert.ok(picked);
  assert.notEqual(picked.id, DEFAULT_QUIZ_QUESTIONS[0].id);

  const bulkRaw = `
    Thủ đô của Việt Nam là gì? | Hà Nội | Huế | Đà Nẵng | Cần Thơ | A
    Em hãy nêu một hành động bảo vệ môi trường? | Giữ vệ sinh lớp học, bỏ rác đúng nơi quy định
  `;
  const parsed = parseBulkQuestionsInput(bulkRaw);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].type, 'multiple_choice');
  assert.equal(parsed[0].correctIndex, 0);
  assert.equal(parsed[1].type, 'open_ended');
  assert.equal(parsed[1].answerText, 'Giữ vệ sinh lớp học, bỏ rác đúng nơi quy định');

  assert.equal(getQuizEvaluationSpeech(true), 'Câu trả lời của em thật chính xác');
  assert.equal(getQuizEvaluationSpeech(false), 'Câu trả lời của em chưa chính xác');
  assert.equal(QUIZ_CORRECT_SPEECH, 'Câu trả lời của em thật chính xác');
  assert.equal(QUIZ_INCORRECT_SPEECH, 'Câu trả lời của em chưa chính xác');
});

