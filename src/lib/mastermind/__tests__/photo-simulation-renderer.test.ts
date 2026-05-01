import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import {
  isCompactInlineSourcePhoto,
  renderPhotoSimulationFrameImage,
} from '../photo-simulation-renderer';
import type { SimulationFrame } from '@/types/mastermind';

async function makeFaceDataUrl(): Promise<string> {
  const buffer = await sharp({
    create: {
      width: 120,
      height: 140,
      channels: 3,
      background: { r: 214, g: 176, b: 154 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="120" height="140"><ellipse cx="60" cy="70" rx="38" ry="48" fill="#d9aa90"/><circle cx="46" cy="61" r="4" fill="#3d2b24"/><circle cx="74" cy="61" r="4" fill="#3d2b24"/><path d="M45 92 Q60 103 75 92" stroke="#7c3f32" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
        ),
      },
    ])
    .jpeg({ quality: 80 })
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

function frame(monthNumber: number): SimulationFrame {
  return {
    kind: 'data-projection',
    imageDataUrl: '',
    timepoint: `${monthNumber}M`,
    monthNumber,
    description: 'projection',
    auraScoreProjection: 88,
    skinAgeProjection: 34,
  };
}

describe('photo simulation renderer', () => {
  it('recognizes compact inline Aura face previews', async () => {
    const dataUrl = await makeFaceDataUrl();
    expect(isCompactInlineSourcePhoto(dataUrl)).toBe(true);
  });

  it('creates unique photo-simulation frames from the same Aura face source', async () => {
    const dataUrl = await makeFaceDataUrl();
    const oneMonth = await renderPhotoSimulationFrameImage(dataUrl, 'with', frame(1));
    const twelveMonths = await renderPhotoSimulationFrameImage(dataUrl, 'with', frame(12));
    const noTreatment = await renderPhotoSimulationFrameImage(dataUrl, 'without', frame(60));

    expect(oneMonth?.kind).toBe('photo-simulation');
    expect(twelveMonths?.kind).toBe('photo-simulation');
    expect(noTreatment?.kind).toBe('photo-simulation');
    expect(oneMonth?.imageDataUrl).toMatch(/^data:image\/jpeg;base64,/);
    expect(new Set([
      oneMonth?.imageDataUrl,
      twelveMonths?.imageDataUrl,
      noTreatment?.imageDataUrl,
    ]).size).toBe(3);
  });
});
