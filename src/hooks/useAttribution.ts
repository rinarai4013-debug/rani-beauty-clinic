"use client";

import { useEffect, useState } from "react";
import { getUtmParams } from "@/lib/analytics/events";
import { classifyChannel } from "@/lib/marketing/attribution";

const STORAGE_KEY = "rani_attribution_context";

type AttributionOptions = {
  source?: string;
  leadOffer?: string;
  leadCampaign?: string;
  leadAdSet?: string;
  leadAd?: string;
};

export type AttributionPayload = {
  source?: string;
  leadSource?: string;
  leadMedium?: string;
  leadCampaign?: string;
  leadAdSet?: string;
  leadAd?: string;
  leadOffer?: string;
  leadLandingPage?: string;
  leadKeyword?: string;
  leadReferrer?: string;
  attributionId?: string;
  firstTouchAt?: string;
  lastTouchAt?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

type StoredAttribution = {
  attributionId: string;
  firstTouchAt: string;
  leadLandingPage?: string;
  leadReferrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

function readStoredAttribution(): StoredAttribution | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StoredAttribution;
  } catch {
    return null;
  }
}

function writeStoredAttribution(data: StoredAttribution) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage failures in private browsing or restricted environments.
  }
}

function normalizeMedium(medium: string | undefined, channel: string): string | undefined {
  const value = (medium || "").toLowerCase();
  if (value) {
    if (value === "paid") return "paid_social";
    return value;
  }

  switch (channel) {
    case "paid_search":
      return "cpc";
    case "paid_social":
      return "paid_social";
    case "organic_search":
      return "organic";
    case "organic_social":
      return "social";
    case "referral":
      return "referral";
    case "email":
      return "email";
    case "display":
      return "display";
    case "affiliate":
      return "affiliate";
    case "direct":
      return "direct";
    default:
      return undefined;
  }
}

function mapLeadSourceLabel(channel: string, rawSource: string | undefined): string | undefined {
  const source = (rawSource || "").toLowerCase();

  switch (channel) {
    case "paid_search":
      return source === "google" ? "Google Ads" : "Paid Search";
    case "paid_social":
      return source === "instagram" ? "Meta Ads" : source === "facebook" ? "Meta Ads" : "Paid Social";
    case "organic_search":
      return source === "google" ? "Google Organic" : "Organic Search";
    case "organic_social":
      if (source === "instagram") return "Instagram Organic";
      if (source === "facebook") return "Facebook Organic";
      if (source === "tiktok") return "TikTok";
      return "Organic Social";
    case "email":
      return "Email";
    case "referral":
      return "Referral";
    case "direct":
      return "Direct";
    case "display":
      return source === "hulu" ? "Hulu TV" : "Display";
    default:
      if (source === "hulu") return "Hulu TV";
      return rawSource || undefined;
  }
}

function buildAttributionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `attr_${crypto.randomUUID()}`;
  }

  return `attr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function useAttribution(options: AttributionOptions = {}): AttributionPayload {
  const [attribution, setAttribution] = useState<AttributionPayload>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentUtm = getUtmParams();
    const stored = readStoredAttribution();
    const referrer = document.referrer || stored?.leadReferrer || undefined;
    const landingPage = `${window.location.origin}${window.location.pathname}`;
    const merged = {
      utm_source: currentUtm.utm_source || stored?.utm_source,
      utm_medium: currentUtm.utm_medium || stored?.utm_medium,
      utm_campaign: currentUtm.utm_campaign || stored?.utm_campaign,
      utm_content: currentUtm.utm_content || stored?.utm_content,
      utm_term: currentUtm.utm_term || stored?.utm_term,
    };

    const channel = classifyChannel(merged.utm_source || "", merged.utm_medium || "", referrer);
    const firstTouchAt = stored?.firstTouchAt || new Date().toISOString();
    const lastTouchAt = new Date().toISOString();
    const attributionId = stored?.attributionId || buildAttributionId();

    if (!stored) {
      writeStoredAttribution({
        attributionId,
        firstTouchAt,
        leadLandingPage: landingPage,
        leadReferrer: referrer,
        ...merged,
      });
    } else if (Object.keys(currentUtm).length > 0) {
      writeStoredAttribution({
        ...stored,
        ...merged,
      });
    }

    setAttribution({
      source: options.source,
      leadSource: mapLeadSourceLabel(channel, merged.utm_source),
      leadMedium: normalizeMedium(merged.utm_medium, channel),
      leadCampaign: options.leadCampaign || merged.utm_campaign,
      leadAdSet: options.leadAdSet || merged.utm_content,
      leadAd: options.leadAd,
      leadOffer: options.leadOffer,
      leadLandingPage: stored?.leadLandingPage || landingPage,
      leadKeyword: merged.utm_term,
      leadReferrer: referrer,
      attributionId,
      firstTouchAt,
      lastTouchAt,
      ...merged,
    });
  }, [
    options.source,
    options.leadOffer,
    options.leadCampaign,
    options.leadAdSet,
    options.leadAd,
  ]);

  return attribution;
}
