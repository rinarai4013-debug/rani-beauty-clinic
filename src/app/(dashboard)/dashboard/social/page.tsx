'use client';

import { motion } from 'framer-motion';
import { Calendar, Hash, Clock, TrendingUp, Instagram, Star, Eye, Sparkles } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton, ChartSkeleton, TableSkeleton, SkeletonBar } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { InlineError } from '@/components/dashboard/shared';
import { useSocialPlan } from '@/hooks/useDashboardData';
import type { SocialContentPlan, ContentItem } from '@/lib/social/auto-post-engine';

interface SocialResponse {
  success: boolean;
  data: SocialContentPlan;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  gbp: 'bg-blue-500',
  both: 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500',
};

const CATEGORY_COLORS: Record<string, string> = {
  educational: 'bg-blue-50 text-blue-700',
  before_after: 'bg-green-50 text-green-700',
  promotional: 'bg-amber-50 text-amber-700',
  behind_the_scenes: 'bg-purple-50 text-purple-700',
  testimonial: 'bg-pink-50 text-pink-700',
  seasonal: 'bg-orange-50 text-orange-700',
  team_spotlight: 'bg-cyan-50 text-cyan-700',
  service_highlight: 'bg-indigo-50 text-indigo-700',
  wellness_tip: 'bg-emerald-50 text-emerald-700',
  community: 'bg-rose-50 text-rose-700',
};

const TYPE_LABELS: Record<string, string> = {
  feed_post: 'Feed Post',
  reel: 'Reel',
  story: 'Story',
  carousel: 'Carousel',
  gbp_update: 'GBP Update',
  gbp_offer: 'GBP Offer',
};

export default function SocialAIPage() {
  const { data: raw, isLoading } = useSocialPlan() as { data: SocialResponse | undefined; isLoading: boolean };
  const data = raw?.data;

  const calendar = data?.weeklyCalendar || [];
  const themes = data?.monthlyThemes || [];
  const queue = data?.contentQueue || [];
  const hashtags = data?.hashtagSets || [];
  const postingTimes = data?.optimalPostingTimes || [];
  const insights = data?.performanceInsights || [];
  const contentScore = data?.contentScore || 0;

  const totalPosts = calendar.reduce((sum, day) => sum + day.posts.length, 0);
  const highPriority = queue.filter(q => q.priority === 'high').length;
  const avgEngagement = queue.length > 0
    ? Math.round(queue.reduce((sum, q) => sum + q.estimatedEngagement, 0) / queue.length)
    : 0;

  const hasData = !isLoading && data;
  const isEmpty = hasData && calendar.length === 0 && themes.length === 0 && queue.length === 0 && hashtags.length === 0 && postingTimes.length === 0 && insights.length === 0;

  return (
    <DashboardErrorBoundary pageName="Social Media AI">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Social Media AI</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">AI-generated weekly content calendar, hashtag strategy, and posting schedule</p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <>
            <KPIRowSkeleton count={4} />
            <PanelSkeleton rows={3} />
            <PanelSkeleton rows={5} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <PanelSkeleton rows={4} />
              <PanelSkeleton rows={4} />
            </div>
            <PanelSkeleton rows={3} />
          </>
        ) : isEmpty ? (
          <DashboardEmptyState
            icon="megaphone"
            title="No social content plan yet"
            description="The AI social content calendar will appear here once the content engine generates your weekly plan."
          />
        ) : (
          <>
            {/* Hero KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
              <KPICard title="Content Score" value={contentScore} suffix="/100" icon="zap" size="hero" />
              <KPICard title="Posts This Week" value={totalPosts} icon="calendar" />
              <KPICard title="High Priority" value={highPriority} icon="alert-triangle" />
              <KPICard title="Avg Engagement" value={avgEngagement} suffix="%" icon="trending-up" />
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-4 sm:p-6 text-white"
              >
                <h3 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-gold mb-3">
                  Content Strategy Insights
                </h3>
                <div className="space-y-2">
                  {insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-rani-gold mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm font-body text-white/80">{insight}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Weekly Calendar */}
            {calendar.length > 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Weekly Content Calendar
                </h3>
                <div className="space-y-4">
                  {calendar.map((day, i) => (
                    <motion.div
                      key={day.dayOfWeek}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-rani-gold flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-body font-semibold text-rani-navy">{day.dayOfWeek}</span>
                        <span className="text-xs font-body text-rani-muted">{day.date}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rani-gold/10 text-rani-gold font-medium flex-shrink-0">
                          {day.posts.length} post{day.posts.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 ml-0 sm:ml-6">
                        {day.posts.map((post, j) => (
                          <ContentCard key={j} post={post} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Weekly Content Calendar
                </h3>
                <DashboardEmptyState
                  icon="calendar"
                  title="No content scheduled this week"
                  description="Content will appear once the AI generates the weekly plan."
                  compact
                />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Monthly Themes */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Monthly Themes
                </h3>
                {themes.length > 0 ? (
                  <div className="space-y-3">
                    {themes.map((theme, i) => (
                      <motion.div
                        key={theme.week}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-body font-semibold text-rani-navy">Week {theme.week}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rani-gold/10 text-rani-gold font-medium truncate max-w-[120px] flex-shrink-0">
                            {theme.focusService}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-body text-rani-text">{theme.theme}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {theme.contentMix.map(mix => (
                            <span key={mix.type} className="text-[10px] font-body text-rani-muted">
                              {mix.count}x {mix.type}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState
                    icon="calendar"
                    title="No monthly themes set"
                    description="Theme data will appear once generated."
                    compact
                  />
                )}
              </div>

              {/* Hashtag Strategy */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Hashtag Strategy
                </h3>
                {hashtags.length > 0 ? (
                  <div className="space-y-3">
                    {hashtags.map((set, i) => (
                      <motion.div
                        key={set.category}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Hash className="w-3.5 h-3.5 text-rani-gold flex-shrink-0" />
                            <span className="text-xs font-body font-semibold text-rani-navy capitalize truncate">{set.category}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            set.reach === 'broad' ? 'bg-blue-50 text-blue-600' :
                            set.reach === 'niche' ? 'bg-purple-50 text-purple-600' :
                            'bg-rani-gold/10 text-rani-gold'
                          }`}>
                            {set.reach}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {set.hashtags.slice(0, 8).map(tag => (
                            <span key={tag} className="text-[10px] font-body text-rani-muted bg-white px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                          {set.hashtags.length > 8 && (
                            <span className="text-[10px] font-body text-rani-muted">+{set.hashtags.length - 8} more</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <DashboardEmptyState
                    icon="message"
                    title="No hashtag sets defined"
                    description="Hashtag strategy will populate once the AI generates recommendations."
                    compact
                  />
                )}
              </div>
            </div>

            {/* Optimal Posting Times */}
            {postingTimes.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Optimal Posting Times
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {postingTimes.map((time, i) => (
                    <motion.div
                      key={`${time.dayOfWeek}-${time.platform}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="text-center p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                    >
                      <p className="text-[10px] font-body font-semibold text-rani-navy uppercase">{time.dayOfWeek.slice(0, 3)}</p>
                      <p className="text-base sm:text-lg font-heading text-rani-navy mt-1">{time.bestTime}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-rani-muted flex-shrink-0" />
                        <span className="text-[10px] font-body text-rani-muted capitalize truncate">{time.platform}</span>
                      </div>
                      <ProgressBar current={time.engagement} target={100} showPercentage={false} height={4} colorMode="gold" />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}

function ContentCard({ post }: { post: ContentItem }) {
  return (
    <div className="p-3 rounded-lg bg-white border border-rani-border/50 hover:border-rani-gold/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PLATFORM_COLORS[post.platform] || 'bg-gray-400'}`} />
          <span className="text-[10px] font-body font-medium text-rani-muted uppercase truncate">{TYPE_LABELS[post.type] || post.type}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${CATEGORY_COLORS[post.category] || 'bg-gray-50 text-gray-600'}`}>
          {post.category.replace('_', ' ')}
        </span>
      </div>
      <p className="text-xs font-body font-semibold text-rani-navy leading-tight mb-1 truncate">{post.title}</p>
      <p className="text-[10px] font-body text-rani-muted line-clamp-2">{post.caption.slice(0, 100)}...</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] font-body text-rani-muted">{post.bestPostTime}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Eye className="w-3 h-3 text-rani-muted" />
          <span className="text-[10px] font-body font-semibold text-rani-navy">{post.estimatedEngagement}%</span>
        </div>
      </div>
    </div>
  );
}
