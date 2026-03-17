import { NextResponse } from 'next/server';
import { configurePhoneAgent } from '@/lib/phone/vapi-agent';

export async function GET() {
  try {
    const result = configurePhoneAgent();

    return NextResponse.json({
      success: true,
      data: result,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Phone agent error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to configure phone agent' },
      { status: 500 }
    );
  }
}
