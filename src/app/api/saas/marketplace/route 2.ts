import { NextRequest, NextResponse } from 'next/server';
import {
  getAllPlugins, getPlugin, installPlugin, uninstallPlugin,
  updatePluginConfig, pausePlugin, resumePlugin,
  getTenantInstallations, submitReview, getPluginReviews,
  getMarketplaceStats, calculateRevenueShare,
  initializeMarketplace, InstallPluginSchema, SubmitReviewSchema,
} from '@/lib/saas/marketplace/plugins';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'list';

  initializeMarketplace();

  switch (action) {
    case 'list': {
      const category = searchParams.get('category') as never;
      const search = searchParams.get('search') || undefined;
      const sort = (searchParams.get('sort') as 'popular' | 'rating' | 'newest' | 'price_low' | 'price_high') || undefined;
      return NextResponse.json({ plugins: getAllPlugins({ category, search, sort }) });
    }
    case 'detail': {
      const pluginId = searchParams.get('pluginId') || '';
      const plugin = getPlugin(pluginId);
      if (!plugin) return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
      return NextResponse.json({ plugin });
    }
    case 'installations': {
      const tenantId = searchParams.get('tenantId') || '';
      return NextResponse.json({ installations: getTenantInstallations(tenantId) });
    }
    case 'reviews': {
      const pluginId = searchParams.get('pluginId') || '';
      return NextResponse.json({ reviews: getPluginReviews(pluginId) });
    }
    case 'stats':
      return NextResponse.json(getMarketplaceStats());
    case 'revenue': {
      const pluginId = searchParams.get('pluginId') || '';
      const start = parseInt(searchParams.get('start') || String(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const end = parseInt(searchParams.get('end') || String(Date.now()));
      const share = calculateRevenueShare(pluginId, start, end);
      if (!share) return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
      return NextResponse.json(share);
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'install';

    initializeMarketplace();

    switch (action) {
      case 'install': {
        const parsed = InstallPluginSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const installation = installPlugin(parsed.data);
        if (!installation) return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
        return NextResponse.json({ installation }, { status: 201 });
      }
      case 'uninstall': {
        const success = uninstallPlugin(body.installationId);
        return NextResponse.json({ success });
      }
      case 'update_config': {
        const success = updatePluginConfig(body.installationId, body.config);
        return NextResponse.json({ success });
      }
      case 'pause': {
        const success = pausePlugin(body.installationId);
        return NextResponse.json({ success });
      }
      case 'resume': {
        const success = resumePlugin(body.installationId);
        return NextResponse.json({ success });
      }
      case 'review': {
        const parsed = SubmitReviewSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const review = submitReview(parsed.data);
        return NextResponse.json({ review }, { status: 201 });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
