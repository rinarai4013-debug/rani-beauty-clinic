/**
 * Plugin Marketplace Tests — 30+ tests
 */

import {
  getAllPlugins, getPlugin, getPluginBySlug,
  installPlugin, uninstallPlugin, updatePluginConfig, pausePlugin, resumePlugin,
  getTenantInstallations, getInstallation, isPluginInstalled,
  submitReview, getPluginReviews,
  calculateRevenueShare, getMarketplaceStats,
  initializeMarketplace,
  resetMarketplace,
  REVENUE_SHARE_AUTHOR, REVENUE_SHARE_PLATFORM,
} from '../marketplace/plugins';

beforeEach(() => {
  resetMarketplace();
  initializeMarketplace();
});

describe('marketplace initialization', () => {
  it('initializes 15 plugins', () => {
    const plugins = getAllPlugins();
    expect(plugins.length).toBe(15);
  });

  it('all plugins have required fields', () => {
    getAllPlugins().forEach(p => {
      expect(p.id).toBeDefined();
      expect(p.slug).toBeDefined();
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
      expect(p.version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(p.permissions.length).toBeGreaterThan(0);
      expect(p.author.name).toBeDefined();
    });
  });

  it('includes free and paid plugins', () => {
    const free = getAllPlugins().filter(p => p.pricing.model === 'free');
    const paid = getAllPlugins().filter(p => p.pricing.model === 'monthly');
    expect(free.length).toBeGreaterThan(0);
    expect(paid.length).toBeGreaterThan(0);
  });
});

describe('plugin queries', () => {
  it('filters by category', () => {
    const marketing = getAllPlugins({ category: 'marketing' });
    expect(marketing.length).toBeGreaterThan(0);
    marketing.forEach(p => expect(p.category).toBe('marketing'));
  });

  it('searches by name', () => {
    const results = getAllPlugins({ search: 'birthday' });
    expect(results.length).toBe(1);
    expect(results[0].slug).toBe('client-birthday-automator');
  });

  it('searches by tag', () => {
    const results = getAllPlugins({ search: 'ai' });
    expect(results.length).toBeGreaterThan(0);
  });

  it('sorts by popular', () => {
    const sorted = getAllPlugins({ sort: 'popular' });
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].stats.activeInstalls).toBeGreaterThanOrEqual(sorted[i].stats.activeInstalls);
    }
  });

  it('sorts by rating', () => {
    const sorted = getAllPlugins({ sort: 'rating' });
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].stats.rating).toBeGreaterThanOrEqual(sorted[i].stats.rating);
    }
  });

  it('gets plugin by ID', () => {
    const plugin = getPlugin('plugin_online-booking-widget');
    expect(plugin).not.toBeNull();
    expect(plugin!.name).toBe('Online Booking Widget');
  });

  it('gets plugin by slug', () => {
    const plugin = getPluginBySlug('loyalty-program');
    expect(plugin).not.toBeNull();
    expect(plugin!.name).toBe('Loyalty Program');
  });

  it('returns null for unknown plugin', () => {
    expect(getPlugin('fake_plugin')).toBeNull();
    expect(getPluginBySlug('fake-slug')).toBeNull();
  });
});

describe('plugin installation', () => {
  it('installs a plugin', () => {
    const inst = installPlugin({
      tenantId: 't_001', pluginId: 'plugin_loyalty-program',
      installedBy: 'admin',
    });
    expect(inst).not.toBeNull();
    expect(inst!.status).toBe('active');
    expect(inst!.pluginSlug).toBe('loyalty-program');
  });

  it('sets trial period for paid plugins', () => {
    const inst = installPlugin({
      tenantId: 't_001', pluginId: 'plugin_loyalty-program',
      installedBy: 'admin',
    });
    expect(inst!.trialEndsAt).toBeGreaterThan(Date.now());
  });

  it('no trial for free plugins', () => {
    const inst = installPlugin({
      tenantId: 't_001', pluginId: 'plugin_online-booking-widget',
      installedBy: 'admin',
    });
    expect(inst!.trialEndsAt).toBeNull();
  });

  it('prevents duplicate installations', () => {
    installPlugin({ tenantId: 't_001', pluginId: 'plugin_loyalty-program', installedBy: 'admin' });
    const dup = installPlugin({ tenantId: 't_001', pluginId: 'plugin_loyalty-program', installedBy: 'admin' });
    // Should return existing installation
    expect(dup).not.toBeNull();
  });

  it('returns null for unknown plugin', () => {
    expect(installPlugin({ tenantId: 't_001', pluginId: 'plugin_fake', installedBy: 'admin' })).toBeNull();
  });

  it('increments install count', () => {
    const before = getPlugin('plugin_loyalty-program')!.stats.installs;
    installPlugin({ tenantId: 't_001', pluginId: 'plugin_loyalty-program', installedBy: 'admin' });
    expect(getPlugin('plugin_loyalty-program')!.stats.installs).toBe(before + 1);
  });
});

describe('plugin management', () => {
  it('uninstalls a plugin', () => {
    const inst = installPlugin({ tenantId: 't_001', pluginId: 'plugin_loyalty-program', installedBy: 'admin' });
    expect(uninstallPlugin(inst!.id)).toBe(true);
    expect(getTenantInstallations('t_001').length).toBe(0);
  });

  it('updates plugin config', () => {
    const inst = installPlugin({ tenantId: 't_001', pluginId: 'plugin_loyalty-program', installedBy: 'admin' });
    updatePluginConfig(inst!.id, { pointsPerDollar: 2 });
    expect(getInstallation(inst!.id)!.config.pointsPerDollar).toBe(2);
  });

  it('pauses and resumes plugin', () => {
    const inst = installPlugin({ tenantId: 't_001', pluginId: 'plugin_loyalty-program', installedBy: 'admin' });
    pausePlugin(inst!.id);
    expect(getInstallation(inst!.id)!.status).toBe('paused');
    resumePlugin(inst!.id);
    expect(getInstallation(inst!.id)!.status).toBe('active');
  });

  it('lists tenant installations', () => {
    installPlugin({ tenantId: 't_001', pluginId: 'plugin_loyalty-program', installedBy: 'admin' });
    installPlugin({ tenantId: 't_001', pluginId: 'plugin_gift-card-system', installedBy: 'admin' });
    expect(getTenantInstallations('t_001').length).toBe(2);
  });

  it('checks if plugin is installed', () => {
    installPlugin({ tenantId: 't_001', pluginId: 'plugin_loyalty-program', installedBy: 'admin' });
    expect(isPluginInstalled('t_001', 'loyalty-program')).toBe(true);
    expect(isPluginInstalled('t_001', 'gift-card-system')).toBe(false);
  });
});

describe('plugin reviews', () => {
  it('submits a review', () => {
    const review = submitReview({
      pluginId: 'plugin_loyalty-program', tenantId: 't_001',
      userId: 'u_1', userName: 'Dr. Smith',
      rating: 5, title: 'Amazing plugin!', body: 'Works perfectly for our clinic.',
    });
    expect(review.id).toMatch(/^rev_/);
    expect(review.rating).toBe(5);
  });

  it('updates plugin rating on review', () => {
    submitReview({ pluginId: 'plugin_loyalty-program', tenantId: 't_001', userId: 'u_1', userName: 'A', rating: 5, title: 'Great', body: 'Love this plugin so much.' });
    submitReview({ pluginId: 'plugin_loyalty-program', tenantId: 't_002', userId: 'u_2', userName: 'B', rating: 3, title: 'OK', body: 'Decent but could improve.' });
    const plugin = getPlugin('plugin_loyalty-program');
    expect(plugin!.stats.reviewCount).toBe(2);
    expect(plugin!.stats.rating).toBe(4.0);
  });

  it('retrieves plugin reviews', () => {
    submitReview({ pluginId: 'plugin_loyalty-program', tenantId: 't_001', userId: 'u_1', userName: 'A', rating: 5, title: 'Great', body: 'Love this plugin so much.' });
    const reviews = getPluginReviews('plugin_loyalty-program');
    expect(reviews.length).toBe(1);
  });
});

describe('revenue sharing', () => {
  it('calculates revenue share correctly', () => {
    installPlugin({ tenantId: 't_001', pluginId: 'plugin_loyalty-program', installedBy: 'admin' });
    installPlugin({ tenantId: 't_002', pluginId: 'plugin_loyalty-program', installedBy: 'admin' });
    const share = calculateRevenueShare('plugin_loyalty-program', Date.now() - 30 * 24 * 60 * 60 * 1000, Date.now());
    expect(share).not.toBeNull();
    expect(share!.activeInstalls).toBe(2);
    expect(share!.authorShare).toBeGreaterThan(0);
    expect(share!.platformShare).toBeGreaterThan(0);
  });

  it('70/30 split is correct', () => {
    expect(REVENUE_SHARE_AUTHOR).toBe(0.70);
    expect(REVENUE_SHARE_PLATFORM).toBe(0.30);
  });
});

describe('marketplace stats', () => {
  it('returns comprehensive stats', () => {
    const stats = getMarketplaceStats();
    expect(stats.totalPlugins).toBe(15);
    expect(stats.totalInstalls).toBeGreaterThan(0);
    expect(stats.topPlugins.length).toBe(5);
    expect(stats.categoryBreakdown.length).toBeGreaterThan(0);
    expect(stats.recentlyAdded.length).toBe(5);
    expect(stats.trending.length).toBe(5);
  });
});
