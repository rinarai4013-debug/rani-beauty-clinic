'use client';

import { motion } from 'framer-motion';
import { Calendar, FileText, Video, Mail, Image, Sparkles } from 'lucide-react';
import type { WeeklyContent, ContentPiece, ContentType } from '@/lib/marketing/content-calendar';

const TYPE_ICONS: Record<ContentType, React.ElementType> = {
  blog_post: FileText,
  social_post: Image,
  email_newsletter: Mail,
  video_script: Video,
  infographic: Image,
  case_study: FileText,
  how_to_guide: FileText,
  faq: FileText,
  testimonial: Sparkles,
  before_after: Image,
  behind_the_scenes: Video,
  educational_reel: Video,
  story_series: Image,
};

const TYPE_COLORS: Record<string, string> = {
  blog_post: 'bg-blue-100 text-blue-700',
  social_post: 'bg-pink-100 text-pink-700',
  email_newsletter: 'bg-cyan-100 text-cyan-700',
  educational_reel: 'bg-purple-100 text-purple-700',
  story_series: 'bg-amber-100 text-amber-700',
  testimonial: 'bg-emerald-100 text-emerald-700',
  before_after: 'bg-orange-100 text-orange-700',
  video_script: 'bg-indigo-100 text-indigo-700',
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-300',
};

interface ContentCalendarGridProps {
  weeks: WeeklyContent[];
  loading?: boolean;
  onPieceClick?: (piece: ContentPiece) => void;
}

export default function ContentCalendarGrid({ weeks, loading, onPieceClick }: ContentCalendarGridProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-rani-border/30 bg-white p-5 animate-pulse">
        <div className="h-5 w-40 bg-rani-cream rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-rani-cream rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
      <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4" />
        Content Calendar
      </h3>

      <div className="space-y-4">
        {weeks.map((week, weekIdx) => (
          <motion.div
            key={week.weekNumber}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: weekIdx * 0.05 }}
            className="border border-rani-border/20 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-xs font-heading font-semibold text-rani-navy">
                  Week {week.weekNumber}: {week.theme}
                </h4>
                <p className="text-[10px] font-body text-rani-muted">
                  {week.startDate} to {week.endDate} &middot; {week.totalPieces} pieces
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {week.pieces.map(piece => {
                const Icon = TYPE_ICONS[piece.type] || FileText;
                const colorClass = TYPE_COLORS[piece.type] || 'bg-slate-100 text-slate-600';

                return (
                  <button
                    key={piece.id}
                    onClick={() => onPieceClick?.(piece)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-body ${colorClass} hover:opacity-80 transition-opacity`}
                    title={`${piece.title}\n${piece.scheduledDate || 'Unscheduled'}\nChannels: ${piece.channel.join(', ')}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[piece.priority]}`} />
                    <Icon className="w-3 h-3" />
                    <span className="max-w-[120px] truncate">{piece.title.split(' — ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
