import { NextRequest, NextResponse } from 'next/server';
import {
  getBrandConfig, updateBrandConfig, publishBrand, unpublishBrand,
  setupCustomDomain, verifyDomain, removeDomain,
  updateCustomCss, generateCssVariables, generatePwaManifest,
  generatePreview, generateColorPalette,
  AVAILABLE_FONTS, UpdateBrandSchema, SetupDomainSchema,
} from '@/lib/saas/white-label/branding';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'config';
  const tenantId = searchParams.get('tenantId') || '';

  switch (action) {
    case 'config':
      return NextResponse.json(getBrandConfig(tenantId));
    case 'css': {
      const config = getBrandConfig(tenantId);
      return NextResponse.json({ css: generateCssVariables(config) });
    }
    case 'manifest': {
      const config = getBrandConfig(tenantId);
      return NextResponse.json(generatePwaManifest(config));
    }
    case 'preview': {
      const preview = generatePreview(tenantId);
      return NextResponse.json(preview);
    }
    case 'domain': {
      const config = getBrandConfig(tenantId);
      return NextResponse.json({ domain: config.customDomain });
    }
    case 'fonts':
      return NextResponse.json({ fonts: AVAILABLE_FONTS });
    case 'palette': {
      const color = searchParams.get('color') || '#C9A96E';
      return NextResponse.json(generateColorPalette(color));
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action || 'update';

    switch (action) {
      case 'update': {
        const config = updateBrandConfig(body.tenantId, body.updates, body.modifiedBy || 'user');
        return NextResponse.json({ config });
      }
      case 'publish': {
        const config = publishBrand(body.tenantId, body.publishedBy || 'user');
        if (!config) return NextResponse.json({ error: 'Brand config not found' }, { status: 404 });
        return NextResponse.json({ config });
      }
      case 'unpublish': {
        const success = unpublishBrand(body.tenantId);
        return NextResponse.json({ success });
      }
      case 'setup_domain': {
        const parsed = SetupDomainSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
        const domain = setupCustomDomain(parsed.data.tenantId, parsed.data.domain);
        return NextResponse.json({ domain }, { status: 201 });
      }
      case 'verify_domain': {
        const domain = verifyDomain(body.tenantId);
        return NextResponse.json({ domain });
      }
      case 'remove_domain': {
        const success = removeDomain(body.tenantId);
        return NextResponse.json({ success });
      }
      case 'update_css': {
        const validation = updateCustomCss(body.tenantId, body.css);
        return NextResponse.json(validation);
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
