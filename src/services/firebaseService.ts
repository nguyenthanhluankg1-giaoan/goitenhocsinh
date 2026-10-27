import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ClassRoster,
  GameSettingsConfig,
  HistoryRecord,
  QuizQuestion,
  Student,
} from '../types/game';
import { adjustProbabilitiesTo100 } from '../engine/RandomSelectionEngine';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Mandatory boot connection validation per firebase-integration-rpc skill.
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// ============================================================================
// DEFENSIVE PAYLOAD SANITIZATION (Matching firebase-blueprint.json & rules)
// ============================================================================

export function sanitizeValidId(rawId: string, fallbackPrefix = 'id'): string {
  const cleaned = String(rawId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 128);
  return cleaned.length > 0 ? cleaned : `${fallbackPrefix}_${Date.now()}`;
}

export function sanitizeBoundedText(
  rawText: string,
  maxLength = 100,
  fallback = 'Lớp Học'
): string {
  const trimmed = String(rawText || '').trim().slice(0, maxLength);
  return trimmed.length > 0 ? trimmed : fallback;
}

export function sanitizeStudentArray(names: string[]): string[] {
  return names
    .map((n) => String(n || '').trim().slice(0, 100))
    .filter((n) => n.length >= 1)
    .slice(0, 100);
}

export function clampNumber(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

// ============================================================================
// GOOGLE AUTHENTICATION HELPERS
// ============================================================================

export async function signInWithGoogleAccount(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutGoogleAccount(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthChanges(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

// ============================================================================
// FIRESTORE CLOUD SYNC OPERATIONS
// ============================================================================

function buildRosterDocId(uid: string, localRosterId: string): string {
  const cleanUid = sanitizeValidId(uid, 'u').slice(0, 48);
  const cleanLocal = sanitizeValidId(localRosterId, 'cls').slice(0, 70);
  if (cleanLocal.startsWith(`${cleanUid}_`)) {
    return cleanLocal;
  }
  return `${cleanUid}_${cleanLocal}`;
}

function stripUidPrefix(uid: string, docRosterId: string): string {
  const prefix = `${sanitizeValidId(uid, 'u').slice(0, 48)}_`;
  return docRosterId.startsWith(prefix)
    ? docRosterId.slice(prefix.length)
    : docRosterId;
}

/**
 * Ensures the signed-in teacher's workspace exists in Firestore.
 * If this is their first sign-in, seeds their current local rosters, settings, history, and questions to their Google account.
 */
export async function initializeOrLoadTeacherCloudData(
  user: User,
  localRosters: ClassRoster[],
  localActiveRosterId: string,
  localSettings: GameSettingsConfig,
  localHistory: HistoryRecord[],
  localQuestions: QuizQuestion[]
): Promise<void> {
  const uid = sanitizeValidId(user.uid, 'user');
  const userDocPath = `users/${uid}`;
  const userDocRef = doc(db, 'users', uid);

  let snap;
  try {
    snap = await getDoc(userDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userDocPath);
  }

  if (!snap.exists()) {
    const firstRosterId = sanitizeValidId(
      localActiveRosterId || localRosters[0]?.id || 'class_default_3a',
      'class'
    );
    // 1. Create /users/{uid} workspace document first (required by Pillar 11 before creating /rosters or /questions)
    try {
      await setDoc(userDocRef, {
        ownerId: uid,
        displayName: sanitizeBoundedText(
          user.displayName || user.email || 'Giáo viên',
          100,
          'Giáo viên'
        ),
        activeRosterId: firstRosterId,
        soundEnabled: Boolean(localSettings.soundEnabled),
        soundEffectsVolume: clampNumber(localSettings.sfxVolume, 0, 1),
        voiceReadingEnabled: Boolean(localSettings.voiceEnabled),
        catchProbability: clampNumber(
          localSettings.probabilities?.catch ?? 60,
          0,
          100
        ),
        nearMissProbability: clampNumber(
          localSettings.probabilities?.nearMiss ?? 5,
          0,
          100
        ),
        falseSignalProbability: clampNumber(
          localSettings.probabilities?.falseSignal ?? 10,
          0,
          100
        ),
        animationSpeed: clampNumber(localSettings.animationSpeed, 0.25, 3),
        noRepeatInCycle: Boolean(localSettings.noRepeatInCycle),
        maxConsecutiveMisses: Math.round(
          clampNumber(localSettings.maxConsecutiveMisses, 1, 10)
        ),
        quizEnabled: Boolean(localSettings.quizEnabled),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userDocPath);
    }

    // 2. Seed initial class rosters for this teacher
    for (const roster of localRosters) {
      await saveCloudRoster(user.uid, roster, true);
    }

    // 3. Seed recent call history records (up to 30) that match existing rosters
    const validRosterIds = new Set(localRosters.map((r) => r.id));
    for (const rec of localHistory.slice(0, 30)) {
      const targetRosterId = validRosterIds.has(rec.classId)
        ? rec.classId
        : localRosters[0]?.id;
      if (targetRosterId) {
        await saveCloudCallHistoryRecord(user.uid, targetRosterId, rec);
      }
    }

    // 4. Seed initial quiz questions (up to 40)
    await syncCloudQuizQuestions(user.uid, localQuestions);
  }
}

/**
 * Creates or updates a ClassRoster document in /rosters/{rosterDocId}.
 */
export async function saveCloudRoster(
  uid: string,
  roster: ClassRoster,
  forceCreate = false
): Promise<void> {
  const cleanUid = sanitizeValidId(uid, 'user');
  const rosterDocId = buildRosterDocId(cleanUid, roster.id);
  const path = `rosters/${rosterDocId}`;
  const ref = doc(db, 'rosters', rosterDocId);

  const studentNames = sanitizeStudentArray(
    roster.students.map((s) => s.name)
  );
  const calledStudentNames = sanitizeStudentArray(
    roster.students.filter((s) => s.calledInCycle).map((s) => s.name)
  );
  const safeName = sanitizeBoundedText(roster.name, 100, 'Lớp Học');
  const safeCycle = Math.round(clampNumber(roster.currentCycle || 1, 1, 10000));

  try {
    if (!forceCreate) {
      const existingSnap = await getDoc(ref);
      if (existingSnap.exists()) {
        await updateDoc(ref, {
          name: safeName,
          studentNames,
          calledStudentNames,
          currentCycle: safeCycle,
          updatedAt: serverTimestamp(),
        });
        return;
      }
    }

    await setDoc(ref, {
      ownerId: cleanUid,
      rosterId: rosterDocId,
      name: safeName,
      currentCycle: safeCycle,
      studentNames,
      calledStudentNames,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(
      error,
      forceCreate ? OperationType.CREATE : OperationType.WRITE,
      path
    );
  }
}

export async function deleteCloudRoster(
  uid: string,
  localRosterId: string
): Promise<void> {
  const cleanUid = sanitizeValidId(uid, 'user');
  const rosterDocId = buildRosterDocId(cleanUid, localRosterId);
  const path = `rosters/${rosterDocId}`;
  try {
    await deleteDoc(doc(db, 'rosters', rosterDocId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveCloudWorkspacePreferences(
  user: User,
  activeRosterId: string,
  settings: GameSettingsConfig
): Promise<void> {
  const uid = sanitizeValidId(user.uid, 'user');
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  try {
    await updateDoc(ref, {
      displayName: sanitizeBoundedText(
        user.displayName || user.email || 'Giáo viên',
        100,
        'Giáo viên'
      ),
      activeRosterId: sanitizeValidId(activeRosterId, 'class'),
      soundEnabled: Boolean(settings.soundEnabled),
      soundEffectsVolume: clampNumber(settings.sfxVolume, 0, 1),
      voiceReadingEnabled: Boolean(settings.voiceEnabled),
      catchProbability: clampNumber(settings.probabilities?.catch ?? 60, 0, 100),
      nearMissProbability: clampNumber(
        settings.probabilities?.nearMiss ?? 5,
        0,
        100
      ),
      falseSignalProbability: clampNumber(
        settings.probabilities?.falseSignal ?? 10,
        0,
        100
      ),
      animationSpeed: clampNumber(settings.animationSpeed, 0.25, 3),
      noRepeatInCycle: Boolean(settings.noRepeatInCycle),
      maxConsecutiveMisses: Math.round(
        clampNumber(settings.maxConsecutiveMisses, 1, 10)
      ),
      quizEnabled: Boolean(settings.quizEnabled),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveCloudCallHistoryRecord(
  uid: string,
  localRosterId: string,
  record: HistoryRecord
): Promise<void> {
  const cleanUid = sanitizeValidId(uid, 'user');
  const rosterDocId = buildRosterDocId(cleanUid, localRosterId);
  const historyDocId = sanitizeValidId(`${cleanUid}_${record.id}`, 'hist');
  const path = `callHistory/${historyDocId}`;

  try {
    await setDoc(doc(db, 'callHistory', historyDocId), {
      ownerId: cleanUid,
      historyId: historyDocId,
      rosterId: rosterDocId,
      studentName: sanitizeBoundedText(record.studentName, 100, 'Học sinh'),
      className: sanitizeBoundedText(record.className, 100, 'Lớp học'),
      cycleNumber: Math.round(clampNumber(record.cycle, 1, 10000)),
      orderNumber: Math.round(clampNumber(record.orderNumber, 1, 100000)),
      calledAtIso: sanitizeBoundedText(
        record.timestamp,
        40,
        new Date().toLocaleString('vi-VN')
      ),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function clearCloudCallHistory(uid: string): Promise<void> {
  const cleanUid = sanitizeValidId(uid, 'user');
  const q = query(
    collection(db, 'callHistory'),
    where('ownerId', '==', cleanUid)
  );
  try {
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'callHistory');
  }
}

export async function syncCloudQuizQuestions(
  uid: string,
  questions: QuizQuestion[]
): Promise<void> {
  const cleanUid = sanitizeValidId(uid, 'user');
  const q = query(
    collection(db, 'questions'),
    where('ownerId', '==', cleanUid)
  );
  try {
    const existingSnap = await getDocs(q);
    const nextDocIds = new Set<string>();

    for (const item of questions.slice(0, 50)) {
      const qDocId = buildRosterDocId(cleanUid, item.id);
      nextDocIds.add(qDocId);
      const qRef = doc(db, 'questions', qDocId);
      const safeType =
        item.type === 'open_ended' ? 'open_ended' : 'multiple_choice';
      const safeOptions = (item.options || ['A', 'B', 'C', 'D'])
        .slice(0, 4)
        .map((o, idx) =>
          sanitizeBoundedText(o || `Đáp án ${idx + 1}`, 200, `Đáp án ${idx + 1}`)
        );
      while (safeOptions.length < 4) {
        safeOptions.push(`Đáp án ${safeOptions.length + 1}`);
      }

      const existingDoc = existingSnap.docs.find((d) => d.id === qDocId);
      if (existingDoc) {
        await updateDoc(qRef, {
          questionType: safeType,
          questionText: sanitizeBoundedText(item.question, 500, 'Câu hỏi'),
          options: safeOptions,
          correctIndex: Math.round(clampNumber(item.correctIndex, 0, 3)),
          answerText: sanitizeBoundedText(
            item.answerText || 'Đáp án đúng',
            500,
            'Đáp án đúng'
          ),
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(qRef, {
          ownerId: cleanUid,
          questionId: qDocId,
          questionType: safeType,
          questionText: sanitizeBoundedText(item.question, 500, 'Câu hỏi'),
          options: safeOptions,
          correctIndex: Math.round(clampNumber(item.correctIndex, 0, 3)),
          answerText: sanitizeBoundedText(
            item.answerText || 'Đáp án đúng',
            500,
            'Đáp án đúng'
          ),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    for (const oldDoc of existingSnap.docs) {
      if (!nextDocIds.has(oldDoc.id)) {
        await deleteDoc(oldDoc.ref);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'questions');
  }
}

/**
 * Subscribes to the authenticated teacher's workspace, rosters, call history, and quiz questions in real time.
 */
export function subscribeToTeacherCloudData(
  user: User,
  callbacks: {
    onWorkspaceLoaded: (
      activeRosterId: string,
      settings: Partial<GameSettingsConfig>
    ) => void;
    onRostersLoaded: (rosters: ClassRoster[]) => void;
    onHistoryLoaded: (history: HistoryRecord[]) => void;
    onQuestionsLoaded?: (questions: QuizQuestion[]) => void;
  }
): () => void {
  const cleanUid = sanitizeValidId(user.uid, 'user');

  // 1. Subscribe to /users/{uid}
  const unsubWorkspace = onSnapshot(
    doc(db, 'users', cleanUid),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const catchP = Number(data.catchProbability ?? 60);
      const nearMissP = Number(data.nearMissProbability ?? 5);
      const falseSignalP = Number(data.falseSignalProbability ?? 10);
      const missP = Math.max(0, 100 - catchP - nearMissP - falseSignalP);

      callbacks.onWorkspaceLoaded(String(data.activeRosterId || ''), {
        soundEnabled: Boolean(data.soundEnabled),
        sfxVolume: Number(data.soundEffectsVolume ?? 0.8),
        voiceEnabled: Boolean(data.voiceReadingEnabled),
        animationSpeed: Number(data.animationSpeed ?? 1),
        noRepeatInCycle: Boolean(data.noRepeatInCycle),
        maxConsecutiveMisses: Number(data.maxConsecutiveMisses ?? 4),
        quizEnabled: Boolean(data.quizEnabled),
        probabilities: adjustProbabilitiesTo100({
          catch: catchP,
          miss: missP,
          falseSignal: falseSignalP,
          nearMiss: nearMissP,
        }),
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${cleanUid}`);
    }
  );

  // 2. Subscribe to /rosters where ownerId == uid
  const rostersQuery = query(
    collection(db, 'rosters'),
    where('ownerId', '==', cleanUid)
  );
  const unsubRosters = onSnapshot(
    rostersQuery,
    (snap) => {
      if (snap.empty) return;
      const loadedRosters: ClassRoster[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        const rawRosterId = stripUidPrefix(
          cleanUid,
          String(d.rosterId || docSnap.id)
        );
        const names: string[] = Array.isArray(d.studentNames)
          ? d.studentNames.map(String)
          : [];
        const calledSet = new Set<string>(
          Array.isArray(d.calledStudentNames)
            ? d.calledStudentNames.map(String)
            : []
        );
        const students: Student[] = names.map((name, idx) => ({
          id: `stu_${rawRosterId}_${idx}`,
          name,
          calledInCycle: calledSet.has(name),
          calledCount: calledSet.has(name) ? 1 : 0,
          avatarIndex: idx % 8,
        }));
        return {
          id: rawRosterId,
          name: String(d.name || 'Lớp Học'),
          currentCycle: Number(d.currentCycle || 1),
          students,
          createdAt: new Date().toISOString(),
        };
      });
      callbacks.onRostersLoaded(loadedRosters);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rosters');
    }
  );

  // 3. Subscribe to /callHistory where ownerId == uid
  const historyQuery = query(
    collection(db, 'callHistory'),
    where('ownerId', '==', cleanUid)
  );
  const unsubHistory = onSnapshot(
    historyQuery,
    (snap) => {
      const loadedHistory: HistoryRecord[] = snap.docs
        .map((docSnap) => {
          const d = docSnap.data();
          const rawRosterId = stripUidPrefix(
            cleanUid,
            String(d.rosterId || 'class_default_3a')
          );
          return {
            id: stripUidPrefix(cleanUid, String(d.historyId || docSnap.id)),
            orderNumber: Number(d.orderNumber || 1),
            studentId: String(d.historyId || docSnap.id),
            studentName: String(d.studentName || ''),
            classId: rawRosterId,
            className: String(d.className || ''),
            timestamp: String(
              d.calledAtIso || new Date().toLocaleString('vi-VN')
            ),
            missesBeforeCatch: 0,
            cycle: Number(d.cycleNumber || 1),
            calledStatus: 'Đã gọi' as const,
          };
        })
        .sort((a, b) => b.orderNumber - a.orderNumber);
      callbacks.onHistoryLoaded(loadedHistory);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'callHistory');
    }
  );

  // 4. Subscribe to /questions where ownerId == uid
  const questionsQuery = query(
    collection(db, 'questions'),
    where('ownerId', '==', cleanUid)
  );
  const unsubQuestions = onSnapshot(
    questionsQuery,
    (snap) => {
      if (snap.empty || !callbacks.onQuestionsLoaded) return;
      const loadedQuestions: QuizQuestion[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        const opts = Array.isArray(d.options) ? d.options.map(String) : [];
        return {
          id: stripUidPrefix(cleanUid, String(d.questionId || docSnap.id)),
          type:
            d.questionType === 'open_ended' ? 'open_ended' : 'multiple_choice',
          question: String(d.questionText || ''),
          options: [
            opts[0] || 'A',
            opts[1] || 'B',
            opts[2] || 'C',
            opts[3] || 'D',
          ],
          correctIndex: Number(d.correctIndex ?? 0),
          answerText: String(d.answerText || ''),
          usedInSession: false,
        };
      });
      callbacks.onQuestionsLoaded(loadedQuestions);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, 'questions');
    }
  );

  return () => {
    unsubWorkspace();
    unsubRosters();
    unsubHistory();
    unsubQuestions();
  };
}
