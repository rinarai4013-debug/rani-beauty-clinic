// ── Communication Hub - Public API ────────────────────────────────────

// Message Router
export {
  MessageRouter,
  createMessageRouter,
  getMessageRouter,
  isQuietHours,
  checkRateLimit,
  renderTemplate,
  resolveChannel,
  logDelivery,
  getDeliveryLogs,
} from './message-router';
export type { DeliveryLog } from './message-router';

// Campaign Builder
export {
  createCampaign,
  getCampaign,
  getAllCampaigns,
  updateCampaign,
  updateCampaignStatus,
  duplicateCampaign,
  deleteCampaign,
  evaluateCondition,
  evaluateGroup,
  evaluateAudienceFilter,
  segmentAudience,
  splitAudience,
  determineABWinner,
  createEmptyMetrics,
  calculateMetricRates,
  updateCampaignMetrics,
  attributeRevenue,
  unsubscribeClient,
  resubscribeClient,
  isUnsubscribed,
  getUnsubscribedClients,
  getResubscribeRequests,
  validateCANSPAM,
  createDripSequence,
  getCampaignTypeDefaults,
  getSpendTier,
} from './campaign-builder';

// Conversation Engine
export {
  createConversation,
  getConversation,
  getConversationByClient,
  getAllConversations,
  addMessageToConversation,
  markConversationRead,
  updateConversationStatus,
  assignConversation,
  categorizeMessage,
  getSmartReplies,
  getEscalationRule,
  checkSLA,
  calculateResponseTimes,
  getConversationStats,
} from './conversation-engine';

// Analytics
export {
  getCommunicationAnalytics,
  analyzeBestSendTimes,
  getProviderComparison,
} from './analytics';
export type { ProviderStats } from './analytics';
