'use client';

import useSWR, { SWRConfiguration } from 'swr';
import type {
  MobileAppointment,
  TreatmentRecord,
  LoyaltyAccount,
  PointsTransaction,
  RewardItem,
  Challenge,
  ReferralEntry,
  MobileClientProfile,
  ShopProduct,
  ResultsGalleryItem,
  ProgressTimeline,
  ServiceItem,
  ProviderInfo,
  TimeSlot,
  ChatMessage,
  SkincareTip,
  TreatmentPlanProgress,
  PaginatedResponse,
} from '@/types/mobile';

/* ─── Error class ───────────────────────────────────────────────────── */

export class MobileFetchError extends Error {
  status: number;
  info?: unknown;

  constructor(message: string, status: number, info?: unknown) {
    super(message);
    this.name = 'MobileFetchError';
    this.status = status;
    this.info = info;
  }
}

/* ─── Fetcher ───────────────────────────────────────────────────────── */

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    let info: unknown;
    try {
      info = await res.json();
    } catch {
      // not JSON
    }
    throw new MobileFetchError(`Fetch failed (${res.status})`, res.status, info);
  }
  const json = await res.json();
  return json.data ?? json;
};

/* ─── Base hook ─────────────────────────────────────────────────────── */

interface UseMobileDataReturn<T> {
  data: T | undefined;
  error: MobileFetchError | Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => void;
}

function useMobileData<T>(
  endpoint: string | null,
  config?: SWRConfiguration,
): UseMobileDataReturn<T> {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    endpoint ? `/api/mobile${endpoint}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...config,
    },
  );

  return { data, error, isLoading, isValidating, mutate };
}

/* ─── Appointment hooks ─────────────────────────────────────────────── */

export function useUpcomingAppointments() {
  return useMobileData<MobileAppointment[]>('/appointments?status=upcoming', {
    refreshInterval: 30_000,
  });
}

export function usePastAppointments(page = 1) {
  return useMobileData<PaginatedResponse<MobileAppointment>>(
    `/appointments?status=past&page=${page}`,
    { refreshInterval: 60_000 },
  );
}

export function useNextAppointment() {
  return useMobileData<MobileAppointment | null>('/appointments?status=next', {
    refreshInterval: 30_000,
  });
}

/* ─── Treatment hooks ───────────────────────────────────────────────── */

export function useTreatmentHistory(page = 1) {
  return useMobileData<PaginatedResponse<TreatmentRecord>>(
    `/treatments?page=${page}`,
    { refreshInterval: 60_000 },
  );
}

export function useTreatmentDetail(id: string | null) {
  return useMobileData<TreatmentRecord>(id ? `/treatments/${id}` : null, {
    refreshInterval: 120_000,
  });
}

export function useTreatmentPlanProgress() {
  return useMobileData<TreatmentPlanProgress[]>('/treatments/plans', {
    refreshInterval: 120_000,
  });
}

/* ─── Rewards & Loyalty hooks ───────────────────────────────────────── */

export function useLoyaltyAccount() {
  return useMobileData<LoyaltyAccount>('/rewards/account', {
    refreshInterval: 60_000,
  });
}

export function usePointsHistory(page = 1) {
  return useMobileData<PaginatedResponse<PointsTransaction>>(
    `/rewards/points?page=${page}`,
    { refreshInterval: 60_000 },
  );
}

export function useAvailableRewards() {
  return useMobileData<RewardItem[]>('/rewards/catalog', {
    refreshInterval: 120_000,
  });
}

export function useChallenges() {
  return useMobileData<Challenge[]>('/rewards/challenges', {
    refreshInterval: 60_000,
  });
}

export function useReferrals() {
  return useMobileData<ReferralEntry[]>('/rewards/referrals', {
    refreshInterval: 120_000,
  });
}

/* ─── Profile hooks ─────────────────────────────────────────────────── */

export function useClientProfile() {
  return useMobileData<MobileClientProfile>('/profile', {
    refreshInterval: 300_000,
  });
}

/* ─── Shop hooks ────────────────────────────────────────────────────── */

export function useShopProducts(category?: string) {
  const query = category ? `?category=${category}` : '';
  return useMobileData<ShopProduct[]>(`/shop${query}`, {
    refreshInterval: 300_000,
  });
}

export function useRecommendedProducts() {
  return useMobileData<ShopProduct[]>('/shop?recommended=true', {
    refreshInterval: 300_000,
  });
}

/* ─── Results hooks ─────────────────────────────────────────────────── */

export function useResultsGallery(treatmentType?: string) {
  const query = treatmentType ? `?type=${treatmentType}` : '';
  return useMobileData<ResultsGalleryItem[]>(`/results${query}`, {
    refreshInterval: 300_000,
  });
}

export function useProgressTimeline(treatmentType: string) {
  return useMobileData<ProgressTimeline>(
    `/results/timeline?type=${encodeURIComponent(treatmentType)}`,
    { refreshInterval: 300_000 },
  );
}

/* ─── Booking hooks ─────────────────────────────────────────────────── */

export function useServiceCatalog(category?: string) {
  const query = category ? `?category=${category}` : '';
  return useMobileData<ServiceItem[]>(`/appointments/services${query}`, {
    refreshInterval: 300_000,
  });
}

export function useProviders(serviceId?: string) {
  const query = serviceId ? `?service=${serviceId}` : '';
  return useMobileData<ProviderInfo[]>(`/appointments/providers${query}`, {
    refreshInterval: 300_000,
  });
}

export function useTimeSlots(date: string, serviceId: string, providerId?: string) {
  const params = new URLSearchParams({ date, service: serviceId });
  if (providerId) params.set('provider', providerId);
  return useMobileData<TimeSlot[]>(`/appointments/slots?${params.toString()}`, {
    refreshInterval: 30_000,
  });
}

/* ─── Chat hooks ────────────────────────────────────────────────────── */

export function useChatHistory() {
  return useMobileData<ChatMessage[]>('/chat/history', {
    refreshInterval: 10_000,
  });
}

/* ─── Home feed hooks ───────────────────────────────────────────────── */

export function useSkincareTip() {
  return useMobileData<SkincareTip>('/home/tip', {
    refreshInterval: 3_600_000, // 1 hour
  });
}

export function useHomeFeed() {
  return useMobileData<{
    nextAppointment: MobileAppointment | null;
    loyalty: LoyaltyAccount;
    treatmentStreak: number;
    tip: SkincareTip;
    featuredService: ServiceItem | null;
    recentResult: ResultsGalleryItem | null;
  }>('/home/feed', {
    refreshInterval: 60_000,
  });
}

/* ─── Mutation helpers ──────────────────────────────────────────────── */

export async function sendChatMessage(content: string): Promise<ChatMessage> {
  const res = await fetch('/api/mobile/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: content }),
  });
  if (!res.ok) throw new MobileFetchError('Failed to send message', res.status);
  const json = await res.json();
  return json.data;
}

export async function createBooking(booking: {
  serviceId: string;
  providerId?: string;
  date: string;
  time: string;
  notes?: string;
}): Promise<MobileAppointment> {
  const res = await fetch('/api/mobile/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });
  if (!res.ok) throw new MobileFetchError('Failed to create booking', res.status);
  const json = await res.json();
  return json.data;
}

export async function updateProfile(
  updates: Partial<MobileClientProfile>,
): Promise<MobileClientProfile> {
  const res = await fetch('/api/mobile/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new MobileFetchError('Failed to update profile', res.status);
  const json = await res.json();
  return json.data;
}

export async function rateTreatmentResult(
  treatmentId: string,
  day: 1 | 7 | 30,
  rating: number,
  notes?: string,
): Promise<void> {
  const res = await fetch(`/api/mobile/treatments/${treatmentId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day, rating, notes }),
  });
  if (!res.ok) throw new MobileFetchError('Failed to rate treatment', res.status);
}

export async function redeemReward(rewardId: string): Promise<void> {
  const res = await fetch('/api/mobile/rewards/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rewardId }),
  });
  if (!res.ok) throw new MobileFetchError('Failed to redeem reward', res.status);
}

export async function toggleAftercareItem(
  treatmentId: string,
  itemId: string,
  completed: boolean,
): Promise<void> {
  const res = await fetch(`/api/mobile/treatments/${treatmentId}/aftercare`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, completed }),
  });
  if (!res.ok) throw new MobileFetchError('Failed to update aftercare', res.status);
}
