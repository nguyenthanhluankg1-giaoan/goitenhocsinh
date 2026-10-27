# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Zero-Trust Default Deny**: Every path not explicitly matched is denied (`allow read, write: if false;`).
2. **Verified Teacher Identity**: All write operations (`create`, `update`, `delete`) require an authenticated Google user with a verified email (`request.auth != null && request.auth.token.email_verified == true`).
3. **Strict Ownership Isolation**:
   - A `TeacherWorkspace` at `/users/{userId}` can only be read, created, or updated by the user whose `request.auth.uid == userId` and `ownerId == request.auth.uid`.
   - A `ClassRosterDoc` at `/rosters/{rosterId}` can only be read, listed, created, updated, or deleted when `ownerId == request.auth.uid`, and on creation requires `exists(/databases/$(database)/documents/users/$(request.auth.uid))`.
   - A `CallHistoryDoc` at `/callHistory/{historyId}` is an immutable audit record (`allow update: if false;`) that can only be created when `ownerId == request.auth.uid`, the referenced `/rosters/$(incoming().rosterId)` exists, and its `ownerId == request.auth.uid`.
4. **Bounded Volumetric Constraints & Type Safety**:
   - All document IDs (`userId`, `rosterId`, `historyId`) must match `^[a-zA-Z0-9_\-]+$` with length `1..128`.
   - `studentNames` and `calledStudentNames` arrays in `/rosters/{rosterId}` are strictly bounded to `<= 100` items, and if non-empty, the first item is verified as a bounded string (`1..100` chars).
   - All timestamps (`createdAt`, `updatedAt`) must equal server timestamp `request.time`, and `createdAt` + `ownerId` are immutable on update.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on Workspace Create)**: Authenticated user `uid_A` attempts to create `/users/uid_A` with `ownerId: "uid_B"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Cross-Tenant Workspace Read)**: Authenticated user `uid_A` attempts `get` on `/users/uid_B`. -> `PERMISSION_DENIED`
3. **Payload 3 (Unverified Email Write)**: User with `email_verified: false` attempts to create `/users/uid_A`. -> `PERMISSION_DENIED`
4. **Payload 4 (Shadow/Ghost Field Injection on Update)**: Owner updates `/users/uid_A` with extra field `isAdmin: true`. -> `PERMISSION_DENIED`
5. **Payload 5 (Timestamp Forgery on Create)**: Owner creates `/rosters/roster_1` with past client timestamp `createdAt != request.time`. -> `PERMISSION_DENIED`
6. **Payload 6 (Immutable Field Mutation on Update)**: Owner updates `/rosters/roster_1` changing `ownerId` or `createdAt`. -> `PERMISSION_DENIED`
7. **Payload 7 (Orphaned Roster Create Without Workspace)**: User attempts to create `/rosters/roster_1` before `/users/{uid}` exists. -> `PERMISSION_DENIED`
8. **Payload 8 (Denial-of-Wallet Oversized Array)**: Owner attempts to create `/rosters/roster_1` with 105 elements in `studentNames`. -> `PERMISSION_DENIED`
9. **Payload 9 (ID Poisoning Attack)**: Owner attempts to create `/rosters/bad$id!@#` with invalid characters. -> `PERMISSION_DENIED`
10. **Payload 10 (Orphaned CallHistory Create)**: Owner creates `/callHistory/hist_1` pointing to non-existent `rosterId: "ghost_roster"`. -> `PERMISSION_DENIED`
11. **Payload 11 (Cross-Tenant CallHistory Reference)**: User `uid_A` creates `/callHistory/hist_1` referencing `rosterId` owned by `uid_B`. -> `PERMISSION_DENIED`
12. **Payload 12 (Audit Log Tampering)**: Owner attempts `update` on `/callHistory/hist_1` to alter `studentName`. -> `PERMISSION_DENIED`
