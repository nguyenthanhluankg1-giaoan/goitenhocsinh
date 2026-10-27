import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

describe('Firestore Security Rules Static & Invariant Verification', () => {
  const rules = fs.readFileSync('./firestore.rules', 'utf8');

  it('Enforces rules_version = 2 and global default-deny safety net', () => {
    assert.match(rules, /rules_version\s*=\s*'2';/);
    assert.match(rules, /match\s+\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;\s*\}/);
  });

  it('Rejects unverified emails and enforces strict ID regex validation', () => {
    assert.match(rules, /request\.auth\.token\.email_verified\s*==\s*true/);
    assert.match(rules, /id\.matches\('\^\[a-zA-Z0-9_\\\\-\]\+\$'\)/);
  });

  it('Protects all 3 collections (/users, /rosters, /callHistory) with validation helpers and server timestamps', () => {
    assert.match(rules, /function\s+isValidWorkspace\(data\)/);
    assert.match(rules, /function\s+isValidRoster\(data\)/);
    assert.match(rules, /function\s+isValidCallHistory\(data\)/);
    assert.match(rules, /incoming\(\)\.createdAt\s*==\s*request\.time/);
    assert.match(rules, /incoming\(\)\.updatedAt\s*==\s*request\.time/);
  });

  it('Blocks all updates to immutable CallHistory audit logs', () => {
    assert.match(rules, /allow\s+update:\s*if\s+false;/);
  });
});
