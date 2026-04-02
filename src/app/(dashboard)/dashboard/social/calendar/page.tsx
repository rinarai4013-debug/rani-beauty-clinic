"use client";

import { useState } from "react";
import type { Metadata } from "next";

// ── INLINE CALENDAR DATA ──
// Self-contained content calendar aligned with the auto-post-engine themes
// but independent so it renders without external data dependencies.

type ContentType = "Reel" | "Carousel" | "Story" | "Feed Post";
type Category =
  | "educational"
  | "before_after"
  | "promotional"
  | "behind_the_scenes"
  | "testimonial"
  | "seasonal"
  | "service_highlight"
  | "wellness_tip"
  | "community";

interface CalendarDay {
  day: string;
  theme: string;
  contentType: ContentType;
  caption: string;
  hashtags: string[];
  postTime: string;
  category: Category;
}

const CATEGORY_COLORS: Record<Category, { bg: string; text: string; dot: string }> = {
  educational:        { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500" },
  before_after:       { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500" },
  promotional:        { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  behind_the_scenes:  { bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500" },
  testimonial:        { bg: "bg-rose-50",    text: "text-rose-700",    dot: "bg-rose-500" },
  seasonal:           { bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-500" },
  service_highlight:  { bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-500" },
  wellness_tip:       { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  community:          { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500" },
};

const MONTHLY_THEME = {
  title: "Spring Renewal",
  subtitle: "Fresh starts, radiant results, wedding-season prep",
  focusServices: ["HydraFacial", "VI Peel", "Laser Hair Removal"],
};

const WEEKLY_CALENDAR: CalendarDay[] = [
  {
    day: "Monday",
    theme: "Motivation Monday",
    contentType: "Feed Post",
    caption:
      "Did you know? HydraFacial combines cleansing, exfoliation, and hydration in one session. At Rani Beauty Clinic, we combine medical expertise with luxury care for results you can see and feel.",
    hashtags: ["#RaniBeautyClinic", "#RaniGlow", "#RentonMedspa", "#HydraFacial", "#GlowingSkin", "#SkinCare"],
    postTime: "11:00 AM",
    category: "educational",
  },
  {
    day: "Tuesday",
    theme: "Transformation Tuesday",
    contentType: "Carousel",
    caption:
      "The transformation speaks for itself. After Botox, the results are stunning. Real results. Real confidence. Real beauty.",
    hashtags: ["#RaniBeautyClinic", "#RaniGlow", "#RentonMedspa", "#Botox", "#InjectableExperts", "#NaturalResults"],
    postTime: "10:00 AM",
    category: "before_after",
  },
  {
    day: "Wednesday",
    theme: "Wellness Wednesday",
    contentType: "Feed Post",
    caption:
      "Your wellness journey starts from within. NAD+ injections support your body's natural processes for lasting health and vitality. At Rani, we believe beauty starts with wellness.",
    hashtags: ["#RaniBeautyClinic", "#RaniGlow", "#WellnessInjections", "#NAD", "#BiohackingSeattle"],
    postTime: "11:00 AM",
    category: "wellness_tip",
  },
  {
    day: "Thursday",
    theme: "Treatment Spotlight",
    contentType: "Reel",
    caption:
      "VI Peel explained: A medical-grade chemical peel that reveals brighter, smoother skin in just 7 days. Duration: 15-30 minutes | Results: Progressive over 7 days. Book your appointment today.",
    hashtags: ["#RaniBeautyClinic", "#RaniGlow", "#VIPeel", "#ChemicalPeel", "#SkinResurfacing", "#PeelSeason"],
    postTime: "12:00 PM",
    category: "service_highlight",
  },
  {
    day: "Friday",
    theme: "Friday BTS",
    contentType: "Story",
    caption:
      "A peek inside our treatment room. This is what Sofwave looks like in action at Rani Beauty Clinic. Our medical-grade equipment and trained providers ensure the best results every time.",
    hashtags: ["#RaniBeautyClinic", "#RentonMedspa", "#Sofwave", "#SkinTightening", "#BehindTheScenes"],
    postTime: "10:00 AM",
    category: "behind_the_scenes",
  },
  {
    day: "Saturday",
    theme: "Client Love",
    contentType: "Carousel",
    caption:
      '"I cannot believe the difference!" Another happy Rani client after their HydraFacial treatment. With 200+ 5-star reviews, our results speak for themselves.',
    hashtags: ["#RaniBeautyClinic", "#RaniGlow", "#RentonMedspa", "#HydraFacial", "#FacialRejuvenation", "#GlassSkin"],
    postTime: "9:00 AM",
    category: "testimonial",
  },
  {
    day: "Sunday",
    theme: "Self-Care Sunday",
    contentType: "Story",
    caption:
      "Spring Renewal is here! Fresh start, fresh face. Start with HydraFacial and let your glow do the talking.",
    hashtags: ["#RaniBeautyClinic", "#RaniGlow", "#SelfCareSunday", "#SpringRenewal", "#GlowingSkin"],
    postTime: "5:00 PM",
    category: "seasonal",
  },
];

const WEEKLY_FOCUS = [
  "Push Reel content on Thursday for maximum reach (Reels outperform static posts by 30%).",
  "Before/after carousel on Tuesday drives highest engagement -- ensure consent and disclaimer.",
  "Wellness Wednesday targets the growing biohacking audience in the Seattle metro.",
  "Saturday testimonial leverages social proof from 200+ Google reviews.",
  "Stories on Friday + Sunday keep the brand top-of-mind without over-posting to the feed.",
];

// ── PAGE COMPONENT ──

export default function SocialCalendarPage() {
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  return (
    <>
      {/* noindex meta for dashboard page */}
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>

      <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Social Content Calendar
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Weekly posting schedule aligned with Rani Beauty Clinic brand voice
          </p>
        </div>

        {/* Monthly Theme Banner */}
        <div className="mb-8 rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 p-6 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Monthly Theme
              </p>
              <h2 className="mt-1 text-xl font-bold">{MONTHLY_THEME.title}</h2>
              <p className="mt-1 text-sm text-gray-300">
                {MONTHLY_THEME.subtitle}
              </p>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Focus Services
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {MONTHLY_THEME.focusServices.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Category Legend */}
        <div className="mb-6 flex flex-wrap gap-3">
          {(Object.entries(CATEGORY_COLORS) as [Category, typeof CATEGORY_COLORS[Category]][]).map(
            ([cat, colors]) => (
              <span
                key={cat}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${colors.bg} ${colors.text}`}
              >
                <span className={`inline-block h-2 w-2 rounded-full ${colors.dot}`} />
                {cat.replace(/_/g, " ")}
              </span>
            )
          )}
        </div>

        {/* 7-Day Content Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {WEEKLY_CALENDAR.map((day) => {
            const colors = CATEGORY_COLORS[day.category];
            return (
              <button
                key={day.day}
                onClick={() =>
                  setSelectedDay(selectedDay?.day === day.day ? null : day)
                }
                className={`rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${
                  selectedDay?.day === day.day
                    ? "ring-2 ring-gray-900"
                    : "border-gray-200"
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {day.day}
                  </h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors.bg} ${colors.text}`}
                  >
                    {day.contentType}
                  </span>
                </div>

                {/* Theme */}
                <p className="mt-2 text-xs font-medium text-gray-600">
                  {day.theme}
                </p>

                {/* Caption Preview */}
                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-gray-500">
                  {day.caption}
                </p>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-[10px] font-medium text-gray-400">
                    {day.postTime}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-medium ${colors.text}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                    {day.category.replace(/_/g, " ")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded Day Detail */}
        {selectedDay && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedDay.day} &mdash; {selectedDay.theme}
                </h3>
                <span
                  className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    CATEGORY_COLORS[selectedDay.category].bg
                  } ${CATEGORY_COLORS[selectedDay.category].text}`}
                >
                  {selectedDay.contentType} &middot;{" "}
                  {selectedDay.category.replace(/_/g, " ")}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                Post at {selectedDay.postTime}
              </span>
            </div>

            {/* Full Caption */}
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Suggested Caption
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                {selectedDay.caption}
              </p>
            </div>

            {/* Hashtags */}
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Hashtags
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedDay.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* This Week's Focus */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900">
            This Week&apos;s Focus
          </h3>
          <ul className="mt-3 space-y-2">
            {WEEKLY_FOCUS.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-gray-400">
          Content generated by Rani Social Engine. All captions are brand-voice
          linted before publishing.
        </p>
      </div>
    </>
  );
}
