const { test } = require('node:test');
const assert = require('node:assert/strict');
const ToenowSecurity = require('../shared/toenow-security.js');
const ToenowPlatform = require('../shared/toenow-platform.js');

test('Anti-Cheat: 100,000+ points on Number Pop is VALID when duration & wave are proportional', () => {
  // Scenario: Skilled player survives 300 seconds (5 min) reaching Wave 22 and scores 125,000 pts
  const validMasterRun = {
    gameId: 'number-pop',
    score: 125000,
    wave: 22,
    durationSec: 300 // 416 pts/sec <= maxPtsPerSec 850
  };

  const result = ToenowSecurity.verifyScorePlausibility(validMasterRun);
  assert.equal(result.isValid, true, 'Legitimate master run of 125,000 pts must be valid and not falsely flagged');
  assert.equal(result.details.score, 125000);
});

test('Anti-Cheat: Instant score injection is FLAGGED and BLOCKED', () => {
  // Scenario: Hacker fires 100,000 pts in 5 seconds on Wave 2 (20,000 pts/sec)
  const cheatedRun = {
    gameId: 'number-pop',
    score: 100000,
    wave: 2,
    durationSec: 5
  };

  const result = ToenowSecurity.verifyScorePlausibility(cheatedRun);
  assert.equal(result.isValid, false, 'Instant hack must be detected as invalid');
  assert.equal(result.reason, 'EXCESSIVE_SCORE_RATE');
});

test('Anti-Cheat: Score exceeding maximum wave physics is FLAGGED', () => {
  // Scenario: 50,000 pts on Wave 1 (only 5 numbers exist in wave 1)
  const waveHack = {
    gameId: 'number-pop',
    score: 50000,
    wave: 1,
    durationSec: 80
  };

  const result = ToenowSecurity.verifyScorePlausibility(waveHack);
  assert.equal(result.isValid, false, 'Score beyond wave capacity must be rejected');
  assert.equal(result.reason, 'SCORE_EXCEEDS_WAVE_CAPACITY');
});

test('Ad Anti-Skip: Authentic ad viewing successfully verifies proof token', () => {
  const session = ToenowSecurity.createAdSession({ type: 'rewarded', minDurationMs: 3000 });
  const proof = ToenowSecurity.signAdCompletion(session);
  const now = session.startTime + 3500; // Watched for 3.5s >= 3.0s

  const verified = ToenowSecurity.verifyAdCompletion(session, proof, now);
  assert.equal(verified.isValid, true, 'Properly viewed ad with valid signature must succeed');
});

test('Ad Anti-Skip: Fast-forward / Instant skip exploit is REJECTED', () => {
  const session = ToenowSecurity.createAdSession({ type: 'rewarded', minDurationMs: 4000 });
  const proof = ToenowSecurity.signAdCompletion(session);
  const now = session.startTime + 500; // Only elapsed 0.5s < 4.0s

  const verified = ToenowSecurity.verifyAdCompletion(session, proof, now);
  assert.equal(verified.isValid, false, 'Premature skip must be caught');
  assert.equal(verified.reason, 'INSUFFICIENT_AD_DURATION');
});

test('Ad Anti-Skip: Forged or tampered token is REJECTED', () => {
  const session = ToenowSecurity.createAdSession({ type: 'rewarded', minDurationMs: 2000 });
  const fakeProof = 'hacker_forged_proof_token';
  const now = session.startTime + 2500;

  const verified = ToenowSecurity.verifyAdCompletion(session, fakeProof, now);
  assert.equal(verified.isValid, false, 'Forged token must be rejected');
  assert.equal(verified.reason, 'TAMPERED_AD_TOKEN');
});

test('ToenowPlatform: Instantiates and exposes standard ad hooks', () => {
  const platform = new ToenowPlatform({ env: 'hub' });
  assert.equal(platform.env, 'hub');
  assert.equal(typeof platform.showRewardedAd, 'function');
  assert.equal(typeof platform.showInterstitialAd, 'function');
});
