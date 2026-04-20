import { getCouncilSnapshot } from '@/lib/dashboard/agent-council';
import { WAR_ROOM_REACTIVATION_CAMPAIGNS } from '@/lib/dashboard/war-room';

export type ExecutiveBriefing = {
  generatedAt: string;
  summary: string;
  topMoves: Array<{
    id: string;
    title: string;
    owner: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
  metrics: {
    activeAgents: number;
    estimatedRecovery: number;
    campaignCount: number;
  };
};

export async function getExecutiveBriefing(): Promise<ExecutiveBriefing> {
  const snapshot = getCouncilSnapshot();
  const estimatedRecovery = WAR_ROOM_REACTIVATION_CAMPAIGNS.reduce(
    (sum, campaign) => sum + campaign.totalEstimatedRecovery,
    0,
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: 'owner briefing is ready. focus on consult conversion, recovery campaigns, and margin discipline today.',
    topMoves: snapshot.criticalMoves.slice(0, 5).map((move) => ({
      id: move.id,
      title: move.title,
      owner: move.owner,
      severity: move.severity,
    })),
    metrics: {
      activeAgents: snapshot.activeAgentCount,
      estimatedRecovery,
      campaignCount: WAR_ROOM_REACTIVATION_CAMPAIGNS.length,
    },
  };
}
