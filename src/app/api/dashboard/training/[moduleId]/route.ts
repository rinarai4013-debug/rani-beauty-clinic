import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getModuleBySlug, ROLE_LABELS, ROLE_COLORS } from '@/data/training/modules';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await params;
    const module = getModuleBySlug(moduleId);

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json({
      module: {
        ...module,
        roleLabel: ROLE_LABELS[module.role],
        roleColor: ROLE_COLORS[module.role],
      },
    });
  } catch (error) {
    console.error('Training module API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Record section completion / quiz score
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId } = await params;
    const module = getModuleBySlug(moduleId);

    if (!module) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const body = await req.json();
    const { sectionIndex, quizScore, action } = body;

    if (action === 'complete_section') {
      if (sectionIndex < 0 || sectionIndex >= module.sections.length) {
        return NextResponse.json({ error: 'Invalid section index' }, { status: 400 });
      }

      // In production, this would save to Airtable
      // For now, return success with the progress data
      return NextResponse.json({
        success: true,
        moduleId: module.id,
        slug: module.slug,
        sectionIndex,
        quizScore,
        passed: quizScore >= 80,
        staffId: session.username,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'complete_module') {
      return NextResponse.json({
        success: true,
        moduleId: module.id,
        slug: module.slug,
        completed: true,
        staffId: session.username,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Training module POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
