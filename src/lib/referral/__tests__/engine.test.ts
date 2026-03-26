import { describe, it, expect } from 'vitest';
import {
  generateReferralCode,
  isValidReferralCode,
  checkActiveReferralLimit,
  checkDuplicateReferee,
  checkSelfReferral,
  createReferral,
  advanceReferral,
  isReferralExpired,
  shouldIssueReferrerReward,
  shouldIssueRefereeReward,
  markReferrerRewardIssued,
  markRefereeRewardIssued,
  lookupByCode,
  getAttributionExpiry,
  calculateReferralStats,
  getTopReferrers,
  calculateReferralRevenue,
  generateShareContent,
  getReferralStatusLabel,
  getReferralStatusColor,
  getActiveReferralCodes,
  REFERRER_REWARD,
  REFEREE_REWARD,
  REFERRAL_EXPIRY_DAYS,
  MAX_ACTIVE_REFERRALS,
  type Referral,
  type ReferralStatus,
} from '../engine';

// ── Code Generation ──────────────────────────────────────────────────────

describe('generateReferralCode', () => {
  it('generates codes in RANI-XXXX format', () => {
    const code = generateReferralCode();
    expect(code).toMatch(/^RANI-[A-HJ-NP-Z2-9]{4}$/);
  });

  it('generates unique codes', () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateReferralCode()));
    expect(codes.size).toBe(50);
  });

  it('excludes ambiguous characters (I, O, 0, 1)', () => {
    const codes = Array.from({ length: 100 }, () => generateReferralCode());
    for (const code of codes) {
      const suffix = code.slice(5);
      expect(suffix).not.toMatch(/[IO01]/);
    }
  });
});

describe('isValidReferralCode', () => {
  it('accepts valid codes', () => {
    expect(isValidReferralCode('RANI-ABCD')).toBe(true);
    expect(isValidReferralCode('RANI-X3Y7')).toBe(true);
  });

  it('rejects codes without RANI prefix', () => {
    expect(isValidReferralCode('CLUB-ABCD')).toBe(false);
  });

  it('rejects codes with wrong length', () => {
    expect(isValidReferralCode('RANI-ABC')).toBe(false);
    expect(isValidReferralCode('RANI-ABCDE')).toBe(false);
  });

  it('rejects ambiguous characters', () => {
    expect(isValidReferralCode('RANI-IO01')).toBe(false);
  });

  it('rejects lowercase', () => {
    expect(isValidReferralCode('RANI-abcd')).toBe(false);
  });
});

// ── Anti-Abuse ───────────────────────────────────────────────────────────

describe('checkActiveReferralLimit', () => {
  it('allows when under limit', () => {
    const referrals = Array.from({ length: 5 }, () => makeRef('sent', 'pat-1'));
    const r = checkActiveReferralLimit(referrals, 'pat-1');
    expect(r.allowed).toBe(true);
    expect(r.activeCount).toBe(5);
  });

  it('blocks at max active referrals (10)', () => {
    const referrals = Array.from({ length: 10 }, () => makeRef('sent', 'pat-1'));
    const r = checkActiveReferralLimit(referrals, 'pat-1');
    expect(r.allowed).toBe(false);
    expect(r.reason).toContain('10');
  });

  it('excludes expired and rewarded from count', () => {
    const referrals = [
      ...Array.from({ length: 5 }, () => makeRef('expired', 'pat-1')),
      ...Array.from({ length: 3 }, () => makeRef('rewarded', 'pat-1')),
      ...Array.from({ length: 2 }, () => makeRef('sent', 'pat-1')),
    ];
    const r = checkActiveReferralLimit(referrals, 'pat-1');
    expect(r.allowed).toBe(true);
    expect(r.activeCount).toBe(2);
  });

  it('counts only referrals for specific referrer', () => {
    const referrals = [
      ...Array.from({ length: 10 }, () => makeRef('sent', 'pat-2')),
      makeRef('sent', 'pat-1'),
    ];
    const r = checkActiveReferralLimit(referrals, 'pat-1');
    expect(r.allowed).toBe(true);
    expect(r.activeCount).toBe(1);
  });
});

describe('checkDuplicateReferee', () => {
  it('detects duplicate referee email', () => {
    const referrals = [{ ...makeRef('booked', 'pat-1'), refereeEmail: 'friend@test.com' }];
    const r = checkDuplicateReferee(referrals, 'friend@test.com');
    expect(r.isDuplicate).toBe(true);
  });

  it('ignores expired referrals', () => {
    const referrals = [{ ...makeRef('expired', 'pat-1'), refereeEmail: 'friend@test.com' }];
    const r = checkDuplicateReferee(referrals, 'friend@test.com');
    expect(r.isDuplicate).toBe(false);
  });

  it('case-insensitive email matching', () => {
    const referrals = [{ ...makeRef('sent', 'pat-1'), refereeEmail: 'Friend@Test.COM' }];
    const r = checkDuplicateReferee(referrals, 'friend@test.com');
    expect(r.isDuplicate).toBe(true);
  });
});

describe('checkSelfReferral', () => {
  it('detects self-referral', () => {
    expect(checkSelfReferral('me@test.com', 'me@test.com')).toBe(true);
  });

  it('case-insensitive', () => {
    expect(checkSelfReferral('Me@Test.com', 'me@test.com')).toBe(true);
  });

  it('allows different emails', () => {
    expect(checkSelfReferral('me@test.com', 'friend@test.com')).toBe(false);
  });
});

// ── Create Referral ──────────────────────────────────────────────────────

describe('createReferral', () => {
  it('creates with sent status', () => {
    const ref = createReferral('pat-1', 'Jane Doe');
    expect(ref.status).toBe('sent');
    expect(ref.referrerId).toBe('pat-1');
    expect(ref.referrerName).toBe('Jane Doe');
    expect(ref.referrerRewardIssued).toBe(false);
    expect(ref.refereeRewardIssued).toBe(false);
  });

  it('generates referral code if not provided', () => {
    const ref = createReferral('pat-1', 'Jane Doe');
    expect(ref.referralCode).toMatch(/^RANI-/);
  });

  it('uses provided code', () => {
    const ref = createReferral('pat-1', 'Jane', 'RANI-TEST');
    expect(ref.referralCode).toBe('RANI-TEST');
  });

  it('sets attribution expiry to 30 days', () => {
    const ref = createReferral('pat-1', 'Jane');
    const expiry = new Date(ref.attributionExpiry);
    const created = new Date(ref.createdAt);
    const diffDays = Math.round((expiry.getTime() - created.getTime()) / (86400000));
    expect(diffDays).toBe(30);
  });

  it('records source', () => {
    const ref = createReferral('pat-1', 'Jane', undefined, 'sms');
    expect(ref.source).toBe('sms');
  });
});

// ── Advance Referral ─────────────────────────────────────────────────────

describe('advanceReferral', () => {
  const baseRef = makeRef('sent', 'pat-1');

  it('advances from sent to clicked', () => {
    const updated = advanceReferral(baseRef, 'clicked');
    expect(updated.status).toBe('clicked');
    expect(updated.clickedAt).toBeDefined();
  });

  it('advances from clicked to booked', () => {
    const clicked = { ...baseRef, status: 'clicked' as ReferralStatus };
    const updated = advanceReferral(clicked, 'booked', {
      refereeEmail: 'friend@email.com',
      refereeName: 'Friend',
    });
    expect(updated.status).toBe('booked');
    expect(updated.refereeEmail).toBe('friend@email.com');
    expect(updated.bookedAt).toBeDefined();
  });

  it('advances from booked to completed', () => {
    const booked = { ...baseRef, status: 'booked' as ReferralStatus };
    const updated = advanceReferral(booked, 'completed');
    expect(updated.status).toBe('completed');
    expect(updated.completedAt).toBeDefined();
  });

  it('advances to rewarded and sets reward flags', () => {
    const completed = { ...baseRef, status: 'completed' as ReferralStatus };
    const updated = advanceReferral(completed, 'rewarded');
    expect(updated.status).toBe('rewarded');
    expect(updated.referrerRewardIssued).toBe(true);
    expect(updated.refereeRewardIssued).toBe(true);
  });

  it('does not go backward', () => {
    const completed = { ...baseRef, status: 'completed' as ReferralStatus };
    const updated = advanceReferral(completed, 'sent');
    expect(updated.status).toBe('completed');
  });

  it('can expire from any non-terminal state', () => {
    const updated = advanceReferral(baseRef, 'expired');
    expect(updated.status).toBe('expired');
  });
});

// ── Expiration ───────────────────────────────────────────────────────────

describe('isReferralExpired', () => {
  it('returns false for recent referral', () => {
    const ref = createReferral('pat-1', 'Jane');
    expect(isReferralExpired(ref)).toBe(false);
  });

  it('returns true when attribution window expired', () => {
    const ref = createReferral('pat-1', 'Jane');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 31);
    expect(isReferralExpired(ref, futureDate)).toBe(true);
  });

  it('returns false for completed referrals regardless of age', () => {
    const ref = { ...makeRef('completed', 'pat-1') };
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 120);
    expect(isReferralExpired(ref, futureDate)).toBe(false);
  });
});

// ── Reward Issuance ──────────────────────────────────────────────────────

describe('shouldIssueReferrerReward', () => {
  it('returns true for completed without reward', () => {
    const ref = { ...makeRef('completed', 'pat-1'), referrerRewardIssued: false };
    expect(shouldIssueReferrerReward(ref)).toBe(true);
  });

  it('returns false if already issued', () => {
    const ref = { ...makeRef('completed', 'pat-1'), referrerRewardIssued: true };
    expect(shouldIssueReferrerReward(ref)).toBe(false);
  });

  it('returns false for non-completed', () => {
    const ref = { ...makeRef('booked', 'pat-1'), referrerRewardIssued: false };
    expect(shouldIssueReferrerReward(ref)).toBe(false);
  });
});

describe('shouldIssueRefereeReward', () => {
  it('returns true for booked without reward', () => {
    const ref = { ...makeRef('booked', 'pat-1'), refereeRewardIssued: false };
    expect(shouldIssueRefereeReward(ref)).toBe(true);
  });

  it('returns false for sent status', () => {
    const ref = { ...makeRef('sent', 'pat-1'), refereeRewardIssued: false };
    expect(shouldIssueRefereeReward(ref)).toBe(false);
  });
});

describe('markReferrerRewardIssued', () => {
  it('marks immutably', () => {
    const ref = { ...makeRef('completed', 'pat-1'), referrerRewardIssued: false };
    const updated = markReferrerRewardIssued(ref);
    expect(updated.referrerRewardIssued).toBe(true);
    expect(ref.referrerRewardIssued).toBe(false);
  });
});

// ── Attribution ──────────────────────────────────────────────────────────

describe('lookupByCode', () => {
  it('finds referral by code', () => {
    const referrals = [makeRef('sent', 'pat-1')];
    const found = lookupByCode(referrals, referrals[0].referralCode);
    expect(found).not.toBeNull();
  });

  it('excludes expired referrals', () => {
    const referrals = [makeRef('expired', 'pat-1')];
    const found = lookupByCode(referrals, referrals[0].referralCode);
    expect(found).toBeNull();
  });
});

describe('getAttributionExpiry', () => {
  it('returns date 30 days from click', () => {
    const click = new Date(2026, 0, 1);
    const expiry = new Date(getAttributionExpiry(click));
    expect(expiry.getDate()).toBe(31);
    expect(expiry.getMonth()).toBe(0);
  });
});

// ── Statistics ───────────────────────────────────────────────────────────

describe('calculateReferralStats', () => {
  it('counts statuses correctly', () => {
    const referrals: Referral[] = [
      makeRef('sent', 'pat-1'),
      makeRef('sent', 'pat-1'),
      makeRef('clicked', 'pat-1'),
      makeRef('booked', 'pat-1'),
      makeRef('completed', 'pat-1'),
      makeRef('expired', 'pat-1'),
    ];
    const stats = calculateReferralStats(referrals);
    expect(stats.totalReferrals).toBe(6);
    expect(stats.sent).toBe(2);
    expect(stats.clicked).toBe(1);
    expect(stats.booked).toBe(1);
    expect(stats.completed).toBe(1);
    expect(stats.expired).toBe(1);
  });

  it('calculates conversion rate', () => {
    const referrals = [makeRef('completed', 'p-1'), makeRef('completed', 'p-1'), makeRef('sent', 'p-1'), makeRef('expired', 'p-1')];
    const stats = calculateReferralStats(referrals);
    expect(stats.conversionRate).toBe(50);
  });

  it('calculates funnel rates', () => {
    const referrals = [
      makeRef('sent', 'p-1'),
      makeRef('clicked', 'p-1'),
      makeRef('booked', 'p-1'),
      makeRef('completed', 'p-1'),
    ];
    const stats = calculateReferralStats(referrals);
    expect(stats.funnelRates.sentToClicked).toBeGreaterThan(0);
    expect(stats.funnelRates.clickedToBooked).toBeGreaterThan(0);
    expect(stats.funnelRates.bookedToCompleted).toBeGreaterThan(0);
  });

  it('handles empty list', () => {
    const stats = calculateReferralStats([]);
    expect(stats.totalReferrals).toBe(0);
    expect(stats.conversionRate).toBe(0);
  });
});

describe('getTopReferrers', () => {
  it('ranks by completed referrals', () => {
    const referrals = [
      makeRef('completed', 'pat-1', 'Jane'),
      makeRef('completed', 'pat-1', 'Jane'),
      makeRef('completed', 'pat-2', 'Bob'),
      makeRef('sent', 'pat-2', 'Bob'),
    ];
    const top = getTopReferrers(referrals);
    expect(top[0].referrerId).toBe('pat-1');
    expect(top[0].completedReferrals).toBe(2);
    expect(top[1].referrerId).toBe('pat-2');
  });
});

describe('calculateReferralRevenue', () => {
  it('calculates revenue and ROI', () => {
    const referrals = [makeRef('completed', 'p-1'), makeRef('completed', 'p-1')];
    const result = calculateReferralRevenue(referrals, 350);
    expect(result.totalRevenue).toBe(700);
    expect(result.totalRewardsCost).toBe(150); // 2 * ($50 + $25)
    expect(result.netRevenue).toBe(550);
    expect(result.roi).toBeGreaterThan(0);
  });
});

// ── Share Content ────────────────────────────────────────────────────────

describe('generateShareContent', () => {
  it('generates share URL with code', () => {
    const content = generateShareContent('RANI-ABCD', 'Jane');
    expect(content.shareUrl).toContain('ref=RANI-ABCD');
  });

  it('includes referrer name in SMS', () => {
    const content = generateShareContent('RANI-ABCD', 'Jane');
    expect(content.smsText).toContain('Jane');
    expect(content.smsText).toContain('$25 off');
  });

  it('uses custom base URL', () => {
    const content = generateShareContent('RANI-ABCD', 'Jane', 'https://custom.com');
    expect(content.shareUrl).toContain('https://custom.com');
  });
});

// ── Display Helpers ──────────────────────────────────────────────────────

describe('getReferralStatusLabel', () => {
  it('returns labels for all statuses', () => {
    const statuses: ReferralStatus[] = ['sent', 'clicked', 'booked', 'completed', 'rewarded', 'expired'];
    for (const s of statuses) {
      expect(getReferralStatusLabel(s)).toBeTruthy();
    }
  });
});

describe('getReferralStatusColor', () => {
  it('returns Tailwind classes for all statuses', () => {
    const statuses: ReferralStatus[] = ['sent', 'clicked', 'booked', 'completed', 'rewarded', 'expired'];
    for (const s of statuses) {
      const color = getReferralStatusColor(s);
      expect(color).toContain('bg-');
      expect(color).toContain('text-');
    }
  });
});

describe('getActiveReferralCodes', () => {
  it('returns active codes for referrer', () => {
    const referrals = [
      makeRef('sent', 'pat-1'),
      makeRef('booked', 'pat-1'),
      makeRef('expired', 'pat-1'),
      makeRef('sent', 'pat-2'),
    ];
    const codes = getActiveReferralCodes(referrals, 'pat-1');
    expect(codes.length).toBe(2); // excludes expired
  });
});

// ── Constants ────────────────────────────────────────────────────────────

describe('constants', () => {
  it('referrer reward is $50', () => {
    expect(REFERRER_REWARD.amount).toBe(50);
    expect(REFERRER_REWARD.type).toBe('credit');
  });

  it('referee reward is $25', () => {
    expect(REFEREE_REWARD.amount).toBe(25);
  });

  it('attribution window is 30 days', () => {
    expect(REFERRAL_EXPIRY_DAYS).toBe(30);
  });

  it('max active referrals is 10', () => {
    expect(MAX_ACTIVE_REFERRALS).toBe(10);
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────

function makeRef(status: ReferralStatus, referrerId: string, name?: string): Referral {
  const now = new Date();
  const expiry = new Date(now);
  expiry.setDate(expiry.getDate() + 30);

  return {
    id: `ref-${Math.random().toString(36).slice(2)}`,
    referrerId,
    referrerName: name || 'Jane',
    referralCode: generateReferralCode(),
    status,
    createdAt: now.toISOString(),
    referrerRewardIssued: status === 'completed' || status === 'rewarded',
    refereeRewardIssued: status === 'rewarded',
    attributionExpiry: expiry.toISOString(),
  };
}
